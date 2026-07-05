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
  // Dotted-name pattern often used by bots to generate unique-looking addresses.
  if (/^[a-z0-9](\.[a-z0-9])+$/.test(local)) return true;
  if (/^(test|fake|spam|bot|admin|noreply|donotreply)/.test(local)) return true;
  return false;
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
  ip: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();

  if (isDisposableDomain(normalized)) {
    return { ok: false, error: "Please sign up with a permanent email address." };
  }
  if (looksSuspicious(normalized)) {
    return { ok: false, error: "That email address doesn't look valid. Please use a real address." };
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
