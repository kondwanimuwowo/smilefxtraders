import { getResend, SENDERS, type SenderKey } from "./resend";

export interface EmailItem {
  from:    SenderKey;
  to:      string;
  subject: string;
  html:    string;
}

// Email is best-effort everywhere: a Resend outage must never fail a webhook
// ACK, a comment POST, or a cron pass. Log and move on.

export async function sendEmail(item: EmailItem): Promise<boolean> {
  try {
    const { error } = await getResend().emails.send({
      from:    SENDERS[item.from],
      to:      item.to,
      subject: item.subject,
      html:    item.html,
    });
    if (error) {
      console.error(`[email] send failed to ${item.to}:`, error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[email] send threw for ${item.to}:`, e instanceof Error ? e.message : e);
    return false;
  }
}

const BATCH_SIZE  = 100;  // Resend batch API limit
const BATCH_DELAY = 600;  // ms between chunks — stays under the 2 req/s default limit

export async function sendBatch(items: EmailItem[]): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const chunk = items.slice(i, i + BATCH_SIZE);
    try {
      const { error } = await getResend().batch.send(
        chunk.map((item) => ({
          from:    SENDERS[item.from],
          to:      item.to,
          subject: item.subject,
          html:    item.html,
        }))
      );
      if (error) {
        console.error(`[email] batch chunk failed (${chunk.length} emails):`, error.message);
        failed += chunk.length;
      } else {
        sent += chunk.length;
      }
    } catch (e) {
      console.error(`[email] batch chunk threw (${chunk.length} emails):`, e instanceof Error ? e.message : e);
      failed += chunk.length;
    }
    if (i + BATCH_SIZE < items.length) {
      await new Promise((r) => setTimeout(r, BATCH_DELAY));
    }
  }

  return { sent, failed };
}
