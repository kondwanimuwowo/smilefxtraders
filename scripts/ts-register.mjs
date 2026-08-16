// Lets `node --experimental-strip-types` run the repo's .ts sources directly.
//
// TypeScript writes extensionless relative specifiers ("./protobuf"), which
// node:module's resolver rejects. This hook retries with .ts appended, so a
// check script can import the real modules rather than a drifting copy.
//
// Only used by the check: scripts in package.json — never by the app build.
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
      export async function resolve(specifier, context, next) {
        if (specifier.startsWith("./") || specifier.startsWith("../")) {
          try { return await next(specifier, context); }
          catch { return await next(specifier + ".ts", context); }
        }
        return next(specifier, context);
      }
    `),
  import.meta.url,
);
