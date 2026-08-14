import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Prisma's generated client — 45k lines across 33 files. Type-aware
    // linting it exhausted the V8 heap ("Ineffective mark-compacts near heap
    // limit"), so `npm run lint` crashed instead of reporting: the script
    // exited non-zero with no findings, which is easy to mistake for a pass
    // when the output is piped. Never lint generated output.
    "src/generated/**",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
