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

//   v7 — item-class catalog + tile-grid cell population (2026-05-07):
//        per the boss's framing 'there should be a variable inventory of
//        items in the trash that can break down. you will probably want a
//        system to track what garbage is where before it breaks down' +
//        'a grid would be ideal, that way if there's a mining element
//        later it makes tiles easier to handle.' Discrete items get the
//        same data spine treatment as minerals/scenarios/zones/precursors.
//        - data/item_classes.json — 13 classes covering the substrates
//          referenced by minerals.json + scenarios.json. Six coarse-rigid
//          (refrigerator, washing_machine, car_body, water_heater, tv_
//          cabinet, tire — the literal-vug items per project memory),
//          six medium (lead_acid_battery, drywall_sheet, concrete_chunk,
//          pvc_pipe_section, copper_wire_bundle, rebar_bundle), one
//          fines (organic_matrix as background presence).
//        - js/06-item-spec.ts — loader, parallel to the other spec files.
//        - js/07-cell-population.ts — deterministic tile-grid placement.
//          Cell pit decomposed into 1m × 1m tiles (80 cols × 30 rows =
//          2400 tiles, with the trapezoid clip and waste-body band
//          masking off invalid tiles). Items snap to tile blocks sized
//          from typical_dim_m. Placement: classes processed largest-area-
//          first so cars + fridges claim tiles before batteries + drywall;
//          mulberry32 PRNG seeded by (scenario.id + class_id + index)
//          gives stable layouts; up to 50 placement tries per item with
//          no-overlap enforcement; items that can't fit logged as
//          unplaced (informational, not an error).
//        - scenarios.json gains items_in_cell: {class_id → count} per
//          scenario. MSG = 48 placeable items, Halbenrain = 46. Both
//          European municipal cells with similar inventories; future
//          scenarios (MSWI bottom-ash, demolition pile) will diverge.
//        - js/99-renderer-cross-section.ts adds an item layer rendering
//          BEFORE the zone overlay so chemistry tints paint over items
//          at low opacity. Coarse-rigid items render as hollow rectangles
//          (the literal-vug aesthetic — fill: none, outlined edges);
//          medium items render as semi-filled rectangles. Per-class CSS
//          tints color-cue substrates: galvanized blue-grey, battery
//          amber, drywall dusty-white, concrete cool-grey, copper-wire
//          burnt-orange, etc. Each <rect> carries data-item-id and
//          data-class-id for future click handlers; <title> tooltip
//          gives the display name on hover.
//        Engine implications: the tile grid is the substrate the future
//        mining mechanic will operate on. Each tile is an extractable
//        unit; multi-tile items are extracted as wholes. Crystal-to-item
//        anchoring and decay-state are slated for v8/v9.
//        NOTE: item placement uses its own deterministic seed independent
//        of WASTELAND_VERSION-bumping rules — no scenario chemistry has
//        run yet. The version bump tracks the new data spine arriving
//        rather than a chemistry change.

//   v8 — crystal-to-item host anchoring (2026-05-07): each crystal dot
//        now inherits a host_item_id by snapping to the matching-substrate
//        item in its zone. Closes the loop between the four data spines —
//        minerals × scenarios × zones × items — so paragenesis prose
//        can name the SPECIFIC host: 'this pyromorphite grew on
//        lead_acid_battery_3 at tile (col 22, row 18).' The scenario
//        cells stop being abstract; each crystal points to a particular
//        battery, fridge, drywall sheet, or rebar bundle.
//        - js/03-crystal-positions.ts gains _substratesMatch and
//          _itemInZone helpers. For each (mineral × zone) iteration:
//          candidate hosts = items in this zone whose substrate_tokens
//          intersect mineral.substrate_grows_on. When at least one host
//          exists, dots round-robin across hosts with small jitter
//          inside the host's footprint. When none exist (lcs_biofilm
//          zone has no items by design; some minerals have substrate
//          vocabulary not yet aligned with item tokens), dots fall back
//          to zone-uniform placement with host_item_id=null.
//        - data/minerals.json: surgical substrate-vocabulary additions
//          so vivianite matches rebar items (rebar_steel_scrap added
//          alongside iron_substrate/rebar_corroded) and malachite
//          matches copper_wire_bundle items (copper_wiring added
//          alongside copper_wire/copper_pipe). Other vocabulary gaps
//          handled by zone-fallback for now.
//        - js/04-narrators.ts accepts an optional hostItem arg and
//          appends a 'Host surface: ...' clause to each authored
//          narrative when a host is provided. CrystalNarrative gains
//          host_item_label, host_item_class, host_item_id fields.
//        - js/99-renderer-cross-section.ts threads opts.mineralSpec
//          into the dot generator; each <circle.dot> emits
//          data-host-item-id and data-host-item-class. Renderer also
//          stashes the placed-items list at globalThis.LAST_PLACED_ITEMS
//          so the boot harness can resolve a clicked dot's host id back
//          to the full PlacedItem record without re-running the
//          (deterministic) population pass.
//        - index.html boot: lookupHostItem(hostId) reads
//          LAST_PLACED_ITEMS and passes the host record into
//          narrateCrystal. Examination panel gains a 'host:' meta line;
//          fallback case shows '(no specific host — zone-fallback
//          placement)' in muted italic.
//        Engine implications: with host anchoring in place, future
//        passes can attach decay state, mining-extraction, and
//        per-host crystal counts at the item level. The CrystalDot
//        shape is stable (host fields nullable), so future engine
//        replacement of the seeded sampler doesn't break the renderer.

//   v9 — title-screen flow + per-begin random seed (2026-05-07): boss
//        framing — boot log + button row IS the title screen; clicking a
//        scenario transitions into a cell view; back button returns. Each
//        BEGIN press scrambles the layout so the same scenario shows
//        different appliance/item/crystal positions per session, keeping
//        chemistry deterministic but physical placement variable.
//        - index.html structure: body.view-title (default) / body.view-cell
//          state. Title view shows boot log + BEGIN header + scenario
//          selector; cell view shows back button + schematic + examination
//          panel. CSS toggle hides the unused half on each side.
//        - Buttons reordered: scenarios first (MONT-SAINT-GUIBERT,
//          HALBENRAIN), OVERVIEW third — primary verbs lead.
//        - 'BEGIN' header (letter-spaced amber, mining-report register)
//          contextualizes the buttons as actions.
//        - Back button '[ ← BEGIN MENU ]' in the cell view returns to
//          title; clears activeScenarioId and currentSessionSeed.
//        - currentSessionSeed: number | null — set to a fresh
//          Math.floor(Math.random() * 1e9) on each BEGIN of a scenario;
//          mixed into both 07-cell-population's hash (`scenario.id|class_id|
//          index|sessionSeed`) and 03-crystal-positions's hash
//          (`scenario.id|mineral_id|zone_id|sessionSeed`) so item placement
//          AND crystal-dot placement scramble together. OVERVIEW doesn't
//          render either, so the seed is moot there. Baseline
//          deterministic (sessionSeed=0) preserved when no seed passed —
//          the v0–v8 layouts are recoverable.
//        - page-title element updates between views: 'WASTELAND CRYSTALS —
//          BOOT' on title, 'WASTELAND CRYSTALS — MONT-SAINT-GUIBERT,
//          BELGIUM' (or HALBENRAIN, AUSTRIA, or OVERVIEW) on cell.
//        Engine implications: the seed is structural — future engine
//        ticks read it as the master RNG seed for any chemistry or
//        substrate-distribution randomness. Determinism within a session
//        is preserved (the seed is fixed once BEGIN is pressed); fresh
//        sessions produce fresh layouts.

const WASTELAND_VERSION = "v9";
