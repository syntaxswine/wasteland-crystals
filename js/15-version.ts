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
//
//   v0.5 — vector cross-section schematic (2026-05-07): inline SVG
//          rendering of the canonical secure-landfill cell — cap stack,
//          waste lifts (phase-tinted), leachate collection layer, base
//          liner, gas wells, monitoring wells, sump, water table, depth
//          scale, layer leader-labels, title block. Hardcoded
//          DEFAULT_SCHEMATIC; no PileState wiring yet.
//
//   v1 — text/data spine (2026-05-07): canonical mineral catalog at
//        data/minerals.json with 11 anthropogenic minerals across 6
//        classes (goslarite, simonkolleite, malachite, atacamite,
//        anglesite, pyromorphite, struvite, ettringite, vivianite,
//        calcite, tenorite). Schema fields documented inline; every
//        entry carries citations and a documented_in_landfills flag
//        distinguishing observed vs chemistry-predicted phases.
//        TS types declared in 00-mineral-spec.ts; loader fetches at
//        boot and assigns global MINERAL_SPEC. No engine yet — this
//        is the bedrock that engine layers will read from.

const WASTELAND_VERSION = "v1";
