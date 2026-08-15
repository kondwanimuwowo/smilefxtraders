import { redis } from "@/lib/redis";

const DISPOSABLE_DOMAINS = new Set([
  "tempmail.com", "guerrillamail.com", "mailinator.com", "yopmail.com",
  "10minutemail.com", "throwawaymail.com", "trashmail.com", "getnada.com",
  "fakeinbox.com", "sharklasers.com", "dispostable.com", "mintemail.com",
  "mailnesia.com", "mohmal.com", "maildrop.cc", "moakt.com",
]);

function isDisposableDomain(email: string): boolean {
  const domain = email.split("@")[1];
  return !!domain && DISPOSABLE_DOMAINS.has(domain);
}

function looksSuspicious(email: string): boolean {
  const local = email.split("@")[0];
  if (!local) return true;
  // Dotted-name evasion: Gmail ignores dots, so a bot turns one mailbox into
  // unlimited unique-looking addresses.
  //
  // The previous pattern was /^[a-z0-9](\.[a-z0-9])+$/ -- one character per
  // segment -- so it only ever matched "a.b.c" and caught none of the real
  // attack. Every address in the 2026-07 flood had multi-character segments
  // ("c.a.r.o.l.ke.ll2.7", "mcg.hez.e.rj", "st.ac.i.f.o.x.8.9"). Requiring 4+
  // segments of any length catches those while leaving ordinary addresses
  // like "tim.proudfoot" or "mary.jane.watson" alone.
  if (/^[a-z0-9]+(\.[a-z0-9]+){3,}$/.test(local)) return true;
  if (/^(test|fake|spam|bot|admin|noreply|donotreply)/.test(local)) return true;
  return false;
}

/**
 * Detects the random-string names the 2026-07 signup flood used.
 *
 * Every one of the 125 bot accounts carried garbage in full_name and
 * username -- "QUhFvSBCeMuDHSzsjQ", "mXbQnOhYdNDaFWnqvEg" -- while the email
 * addresses were harvested real ones and often looked perfectly legitimate.
 * That makes this a far stronger signal than anything derivable from the
 * address itself.
 *
 * The test is uppercase letters appearing *mid-word*. People capitalise the
 * start of a name and nothing else; "McDonald" and "O'Brien" have exactly
 * one, never several. Deliberately chosen over vowel-ratio or
 * consonant-run heuristics, which risk rejecting the Zambian and wider
 * African names this platform exists to serve -- Mwansa, Bwalya, Chipo,
 * Kondwani and Likando all pass cleanly.
 */
function looksMachineGenerated(value: string): boolean {
  const v = value.trim();
  if (v.length < 8) return false; // too short to judge fairly
  return (v.match(/[a-z][A-Z]/g) ?? []).length >= 3;
}

async function checkRateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (!redis) return true; // fail open: Upstash not configured yet
  try {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, windowSeconds);
    return count <= max;
  } catch {
    return true; // fail open on Redis errors
  }
}

export async function validateSignupSecurity(
  email: string,
  ip: string,
  profile?: { name?: string; username?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();

  if (isDisposableDomain(normalized)) {
    return { ok: false, error: "Please sign up with a permanent email address." };
  }
  if (looksSuspicious(normalized)) {
    return { ok: false, error: "That email address doesn't look valid. Please use a real address." };
  }
  // Checked before the rate limits: this is the signal that actually caught
  // the 2026-07 flood, and it costs nothing (no Redis round trip).
  if (
    (profile?.name && looksMachineGenerated(profile.name)) ||
    (profile?.username && looksMachineGenerated(profile.username))
  ) {
    console.warn(`[bot-protection] rejected machine-generated profile for ${normalized}`);
    return { ok: false, error: "That name doesn't look valid. Please use your real name." };
  }

  const ipOk = await checkRateLimit(`rate-limit:signup:ip:${ip}`, 10, 3600);
  if (!ipOk) {
    return { ok: false, error: "Too many signup attempts from this network. Please try again in an hour." };
  }

  const emailOk = await checkRateLimit(`rate-limit:signup:email:${normalized}`, 3, 3600);
  if (!emailOk) {
    return { ok: false, error: "Too many attempts with this email. Please try again in an hour." };
  }

  return { ok: true };
}
