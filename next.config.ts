import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // These ship workerd-specific conditional exports (separate code paths for
  // the Workers runtime) — bundling them defeats that and breaks resolution
  // under OpenNext's Cloudflare build. See cloudflare/howtos/workerd.
  // "jose" (JWT verification, used internally by Supabase's auth SDK) must
  // stay external too — bundling it breaks its WebCrypto/Node crypto
  // branching under workerd, causing getUser()'s server-side JWT
  // verification to fail intermittently on Cloudflare. See the equivalent
  // fix in payloadcms/payload#15094.
  serverExternalPackages: ["pg-cloudflare", "@prisma/client", ".prisma/client", "postgres", "jose"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
