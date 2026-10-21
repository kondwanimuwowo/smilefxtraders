import { defineEvlog } from "evlog";

/**
 * The one evlog configuration. src/lib/evlog.ts reads it twice: once for the
 * per-request logger (createEvlog) and once for the server-startup hooks
 * (createInstrumentation), so sampling, enrichment and the service name all
 * live in a single file instead of being written twice for two integrations.
 */
export default defineEvlog({
  service: "smile-fx-traders",

  // Nothing is head-sampled out yet: every wrapped handler keeps every event.
  // These are the keep rules that guarantee failed and slow requests survive
  // once sampling.rates is turned on to feed a paid drain.
  sampling: {
    keep: [
      { status: 400 }, // failed requests, kept whatever the level
      { duration: 1000 }, // anything slower than a second
    ],
  },

  // Deployed as Cloudflare Workers through OpenNext, which sets neither of
  // these; both exist when the same build runs on Vercel. `deploymentId` is
  // the cheapest way to tell two deploys apart when reading events back.
  enrich: (ctx) => {
    ctx.event.deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
    ctx.event.region = process.env.VERCEL_REGION;
  },
});
