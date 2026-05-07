#!/usr/bin/env node
/**
 * tools/build-all.mjs — `tsc -p tsconfig.json` followed by `tools/build.mjs`,
 * with type errors treated as informational (not build-blocking).
 *
 * Why: same philosophy as vugg-simulator's build pipeline (this code is
 * derived from it). tsc may report errors during iterative development;
 * those should remain visible but must not stop the splice step,
 * otherwise index.html falls behind the source tree.
 *
 * Layout:
 *   tsc -p tsconfig.json    →   dist/**\/*.js   (still emits even with errors)
 *   tools/build.mjs         →   inlines dist/**\/*.js into index.html
 *
 * Pass --check to forward to tools/build.mjs (CI guard for stale index.html).
 */

import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

const TSC_ENTRY = join(ROOT, "node_modules", "typescript", "bin", "tsc");

console.log("[build-all] running tsc…");
const tsc = spawnSync(process.execPath, [TSC_ENTRY, "-p", "tsconfig.json"], {
  cwd: ROOT,
  stdio: "inherit",
});
if (tsc.status !== 0) {
  console.warn(
    `[build-all] tsc reported errors (exit ${tsc.status}) — continuing anyway. Fix them iteratively.`
  );
}

console.log("[build-all] running tools/build.mjs…");
const args = ["tools/build.mjs", ...process.argv.slice(2)];
const splice = spawnSync(process.execPath, args, {
  cwd: ROOT,
  stdio: "inherit",
});
process.exit(splice.status ?? 1);
