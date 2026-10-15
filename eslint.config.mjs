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
    // Worker MapLibre copié au postinstall (fichier minifié tiers)
    "public/**",
    // Builds de la démo continue (scripts/demo-continue.sh)
    ".next-live/**",
    ".next-pret/**",
  ]),
]);

export default eslintConfig;
