import { Redis } from "@upstash/redis";

// Null (not thrown) when Upstash isn't configured, so callers can fail open
// during local dev / before the env vars are set in Vercel.
export const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;
