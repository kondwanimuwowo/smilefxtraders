// Prints the ctidTraderAccountId of every account the Spotware refresh token
// authorises. Run with:
//
//     npm run spotware:accounts
//
// Why this exists: the cTrader ID portal lists accounts by *trader login*
// ("Raw Trading Ltd - Live - 1078751"), but ProtoOAAccountAuthReq wants the
// internal ctidTraderAccountId, which that page never shows. Using the login
// gets you "INVALID_REQUEST Trading account is not authorized" with no hint
// that the two are different numbers.
//
// Reads credentials from .env/.env.local and prints only account identifiers —
// never the tokens themselves.

import { config } from "dotenv";
import tls from "node:tls";
import {
  applicationAuthReq, accountListReq, splitFrames, decodeFrame,
  parseAccountList, parseErrorRes, PAYLOAD,
} from "../src/lib/spotware/messages";

config({ path: ".env" });
config({ path: ".env.local", override: true });

const HOST = process.env.SPOTWARE_HOST || "live.ctraderapi.com";
const PORT = 5035;
const TOKEN_URL = "https://openapi.ctrader.com/apps/token";

const clientId     = process.env.SPOTWARE_CLIENT_ID;
const clientSecret = process.env.SPOTWARE_CLIENT_SECRET;
const refreshToken = process.env.SPOTWARE_REFRESH_TOKEN;
const configured   = process.env.SPOTWARE_CTID_ACCOUNT_ID;

if (!clientId || !clientSecret || !refreshToken) {
  console.error("Missing SPOTWARE_CLIENT_ID / SPOTWARE_CLIENT_SECRET / SPOTWARE_REFRESH_TOKEN in .env.local");
  process.exit(1);
}

const url = new URL(TOKEN_URL);
url.searchParams.set("grant_type", "refresh_token");
url.searchParams.set("refresh_token", refreshToken);
url.searchParams.set("client_id", clientId);
url.searchParams.set("client_secret", clientSecret);

const tokenRes = await fetch(url.toString(), { method: "POST" });
if (!tokenRes.ok) {
  console.error(`Token refresh failed: ${tokenRes.status} ${(await tokenRes.text()).slice(0, 300)}`);
  process.exit(1);
}
// cTrader answers failures with HTTP 200 and an errorCode in the body, so the
// status alone tells you nothing.
const tokenBody = (await tokenRes.json()) as {
  access_token?: string; refresh_token?: string; errorCode?: string; description?: string;
};
const { access_token: accessToken, refresh_token: rotated } = tokenBody;

if (!accessToken) {
  console.error(`Token refresh returned no access_token: ${tokenBody.errorCode ?? "?"} ${tokenBody.description ?? ""}`);
  console.error(
    "\nIf this says the refresh token is invalid: cTrader rotates it on every use, and the deployed\n" +
    "Durable Object persists the rotated value in its own storage. The copy in .env.local is then\n" +
    "stale. Re-authorise at connect.spotware.com to mint a fresh token, then set it in BOTH places.",
  );
  process.exit(1);
}
console.log(`Access token obtained. Connecting to ${HOST}:${PORT}…\n`);

// cTrader rotates the refresh token on every use. This script spending one
// without saying so would leave the deployed secret stale and the feed broken
// in a new way.
if (rotated && rotated !== refreshToken) {
  console.log("NOTE: the refresh token was rotated by this call. Update it everywhere:");
  console.log("      npx wrangler secret put SPOTWARE_REFRESH_TOKEN");
  console.log("      …and the SPOTWARE_REFRESH_TOKEN line in .env.local\n");
}

const socket = tls.connect({ host: HOST, port: PORT }, () => {
  socket.write(applicationAuthReq(clientId, clientSecret));
  socket.write(accountListReq(accessToken));
});

let buffer: Uint8Array<ArrayBufferLike> = new Uint8Array(0);
const timer = setTimeout(() => {
  console.error("Timed out waiting for the account list.");
  socket.destroy();
  process.exit(1);
}, 20_000);

socket.on("data", (chunk: Buffer) => {
  const merged = new Uint8Array(buffer.length + chunk.length);
  merged.set(buffer);
  merged.set(new Uint8Array(chunk), buffer.length);
  const { frames, rest } = splitFrames(merged);
  buffer = rest;

  for (const frame of frames) {
    const msg = decodeFrame(frame);

    if (msg.payloadType === PAYLOAD.OA_ERROR_RES) {
      const err = parseErrorRes(msg);
      console.error(`Broker error: ${err.errorCode} ${err.description ?? ""}`);
      clearTimeout(timer);
      socket.destroy();
      process.exit(1);
    }

    if (msg.payloadType === PAYLOAD.OA_GET_ACCOUNTS_BY_TOKEN_RES) {
      const accounts = parseAccountList(msg);
      clearTimeout(timer);

      if (accounts.length === 0) {
        console.error("This token authorises no trading accounts. Re-run the OAuth consent at connect.spotware.com and tick the account.");
        socket.destroy();
        process.exit(1);
      }

      console.log(`${accounts.length} authorised account(s):\n`);
      for (const a of accounts) {
        console.log(`  ctidTraderAccountId : ${a.ctidTraderAccountId}   <-- SPOTWARE_CTID_ACCOUNT_ID`);
        console.log(`  trader login        : ${a.traderLogin ?? "?"}   (what the cTrader ID portal shows)`);
        console.log(`  environment         : ${a.isLive ? "LIVE" : "DEMO"}   -> ${a.isLive ? "live" : "demo"}.ctraderapi.com`);
        if (a.broker) console.log(`  broker              : ${a.broker}`);
        console.log("");
      }

      const match = accounts.find((a) => String(a.ctidTraderAccountId) === configured);
      if (configured && !match) {
        const asLogin = accounts.find((a) => String(a.traderLogin) === configured);
        console.log(
          asLogin
            ? `SPOTWARE_CTID_ACCOUNT_ID is currently ${configured}, which is a trader LOGIN, not a ctidTraderAccountId.\nSet it to ${asLogin.ctidTraderAccountId} instead.`
            : `SPOTWARE_CTID_ACCOUNT_ID is currently ${configured}, which is none of the above. Set it to one of the ids listed.`,
        );
      } else if (match) {
        console.log(`SPOTWARE_CTID_ACCOUNT_ID=${configured} is correct.`);
      }

      socket.destroy();
      process.exit(0);
    }
  }
});

socket.on("error", (e) => {
  console.error(`Socket error: ${e.message}`);
  process.exit(1);
});
