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
//
//   v2 — catalog expansion + evidence-level refinement (2026-05-07):
//        +12 minerals (covellite, cuprite, native_copper, posnjakite,
//        cerussite, galena, hydrozincite, sphalerite, pyrite, goethite,
//        jarosite, native_silver) — adds the sulfide and native
//        classes and completes the chemistry-flip suite for Cu / Pb /
//        Zn / Fe (each metal now has 3+ phases across acid /
//        methanogenic / alkaline / burn windows). Schema bumped to 0.2.0:
//        documented_in_landfills (binary) replaced by evidence_level
//        (4-valued: landfill_specific | anthropogenic_documented |
//        geological_analog | chemistry_predicted). All v1 entries
//        re-evaluated under stricter evidence policy — several flipped
//        from documented:true to anthropogenic_documented because
//        Hazen 2017 catalog presence is not the same as a peer-reviewed
//        landfill case study. Total catalog: 23 minerals. Distribution:
//        7 landfill_specific, 9 anthropogenic_documented, 4 geological_analog,
//        3 chemistry_predicted. Still text-only; no engine.

const WASTELAND_VERSION = "v2";
