// Wraps the OpenNext-generated Next.js Worker to also expose the
// SpotwareFeed Durable Object (persistent cTrader Open API connection —
// see src/durable-objects/SpotwareFeed.ts and cloudflare_migration_plan.md
// Phase 4). wrangler.jsonc points "main" at this file instead of
// .open-next/worker.js directly, per OpenNext's custom-worker howto.
// This file is excluded from the app's tsconfig — .open-next/worker.js
// only exists after the Cloudflare build runs, not in local dev.

// @ts-expect-error — generated at build time, not present in local checkout
import { default as handler } from "./.open-next/worker.js";

export { SpotwareFeed } from "./src/durable-objects/SpotwareFeed";

export default {
  fetch: handler.fetch,
};
