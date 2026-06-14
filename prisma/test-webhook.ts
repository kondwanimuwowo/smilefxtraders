/**
 * test-webhook.ts
 *
 * End-to-end audit of the Lenco webhook pipeline.
 * Verifies HMAC signature verification, subscription activation, and user plan upgrade.
 *
 * Usage:
 *   npx tsx prisma/test-webhook.ts
 */

import path from "node:path";
import { config } from "dotenv";

config({ path: path.join(process.cwd(), ".env") });
config({ path: path.join(process.cwd(), ".env.local"), override: true });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import crypto from "crypto";
import http from "node:http";

const connString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString: connString });
const prisma  = new PrismaClient({ adapter });

const WEBHOOK_SECRET = process.env.LENCO_WEBHOOK_SECRET ?? "";

// ── helpers ───────────────────────────────────────────────────────────────────

function sign(body: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

async function callWebhook(body: string, signature: string): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "localhost",
        port:     3000,
        path:     "/api/webhooks/lenco",
        method:   "POST",
        headers: {
          "Content-Type":       "application/json",
          "Content-Length":     Buffer.byteLength(body),
          "x-lenco-signature":  signature,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode ?? 0, body: data });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ── test runner ───────────────────────────────────────────────────────────────

async function main() {
  console.log("🧪 Lenco Webhook End-to-End Audit\n");

  if (!WEBHOOK_SECRET) {
    console.warn("⚠  LENCO_WEBHOOK_SECRET is not set — signature check is disabled in the route handler.");
    console.warn("   Set it in .env.local for a full security audit.\n");
  }

  // 1. Create isolated test user + pending subscription ──────────────────────
  const uid  = `wb_${Date.now()}`;
  const user = await prisma.user.create({
    data: {
      supabaseId: uid,
      name:       "Webhook Test User",
      username:   uid,
      email:      `${uid}@test.smilefx.local`,
      plan:       "FREE",
    },
  });
  console.log(`  ✓ Created test user: ${user.id} (plan=FREE)`);

  const reference = `smfx_pro_${user.id}_${Date.now()}`;
  const sub = await prisma.subscription.create({
    data: {
      userId:         user.id,
      plan:           "PRO",
      status:         "PENDING",
      lencoReference: reference,
      currency:       "ZMW",
      amountCents:    75000,
      billingCycle:   "monthly",
    },
  });
  console.log(`  ✓ Created pending subscription: ${sub.id}`);

  // 2. Build and sign webhook payload ─────────────────────────────────────────
  const payload = JSON.stringify({
    event: "collection.successful",
    data: {
      id:             "lenco_test_col_12345",
      reference,
      lencoReference: reference,
      amount:         "750.00",
      currency:       "ZMW",
      status:         "successful",
      type:           "mobile-money",
    },
  });

  const validSig   = WEBHOOK_SECRET ? sign(payload, WEBHOOK_SECRET) : "no-secret";
  const invalidSig = WEBHOOK_SECRET ? sign(payload + "tampered", WEBHOOK_SECRET) : "no-secret";

  console.log(`\n  📦 Webhook reference: ${reference}\n`);

  // 3. Test A — Tampered signature should be rejected (only when secret is set) ─
  if (WEBHOOK_SECRET) {
    const badRes = await callWebhook(payload, invalidSig).catch(() => null);
    if (badRes && badRes.status === 401) {
      console.log("  ✅ Test A PASS — Tampered signature correctly rejected (401)");
    } else {
      console.error(`  ❌ Test A FAIL — Expected 401, got ${badRes?.status}:`, badRes?.body);
    }
  } else {
    console.log("  ⏭  Test A SKIP — No LENCO_WEBHOOK_SECRET set (signature not enforced)");
  }

  // 4. Test B — Valid signature should be accepted and DB updated ─────────────
  const goodRes = await callWebhook(payload, validSig).catch(() => null);
  if (goodRes && goodRes.status === 200) {
    console.log("  ✅ Test B PASS — Valid payload accepted (200)");
  } else {
    console.error(`  ❌ Test B FAIL — Expected 200, got ${goodRes?.status}:`, goodRes?.body);
  }

  // 5. Verify DB state ────────────────────────────────────────────────────────
  const updatedSub  = await prisma.subscription.findUnique({ where: { id: sub.id } });
  const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

  const subOk  = updatedSub?.status === "ACTIVE";
  const userOk = updatedUser?.plan  === "PRO";

  console.log(`\n  DB check — subscription.status: ${updatedSub?.status}  ${subOk  ? "✅" : "❌"} (expected: ACTIVE)`);
  console.log(`  DB check — user.plan:            ${updatedUser?.plan}   ${userOk ? "✅" : "❌"} (expected: PRO)`);
  if (updatedSub?.startedAt && updatedSub?.renewsAt) {
    const renewsIn = Math.round((updatedSub.renewsAt.getTime() - Date.now()) / 86400000);
    console.log(`  DB check — renewsAt: ${updatedSub.renewsAt.toISOString()} (~${renewsIn} days from now)  ✅`);
  }

  // 6. Test C — Duplicate webhook should be a no-op ──────────────────────────
  const dupRes = await callWebhook(payload, validSig).catch(() => null);
  if (dupRes && dupRes.status === 200) {
    console.log("\n  ✅ Test C PASS — Duplicate webhook handled gracefully (200 no-op)");
  } else {
    console.error(`  ❌ Test C FAIL — Duplicate webhook should return 200, got ${dupRes?.status}`);
  }

  // 7. Cleanup ────────────────────────────────────────────────────────────────
  await prisma.subscription.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  console.log("\n  🧹 Test data cleaned up.");

  const allPassed = subOk && userOk;
  if (allPassed) {
    console.log("\n✅ Webhook audit complete — all checks passed!");
  } else {
    console.error("\n❌ Webhook audit completed with failures. Check output above.");
    process.exit(1);
  }
}

main()
  .catch((e) => { console.error("Audit crashed:", e); process.exit(1); })
  .finally(() => prisma.$disconnect());
