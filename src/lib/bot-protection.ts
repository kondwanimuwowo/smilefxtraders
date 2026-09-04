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

// Accented vowels included so European and transliterated African names are
// scored fairly rather than looking consonant-heavy.
const VOWELS = /[aeiouáéíóúàèìòùâêîôûäëïöüãõåø]/gi;

function vowelRatio(value: string): number {
  const letters = value.replace(/[^\p{L}]/gu, "");
  return letters.length ? (letters.match(VOWELS) ?? []).length / letters.length : 0;
}

/**
 * A real person's name: letters, plus the separators names actually contain.
 * Digits, underscores and symbols are not name characters.
 *
 * \p{L} rather than [a-z] deliberately — this platform serves Zambia and the
 * wider continent, and an ASCII-only rule would reject legitimate accented
 * and non-Latin names outright.
 */
const NAME_CHARS = /^[\p{L}][\p{L}\s'’.-]*$/u;

/**
 * Detects the random-string names the 2026-07 signup flood used.
 *
 * Every one of the 125 bot accounts carried garbage in full_name and
 * username -- "QUhFvSBCeMuDHSzsjQ", "mXbQnOhYdNDaFWnqvEg" -- while the email
 * addresses were harvested real ones that often looked perfectly legitimate.
 * That makes the profile a far stronger signal than the address.
 *
 * Four independent signals, any one of which rejects. Mid-word capitals alone
 * caught the observed sample, but an all-lowercase generator ("xkqjvmzptrbn")
 * would walk straight past it, so vowel density and consonant runs cover that.
 *
 * Every threshold here was tuned against real names rather than guessed, with
 * particular care that the Zambian and wider African names this platform
 * exists to serve are never rejected: Mwansa Bwalya, Ng'andu Simukonda,
 * Nsofwa Chishimba, Chukwuemeka Okonkwo and Oluwaseun Adeyemi all pass, as do
 * Krzysztof Wojciechowski and Anastasia Konstantinopoulos.
 */
function looksMachineGenerated(value: string, kind: "name" | "username"): boolean {
  const v = value.trim();
  if (v.length < 8) return false; // too short to judge fairly
  const letters = v.replace(/[^\p{L}]/gu, "");

  // 1. Capitals mid-word. People capitalise the start of a name and nothing
  //    else; "McDonald" and "O'Brien" have exactly one, never several.
  if ((v.match(/[a-z][A-Z]/g) ?? []).length >= 3) return true;

  // 2. Implausible vowel density. Real names sit around 30-45%; the bot
  //    strings land near 15%. Bounds kept wide so consonant-heavy names like
  //    Krzysztof (22%) are comfortably inside.
  if (letters.length >= 10) {
    const r = vowelRatio(v);
    if (r < 0.18 || r > 0.75) return true;
  }

  // 3. Six or more consecutive consonants. Occurs in generated strings, not
  //    in names — "Chishimba" and "Wojciechowski" top out well below this.
  if (/[bcdfghjklmnpqrstvwxz]{6,}/i.test(v)) return true;

  // 4. Name-only rules. A username is a single token by nature and may hold
  //    digits and underscores, so neither applies there.
  if (kind === "name") {
    // No human writes a 16-character unbroken full name.
    if (!/\s/.test(v) && v.length >= 16) return true;
    if (!NAME_CHARS.test(v)) return true;
  }

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
  if (profile?.name && looksMachineGenerated(profile.name, "name")) {
    console.warn(`[bot-protection] rejected machine-generated name for ${normalized}`);
    return { ok: false, error: "That name doesn't look valid. Please enter your real name." };
  }
  if (profile?.username && looksMachineGenerated(profile.username, "username")) {
    console.warn(`[bot-protection] rejected machine-generated username for ${normalized}`);
    return { ok: false, error: "That username doesn't look valid. Please choose another." };
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

// Same disposable-domain/suspicious-pattern/rate-limit checks as signup, but
// its own rate-limit keys -- the waitlist form is a different, unauthenticated
// surface, and sharing signup's bucket would let waitlist spam lock someone
// out of actually signing up later (or vice versa).
export async function validateWaitlistSecurity(
  email: string,
  ip: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const normalized = email.trim().toLowerCase();

  if (isDisposableDomain(normalized)) {
    return { ok: false, error: "Please use a permanent email address." };
  }
  if (looksSuspicious(normalized)) {
    return { ok: false, error: "That email address doesn't look valid. Please use a real address." };
  }

  const ipOk = await checkRateLimit(`rate-limit:waitlist:ip:${ip}`, 10, 3600);
  if (!ipOk) {
    return { ok: false, error: "Too many attempts from this network. Please try again in an hour." };
  }

  const emailOk = await checkRateLimit(`rate-limit:waitlist:email:${normalized}`, 3, 3600);
  if (!emailOk) {
    return { ok: false, error: "Too many attempts with this email. Please try again in an hour." };
  }

  return { ok: true };
}
