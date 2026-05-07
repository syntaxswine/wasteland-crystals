// ============================================================
// js/15-version.ts — WASTELAND_VERSION + per-bump engine-drift history
// ============================================================
//
// Monotonic version tag bumped by any change that could shift seed-42
// output for any scenario. Mirrors the SIM_VERSION pattern from
// vugg-simulator (this codebase derives from that one).
//
// Bump rule: any change to chemistry math, nucleation gates, growth
// engines, or scenario initial conditions must bump WASTELAND_VERSION
// and regenerate baselines.
//
//   v0 — empty skeleton (2026-05-07): build pipeline online, no minerals,
//        no scenarios, no engine. Verifies tsc + tools/build.mjs work
//        on an empty source tree. First mineral (goslarite ZnSO4·7H2O
//        on galvanized steel) is the next step.

const WASTELAND_VERSION = "v0";
