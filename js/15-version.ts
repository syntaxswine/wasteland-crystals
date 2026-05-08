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

//   v10 — burn-zone activation: Bridgeton SSR scenario + event overlay
//        (2026-05-07): per proposals/HANDOFF-BURN-ZONE.md the chemistry
//        catalog has been quietly waiting for burn flags to do anything;
//        v10 lights them up. Activates the fourth axis of the chemistry
//        stack — zone × substrate × chemistry × EVENT — by adding a
//        documented-fire scenario, burn-flagged catalog additions, an
//        event-overlay renderer pass, and burn-narrator branches.
//        - data/minerals.json schema bumped to 0.3.0; +4 minerals.
//          Hydrocalumite (Friedel's salt — landfill_specific via Saffarzadeh
//          2011 + Piantone HAL synthesis MSWI bottom-ash work; locks Pb
//          structurally rather than chemically), anhydrite (anthropogenic_
//          documented; the diagnostic 'fire dried me out' phase from
//          drywall sulfate dehydration), plumbojarosite (chemistry_
//          predicted; the burn-halo Pb-Fe-sulfate where cooling acidic
//          chloride brine meets fire-exposed lead), tinnunculite (chemistry_
//          predicted in landfills; uric-acid biomineral from diapers + pet
//          waste reacting with post-burn oxidants — the most narratively
//          peculiar entry in the catalog). Mixed mineralogical class
//          activated; chemistry_phase vocabulary gains atmospheric_overlay
//          for tinnunculite's post-burn rainfall window. Total catalog: 27
//          minerals (was 23). Jarosite gains chemistry_phase: ['acid',
//          'burn_halo'] so the same atoms can register at both the steady-
//          state acidogenic_horizon and the post-quench halo.
//        - data/precursors.json schema bumped to 0.2.0; +7 burn-event-
//          overlay precursors (drywall_sulfate_dehydration, concrete_
//          thermal_decomposition, pvc_pyrolysis_hcl, battery_pb_pyrolysis,
//          post_burn_acid_brine, biogenic_uric_acid, post_burn_atmospheric_
//          oxidation), each with phase_window: ['burn_zone'] | ['burn_halo']
//          | ['atmospheric_overlay']. Total: 27 precursors (was 20).
//        - data/scenarios.json schema bumped to 0.2.0; +1 scenario.
//          Bridgeton (MO, USA) at landfill_specific evidence — the
//          documented subsurface smoldering reaction characterized by MO
//          DNR since 2010, the strongest documented landfill-fire scenario
//          available. Aluminum-dross + leachate exotherm trigger (Calder &
//          Stark 2010 J Hazard Mater). New events[] array on the scenario
//          schema; Bridgeton populates it with a single subsurface_
//          smoldering event at concentric-circular spatial extent
//          (radius_burning_tiles=4, radius_halo_tiles=7, radius_frozen_
//          tiles=11). Substrate inventory adds aluminum_dross (documented)
//          + tire_pile_burn_residue (implied) on top of the standard MSW
//          set. expected_species: hydrocalumite/anhydrite/plumbojarosite/
//          tinnunculite/ettringite/goethite/jarosite/calcite/sphalerite —
//          burn-flagged + steady-state coexist because Bridgeton's burn
//          front is a non-equilibrium overlay, not a steady-state phase
//          replacement.
//        - js/99-renderer-cross-section.ts adds an event-overlay layer
//          rendering THREE concentric tinted rings per event: burning core
//          (hot-orange, fill-opacity 0.42), halo annulus (chloride-brine
//          cyan-purple, fill-opacity 0.26 with dashed boundary), frozen-
//          metastable scar (faint scarred amber, fill-opacity 0.16 with
//          finer dashes). Composes OVER the steady-state zone tints; the
//          unburned periphery still reads its base zone chemistry through
//          the gaps. Per HANDOFF-BURN-ZONE.md UX discipline: tints are
//          observation-shape, no glow / pulse / saturated alarm-red.
//        - js/03-crystal-positions.ts gains _eventStatesForMineral,
//          _itemInEventRing, _sampleEventPoint helpers + an event-overlay
//          placement pass. For each (event, mineral) where the mineral has
//          burn_zone / burn_halo / atmospheric_overlay in chemistry_phase,
//          dots place inside the matching ring(s) of the event. Host-
//          anchoring still applies (substrate-matching items inside the
//          ring become hosts; otherwise ring-uniform sampling). New event_
//          id + event_state fields on CrystalDot; data-event-id +
//          data-event-state attributes on the rendered <circle>.
//        - js/04-narrators.ts adds 5 burn-narrators (hydrocalumite,
//          anhydrite, plumbojarosite, tinnunculite, jarosite — the latter
//          context-branched between AMD-acid steady-state and burn-halo
//          event variants). All five follow HANDOFF-BURN-ZONE.md §
//          "narrator pattern for burn-derived phases": event-sequence
//          opener (the FIRE is the actor, not the substrate), causal chain
//          through fuel + ignition → flash transformation → quench →
//          metastable capture, and closer reframing chemistry as
//          event-captured rather than equilibrium-resolved. narrateCrystal
//          gains optional eventEntry + eventState params; CrystalNarrative
//          gains event_id + event_state fields; zone label resolves to a
//          synthetic 'BURN HALO — SUBSURFACE SMOLDERING' for event-bound
//          dots so the examination panel reads correctly.
//        - index.html boot harness threads data-event-id/data-event-state
//          off the clicked dot and looks up the matching scenario.events[]
//          entry, passing it into narrateCrystal alongside the host item.
//        Engine implications: the events schema is structured for a
//        future quench-rate-gating engine pass (per HANDOFF-BURN-ZONE.md
//        recommended sequence step 6). Current renderer reads the radii
//        directly; a chemistry engine arriving later will compute them
//        from ignition_step + duration_steps + quench_rate without
//        breaking the renderer's contract. The Bridgeton SSR is the
//        first scenario the boss asked the project to build toward —
//        same atoms, same cell, different mineral assemblage at the burn
//        front than at its unburned periphery, with the timing of the
//        fire's end encoded in which metastable phases survived.
//        Counter-discipline note (per HANDOFF-BURN-ZONE.md §"UX layer
//        protections"): two-column catalog asymmetry was deferred at
//        the boss's instruction — the burn scenario shipped first.
//        Pulse-not-chime and no-toast disciplines hold by absence: there
//        are no notifications, sound effects, or achievement banners
//        for the burn event. The fire is observed via tile tints and
//        catalog updates, not celebrated.

//   v11 — first chemistry engine: goslarite (2026-05-07): per the
//        proposal's "First mineral: pick goslarite" recipe and HANDOFF-
//        VOICE-AND-DISCIPLINE.md §"First growth engine — when chemistry
//        math lands". The data spines have been complete since v6; v11
//        lights the engine that consumes them. Boss instruction
//        2026-05-07: "i'd rather focus my energy on the engine and what
//        comes after."
//        - js/10-engine-cell.ts — CellState + initCellState + runCellEngine
//          + runCellEngineForScenarioAge. One tick = 1 month (12 ticks/yr,
//          monthly granularity matches goslarite's seasonal-pulse scale).
//          Per-mineral engines dispatch from runCellEngine; v11 dispatches
//          only growGoslarite. Helper functions exposed for future
//          per-mineral engines: _findItemZone (zone containing item
//          center), _supersaturationScore (ratio of available ions to
//          required), _pHWindowScore (pH-window membership in [0,1]).
//        - js/11-engine-goslarite.ts — growGoslarite(state) returns
//          EngineCrystal[] for each PlacedItem with galvanized_steel
//          substrate sitting in an acid-leaning zone (cap_contact or
//          acidogenic_horizon). Closed-form mass model: mass =
//          (age_steps / 120) × growth_rate × supersat_boost × season ×
//          0.7. The 0.7 net-mass coefficient captures averaged
//          wet-dry-cycle redissolution (the proposal's "pulses rather
//          than accumulates"). Seasonal modulator: annual sinusoid,
//          peak at month 9 (driest), trough at month 3 (wettest).
//          Local Zn supersaturation differs by zone: 4× at cap_contact
//          (full O2 + evaporation), 2.5× at acidogenic_horizon, 1.5×
//          at wall_contact_flank. Three goslarite crystals per
//          (item, zone) match, jittered inside item footprint with
//          deterministic per-item RNG mixing session seed + item id.
//        - js/03-crystal-positions.ts gains an engine pass that runs
//          BEFORE the seeded sampler. Engine-controlled minerals
//          (ENGINE_CONTROLLED_MINERALS = {goslarite}) skip the sampler;
//          their crystals come from the engine pass and are appended
//          to the dot list at the end. CrystalDot gains source +
//          crystal_mass_mg + age_steps fields.
//        - js/99-renderer-cross-section.ts: opts.precursorSpec
//          threaded into generateCrystalDots. Engine dots scale
//          radius with sqrt(crystal_mass_mg) — doubling mass yields
//          ~1.4× radius, floor 1.6 / ceiling 4.5. Engine dots also
//          carry .dot-engine class with a soft outer halo
//          (paint-order: stroke fill) simulating the out-of-plane
//          efflorescence cluster. data-source / data-crystal-mass-mg /
//          data-age-steps emitted as DOM attrs for the examination
//          panel + visual harness.
//        - data/scenarios.json: goslarite added to MSG +
//          Halbenrain expected_species with evidence_role:
//          "engine_predicted" — the new tier marking simulator
//          predictions distinct from cited paper findings. Schema
//          declaration extended to document the engine_predicted role.
//        - index.html boot harness threads PRECURSOR_SPEC into
//          renderCrossSectionInto opts so the engine has the precursor
//          map (used for substrate-decay validation in future
//          per-mineral engines).
//        Engine implications: this is the first engine. The data
//        plumbing is proven. Future per-mineral engines drop into
//        js/12..14-engine-*.ts (sphalerite, pyromorphite, anglesite
//        next per the proposal's "Adding minerals one at a time" rule).
//        The closed-form mass model in v11 is a stepping stone — v12
//        will add real per-tick supersaturation math with mass balance
//        against zone thickness_um. Burn-event quench-rate gating
//        composes on top once the per-mineral engines stabilize.
//        Visual diff vs v10: the same scenarios now render
//        engine-grown goslarite (white halo on galvanized appliances)
//        in cap_contact + acidogenic_horizon zones; the dot count at
//        MSG goes from 30 to ~60+, Halbenrain from 22 to ~45+. Each
//        engine dot's mass (visible in the DOM data-crystal-mass-mg
//        attr) varies with cell age × seasonal phase, deterministic
//        per (scenario, sessionSeed).

//   v12 — sphalerite engine: chemistry-flip of goslarite (2026-05-08):
//        per the boss's "one mineral at a time" rule (clarified
//        2026-05-08): solo minerals ship + test independently; only
//        paragenesis-linked minerals (the Pb suite — anglesite +
//        pyromorphite + galena, when those land) ship together.
//        Sphalerite is the natural next solo: same Zn source as
//        goslarite (galvanized_steel substrate) but with completely
//        opposite chemistry gates — methanogenic-reducing vs
//        acid-oxidizing. Demonstrates the engine handles the chemistry-
//        flip principle without code knowing about the principle.
//        - js/12-engine-sphalerite.ts — growSphalerite(state) returns
//          EngineCrystal[] for items with sphalerite-substrate tokens
//          sitting in methanogenic zones with biogenic H2S available.
//          Two branches:
//          (1) Steady-state methanogenic path: substrate gate
//              (galvanized_steel | zinc_metal | e_waste_zn |
//              tire_pile_burn_residue) + zone gate (methanogenic_core |
//              lcs_biofilm | stable_basal) + H2S source gate (drywall
//              gypsum or lead_acid_battery in scenario substrate
//              inventory). Local supersaturation: methanogenic_core
//              3×, lcs_biofilm 1.2×, stable_basal 1.5×.
//          (2) Burn-event tire-pyrolysis ZnS-char path: items with
//              tire_pile_burn_residue substrate inside a burn event's
//              halo / frozen-metastable / burning ring grow sphalerite
//              via the char (per HANDOFF-BURN-ZONE.md catalog
//              activation table + Polymers 2023 review). The char
//              IS the sulfide source — bypasses the SRB chemistry.
//              Synthetic zone_id "event:<event_id>:<state>" emitted
//              so renderer + narrator can route correctly.
//        - Mass model: net_mass_coefficient = 1.0 (sphalerite is
//          durable, no seasonal redissolution like goslarite).
//          Reference mass at 120 ticks = 0.4 mg per crystal. Growth
//          rate 0.5× from minerals.json. Three crystals per
//          (item, zone) match, jittered tighter than goslarite (50%
//          of item footprint vs 70%) so the cluster reads as a
//          coating rather than a spray — sphalerite tetrahedra
//          aggregate locally rather than fanning out.
//        - js/03-crystal-positions.ts: sphalerite registered in
//          ENGINE_CONTROLLED_MINERALS so the seeded sampler skips it.
//          Engine output flows through the same merge path as
//          goslarite.
//        - js/04-narrators.ts: _narrateSphalerite gains optional
//          engineState param + branches on synthetic event-zone IDs.
//          Tire-pyrolysis branch: opens with the fire as actor (per
//          HANDOFF-BURN-ZONE.md narrator pattern), names the char as
//          mechanism, closes by composing with the steady-state
//          methanogenic-core narrative ("same crystal, different
//          precursor route"). Steady-state branch: closer reframes
//          chemistry as "the chemistry-flip of the same Zn source
//          that grows goslarite under acid-oxidizing conditions in
//          shallower zones."
//        Visual diff vs v11: the same scenarios now render
//        engine-grown sphalerite (amber-brown halo on galvanized
//        appliances at depth) in methanogenic_core / lcs_biofilm /
//        stable_basal zones. Bridgeton additionally renders sphalerite
//        on tire items inside the SSR's burn footprint (the
//        tire-pyrolysis ZnS-char branch). Goslarite continues at
//        cap_contact + acidogenic_horizon — the same Zn source, the
//        same items, but at different depths the engine renders
//        different minerals because the chemistry-flip is a
//        zone-phase function. Engine dot counts grow by ~3× per
//        scenario.

const WASTELAND_VERSION = "v12";
