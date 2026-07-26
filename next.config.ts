import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // These ship workerd-specific conditional exports (separate code paths for
  // the Workers runtime) — bundling them defeats that and breaks resolution
  // under OpenNext's Cloudflare build. See cloudflare/howtos/workerd.
  serverExternalPackages: ["pg-cloudflare", "@prisma/client", ".prisma/client", "postgres"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
