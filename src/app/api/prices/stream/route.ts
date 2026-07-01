export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getInstruments } from "@/lib/server/getInstruments";

const TD_SUBSCRIBE_FALLBACK = "EUR/USD,GBP/USD,USD/JPY,USD/CHF,AUD/USD,NZD/USD,USD/CAD,XAU/USD,IXIC,DXY";
const DISPLAY_FALLBACK: Record<string, string> = {
  "EUR/USD": "EURUSD",
  "GBP/USD": "GBPUSD",
  "USD/JPY": "USDJPY",
  "USD/CHF": "USDCHF",
  "AUD/USD": "AUDUSD",
  "NZD/USD": "NZDUSD",
  "USD/CAD": "USDCAD",
  "XAU/USD": "XAUUSD",
  IXIC:      "NAS100",
  DXY:       "DXY",
};

function fmt(price: number, tdSym: string): string {
  if (tdSym === "IXIC" || price > 1000) return price.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (price > 10) return price.toFixed(2);
  return price.toFixed(5);
}

export async function GET() {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return new Response("No API key", { status: 503 });

  const instruments = await getInstruments().catch(() => []);
  const tdInstruments = instruments.filter((i) => i.tdSymbol != null);
  const TD_SUBSCRIBE = tdInstruments.length
    ? tdInstruments.map((i) => i.tdSymbol!).join(",")
    : TD_SUBSCRIBE_FALLBACK;
  const DISPLAY: Record<string, string> = tdInstruments.length
    ? Object.fromEntries(tdInstruments.map((i) => [i.tdSymbol!, i.symbol]))
    : DISPLAY_FALLBACK;

  const enc = new TextEncoder();
  let ws: WebSocket | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const body = new ReadableStream({
    start(ctrl) {
      function push(data: string) {
        try { ctrl.enqueue(enc.encode(`data: ${data}\n\n`)); } catch { /* closed */ }
      }

      ws = new WebSocket(`wss://ws.twelvedata.com/v1/quotes/price?apikey=${apiKey}`);

      ws.onopen = () => {
        ws!.send(JSON.stringify({ action: "subscribe", params: { symbols: TD_SUBSCRIBE } }));
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data as string) as Record<string, unknown>;
          if (msg.event === "price" && typeof msg.symbol === "string" && typeof msg.price === "number") {
            const sym = DISPLAY[msg.symbol];
            if (sym) push(JSON.stringify({ sym, price: fmt(msg.price, msg.symbol) }));
          }
        } catch { /* ignore */ }
      };

      ws.onerror = () => { try { ctrl.close(); } catch { /* already closed */ } };
      ws.onclose = () => {
        if (heartbeat) clearInterval(heartbeat);
        try { ctrl.close(); } catch { /* already closed */ }
      };

      // Keep the connection alive through proxies
      heartbeat = setInterval(() => {
        try { ctrl.enqueue(enc.encode(": ping\n\n")); } catch {
          if (heartbeat) clearInterval(heartbeat);
        }
      }, 20_000);
    },

    cancel() {
      if (heartbeat) clearInterval(heartbeat);
      ws?.close();
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type":  "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection":    "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
