import { defineNodeInstrumentation } from "evlog/next/instrumentation";

// Next resolves instrumentation.ts at the project root or under src/, and
// evaluates it in both runtimes. The loader form (a dynamic import instead of
// an options object) is what keeps everything lib/evlog.ts pulls in — the
// evlog config, and any Node-only drain added to it later — out of the Edge
// bundle that src/middleware.ts runs in: defineNodeInstrumentation loads the
// module itself only when NEXT_RUNTIME is nodejs.
//
// register() starts the logger before the first request (and, with
// captureOutput, turns console output into structured events); onRequestError
// reports every error that escapes a route, page or render.
export const { register, onRequestError } = defineNodeInstrumentation(
  () => import("./lib/evlog"),
);
