import { toLoggerConfig } from "evlog";
import { createEvlog } from "evlog/next";
import { createInstrumentation } from "evlog/next/instrumentation/create";
import config from "../../evlog.config";

// Server startup + unhandled request errors. Next calls register() once per
// boot — that is what actually starts the logger — and onRequestError() for
// every error that escapes a route, page or render, including SSR and RSC,
// which never pass through withEvlog().
//
// captureOutput re-emits what gets written to stdout/stderr (every
// console.error in a catch block across this codebase) as structured events,
// so those land in the same channel as the wide events below instead of
// dying in whatever terminal the process happens to be attached to.
export const { register, onRequestError } = createInstrumentation({
  ...toLoggerConfig(config),
  captureOutput: true,
});

// Per-request wide events: one request = one event, with context layered on
// by the handler as it goes. Route handlers and server actions import from
// here — see src/app/api/fx-orders/route.ts for the smallest example.
export const { withEvlog, useLogger, log, createError } = createEvlog(config);
