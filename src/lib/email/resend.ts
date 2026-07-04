import { Resend } from "resend";

// Sender identities — all on the verified smilefxtraders.com Resend domain.
// accounts@ → auth/account emails, hello@ → platform/billing/reports,
// kondwani@ → personal instructor emails, support@ → support flows.
export const SENDERS = {
  accounts: "Smile FX Traders <accounts@smilefxtraders.com>",
  hello:    "Smile FX Traders <hello@smilefxtraders.com>",
  kondwani: "Kondwani from Smile FX Traders <kondwani@smilefxtraders.com>",
  support:  "Smile FX Traders Support <support@smilefxtraders.com>",
} as const;

export type SenderKey = keyof typeof SENDERS;

// Lazy singleton — instantiating at module scope can run before env vars are
// loaded in some route contexts (same reason webhooks/lenco uses getDb()).
let client: Resend | null = null;

export function getResend(): Resend {
  if (!client) client = new Resend(process.env.RESEND_API_KEY);
  return client;
}
