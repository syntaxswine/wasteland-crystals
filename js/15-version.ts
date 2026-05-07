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
//
//   v3 — scenario spine (2026-05-07): canonical ELFM scenario catalog at
//        data/scenarios.json. Two NEW-MINE European cells anchor the
//        opening set: Mont-Saint-Guibert (BE) at landfill_specific
//        evidence (Garcia Lopez Detritus 8 — direct SEM-EDS phase
//        identifications: pyromorphite + sphalerite + metallic Pb +
//        Fe-Zn alloy in <4.5 mm fines), and Halbenrain (AT) at
//        program_synthesis evidence (Hernandez Parrodi Processes 2021
//        — multi-site review). Each scenario carries site metadata,
//        substrate inventory, characteristic leachate chemistry, and
//        an expected_species map keying mineral catalog entries to a
//        per-scenario evidence_role (directly_observed |
//        implied_by_substrate_chemistry | predicted_from_program_synthesis).
//        Schema fields documented inline; loader fetches at boot and
//        assigns global SCENARIO_SPEC. Scenarios are the cells the
//        future-landfill-miner is working today (per proposal §
//        'Update 2026-05-07: Operative narrative frame'). Still no
//        engine — this is the second bedrock layer (after v1/v2's
//        mineral spine) the engine layers will read from.
//
//   v4 — chemistry-zone spine (2026-05-07): canonical zone catalog at
//        data/zones.json; the trapezoid (cell pit) decomposed into six
//        chemistry territories per the boss's 2026-05-07 design framing
//        (trapezoid-as-vugg-wall, depth × centrality). Zones:
//        cap_contact (oxidizing top band) | acidogenic_horizon (acidic
//        upper-mid, only present in young cells) | methanogenic_core
//        (reducing center bulk, the boss's 'middle concentration zone')
//        | wall_contact_flank (slanted band along interior walls, the
//        'edges' — drainage-oxidized) | stable_basal (deep center,
//        late paragenesis) | lcs_biofilm (engineered LCS layer with
//        biofilm scaling chemistry — pulled out as its own zone per
//        the design conversation, NOT collapsed into 'down deep').
//        Schema: position_class (depth_band | wall_band | bottom_strip)
//        + per-class geometry parameters + typical_phase + typical_redox
//        + characteristic_ions + expected_mineral_clusters (catalog
//        IDs that nucleate here IF substrate is locally present). The
//        renderer overlays zones on the schematic as semi-transparent
//        chemistry tints with dashed boundaries and in-zone labels;
//        the schematic stops being just architecture and starts
//        showing chemistry territory. Engine bump: zones gate
//        nucleation (per minerals.json substrate × per scenario
//        chemistry × per zone phase, all three axes) — even though
//        no engine math runs yet, defining zones changes which
//        minerals will nucleate where when it does.
//
//   v5 — per-scenario filtering + crystal dots (2026-05-07): scenarios
//        gain an active_zones field declaring which zones run active
//        chemistry at the snapshot. Mont-Saint-Guibert (stable phase,
//        30 yrs) → 5 zones active, acidogenic_horizon dropped (long
//        since drained into the methanogenic front). Halbenrain
//        (methanogenic phase, 25 yrs) → 5 zones active, stable_basal
//        dropped (late paragenesis hasn't matured yet). Renderer
//        accepts an opts object {zoneSpec, scenario} — scenario
//        filters zone tints/labels to active_zones, and triggers
//        crystal-dot generation. Crystal dots: deterministic (mulberry32
//        seeded by hash(scenario_id + mineral_id + zone_id)) so the
//        same cell always presents the same paragenesis. Dot count
//        scales with evidence_role (directly_observed=6, implied=4,
//        predicted=2 per matching zone). Per-mineral colors carried
//        in 03-crystal-positions.ts MINERAL_COLORS palette. CRITICAL
//        DESIGN NOTE: dots use the FULL zoneSpec for placement (not
//        active_zones) — a relict crystal nucleated in a zone that
//        has since waned still persists physically; the future-miner
//        sees ACCUMULATED paragenesis. active_zones = current chemistry
//        territory (tint); dots = accumulated mineralogy (history).
//        The two systems compose, they don't gate each other. Boot
//        adds a scenario-selector nav above the schematic
//        ([OVERVIEW] [MONT-SAINT-GUIBERT] [HALBENRAIN]); clicking
//        re-renders. OVERVIEW shows all zones, no crystals.

//   v6 — narrator + precursor-origin spine (2026-05-07): clicking a
//        crystal opens an examination panel that renders the mineral's
//        paragenesis as a causal chain, composed from data-tagged
//        precursor origins. The boss's framing: 'when examining the
//        crystal you get the paragenesis. something like "acids from
//        x broke down the copper from x which redeposited and formed
//        malachite"'. Boss follow-up: 'i think the units of precursor
//        chemicals will have to have origins attached to them to get
//        an accurate paragenesis.' Implementation:
//        - data/precursors.json — 21 precursor entries, each tagged
//          with source_substrate (matching scenarios.json substrate_
//          inventory tokens), chemical species, decay_mechanism, and
//          phase_window. The narrator looks up each precursor in
//          mineral.decay_precursor against this spec.
//        - scenarios.json substrate_inventory entries gain
//          evidence_basis: 'documented' | 'implied_typical_msw'. Both
//          MSG and Halbenrain expanded with typical-MSW substrates
//          (drywall_gypsum, pvc_plastic, copper_wiring, rebar_steel_
//          scrap) tagged as implied — required to deliver the
//          chemistry the cited papers describe but not specifically
//          characterized at either site.
//        - js/04-narrators.ts rewritten to compose paragenesis from
//          (mineral.decay_precursor) ∩ (PRECURSOR_SPEC) ∩ (scenario.
//          substrate_inventory). Per-mineral narrators (8 authored:
//          pyromorphite, sphalerite, anglesite, calcite, vivianite,
//          malachite, goslarite, struvite) name only confirmed
//          precursors; implied substrates get hedged language ('likely
//          drywall-derived sulfate'). Other minerals fall through to
//          a templated narrative built from their available precursors.
//        - js/99-renderer-cross-section.ts adds data-mineral-id /
//          data-zone-id / data-evidence-role attrs to each dot;
//          .selected class halos the examined crystal.
//        - index.html: aside#examine-panel below schematic, click
//          delegation on schematic-container, in-panel rendering of
//          PRECURSOR ORIGINS (with documented/implied basis tags) and
//          PRECURSORS OMITTED (substrates not in this cell's inventory).
//        Engine implications: the narrator subsystem is the seed of
//        the per-mineral narrators called out in PROPOSAL §"Per-mineral
//        narrators" — same data shape (mineral × scenario × zone) that
//        the per-step growth narrators will eventually consume.

const WASTELAND_VERSION = "v6";
