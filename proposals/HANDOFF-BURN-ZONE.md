# HANDOFF — Burn-zone events

**Audience:** the next contributor (human or agent) who authors a fire
event in `scenarios.json`, activates `burn_zone` or `burn_halo`
minerals from the catalog, or adds the metastable-quench mechanic to
the engine.

**Author:** Claude, after the herd's discussion 2026-05-07
(Gaston's fast-quench physics + Colette's "what you make depends on
when you stop the process") and the boss's recommendation that the
burn-zone scenario should ship before the goslarite-first growth
engine. **Date:** 2026-05-07.

**Why this exists:** the catalog has been quietly waiting for burn
chemistry. Multiple minerals carry `chemistry_phase: ["burn_zone"]`
or `["burn_halo"]` flags that no current scenario activates —
hydrocalumite, jarosite (in burn-halo context), tinnunculite, the
ZnS-rich tire-pyrolysis char as a sphalerite precursor. The
chemistry-flip principle named in 15-version.ts (Cu/Pb/Zn/Fe each
have 3+ phases across acid / methanogenic / alkaline / burn windows)
only gets its full demonstration when burn chemistry actually runs.
This handoff captures the design before someone implements it
differently than the herd's framing implies.

This document is a **sibling** to
[HANDOFF-VOICE-AND-DISCIPLINE.md](HANDOFF-VOICE-AND-DISCIPLINE.md).
The voice rules and structural disciplines named there still apply
to burn narrators; this handoff is about the structural shape of
burn events specifically.

---

## The frame: events are the fourth axis

The existing chemistry stack composes three axes — **zone × substrate
× chemistry**. A mineral nucleates where the zone's chemistry runs,
the substrate is locally present, and the conditions meet the
mineral's `required_ingredients`. This stack is steady-state: zones
are persistent territories, substrates are persistent inventory,
chemistry runs in equilibrium with the cell's age.

Events are the fourth axis. A fire happens when fuel is present, an
ignition source occurs, and oxygen is available. It runs hot +
oxidizing for hours-to-days, then quenches. The chemistry of the burn
zone is **non-equilibrium** — phases form at compositions they
wouldn't reach in steady-state, and the quench captures them at
metastable points.

The herd's two phrasings of this insight, which are the same
observation in different vocabularies:

- **Gaston:** *fast-quench physics.* Rapid cooling traps
  high-temperature phases at compositions equilibrium-cooling would
  have erased.
- **Colette:** *"what you make depends on when you stop the
  process."* The same chemistry running for 30 minutes vs 30 hours
  produces different phase assemblages because intermediate phases
  survive or anneal away depending on duration.

These are not decorative — they are the mechanism. A burn-zone
implementation that runs the chemistry "to completion" misses the
entire point. The fire's **timing** is the variable.

---

## The chemistry

### `burn_zone` phase

| Property        | Value                                                          |
|-----------------|----------------------------------------------------------------|
| pH              | 10–12 (alkaline; cement dissolves, lime forms from incomplete combustion) |
| Redox           | strongly oxidizing (combustion is by definition oxidative)     |
| Temperature     | active fire core 400–800°C; surrounding burn-influenced tiles 100–300°C |
| Duration        | hours to days (event-driven), then quenches                    |
| Documented at   | MSWI bottom-ash sites (Saffarzadeh 2011 *Waste Manage*; Piantone HAL synthesis hal-03794653); tire-pile burn residues (research/landfill-chemistry-and-fires.md) |

### `burn_halo` phase

| Property        | Value                                                          |
|-----------------|----------------------------------------------------------------|
| pH              | 4–6 (acidic; HCl from PVC pyrolysis at the fire edge)          |
| Redox           | mixed (cooling, with residual oxygen and chloride brine)       |
| Temperature     | ambient to ~80°C (post-quench)                                 |
| Duration        | weeks to years (the alteration ring outlives the fire)         |
| Composition     | Cl-rich brine reacting with previously-stable phases of the surrounding cell |

### Metastable-on-quench

The defining feature of burn chemistry. During the burn, high-
temperature phases form (hydrocalumite, anhydrite, hematite, jarosite
in halo context). When the fire quenches, these phases would normally
dissolve or anneal toward steady-state phases.

**The faster the quench, the more metastable phases survive.**

- **Slow-cooled fires** (depleted fuel, ambient cooling) anneal
  toward calcite + goethite + steady-state assemblage.
- **Fast-cooled fires** (rain on the burn front, methanogenic-core
  contact at the buried perimeter) freeze hydrocalumite, anhydrite,
  jarosite, and the diagnostic burn-zone assemblage.

The engine should sample a `quench_rate` per event (rng × cell
context: rainfall pattern, burial depth, cell-age) and use it to gate
which burn-flagged phases survive into permanent catalog presence vs
which anneal away.

---

## Catalog activation

Currently flagged but inactive:

| Mineral              | Phase            | Chemistry-flip role |
|----------------------|------------------|---------------------|
| hydrocalumite (Friedel's salt) | burn_zone alkaline | Locks Pb by Ca-Pb lattice substitution. *Why* burn zones immobilize Pb beyond just sulfide precipitation — load-bearing for the heavy-metal-fate question. |
| jarosite             | burn_halo acidic | Burn-halo Fe-sulfate. The chloride-brine ring's iron fate when post-fire chemistry cools. |
| tinnunculite         | atmospheric overlay | Uric-acid-derived biogenic phase, forms in specific moisture-oxygen windows (post-burn rainfall on the alteration ring). The most narratively peculiar burn-related phase — uric acid from diapers / pet waste reacting with combustion-oxidation products. |
| sphalerite (catalog already lists `tire_pile_burn_residue` as substrate) | burn_zone reducing-after-pyrolysis | Burn-zone path to ZnS via tire pyrolysis + post-burn sulfide chemistry. The catalog has been waiting for this since v2. |

Slated to add when the burn scenario lands:

| Mineral              | Phase            | Why                                                                                |
|----------------------|------------------|-------------------------------------------------------------------------------------|
| anhydrite            | burn_zone        | Anhydrous CaSO₄. Forms when drywall sulfate dehydrates in fire heat; persists if quench is fast enough to avoid rehydration to gypsum. The diagnostic *"the fire dried me out"* phase. |
| plumbojarosite       | burn_halo        | Pb-Fe-sulfate; the burn-halo Pb fate where fire-exposed lead meets cooling acidic brine. |
| cotunnite or laurionite | burn_halo     | Pb-chloride phases, lock Cl in lead-bearing residues. Optional but visually
distinctive (cotunnite forms colorless prisms; laurionite forms acicular). |

Each addition gets the standard `data/minerals.json` treatment —
formula, habit, substrate_grows_on, decay_precursor, citations,
evidence_level. Audit honestly: hydrocalumite is `landfill_specific`
(documented at MSWI bottom-ash sites); anhydrite is
`anthropogenic_documented` (documented broadly in industrial fire
residues); tinnunculite is `chemistry_predicted` for landfills
(IMA-recognized but not yet reported from a peer-reviewed landfill
fire context).

---

## The data shape

`scenarios.json` gains an `events[]` array per scenario:

```json
"events": [
  {
    "id": "tire_pile_fire_year_15",
    "type": "fire",
    "trigger_step": 1500,
    "spatial_extent": {
      "type": "circular",
      "center_tile": [40, 12],
      "radius_tiles": 5
    },
    "duration_steps": 30,
    "fuel_substrate": "tire",
    "peak_temp_C": 600,
    "quench_rate": "fast",
    "post_quench_phase": "burn_halo",
    "post_quench_duration_steps": 200,
    "narrator_emphasis": "fast-quench metastable capture",
    "evidence_basis": "documented",
    "citation": "Bridgeton Landfill SSR, MO DNR 2013–present"
  }
]
```

Schema fields and their roles:

| Field                       | Role |
|-----------------------------|------|
| `id`                        | Unique within the scenario; referenced by narrators to cite the specific event. |
| `type`                      | `fire` for tire-pile / surface fires; `subsurface_smoldering` for SSR (slower, longer); reserved for future event types. |
| `trigger_step`              | Cell-time step at which the event begins. 100 steps/year convention; year-15 fire = step 1500. |
| `spatial_extent`            | Tile-coordinate footprint. Circular (center+radius) for most fires; polygon for irregular SSR fronts. Coordinates are in the same tile grid 07-cell-population.ts uses (`grid_cols × grid_rows`, TILE_SIZE_M = 1.0). |
| `duration_steps`            | How long the event runs at peak. Tire fires: 24–72 hours = 24–72 steps if 1-hour-per-step granularity; SSR: thousands of steps (years). |
| `fuel_substrate`            | Which item substrate the fire consumes. Affects max_temp_C and quench_rate distribution. |
| `peak_temp_C`               | Hottest tile in the burn zone during the event. |
| `quench_rate`               | `"fast"` \| `"slow"` — gates which metastable phases survive. |
| `post_quench_phase`         | Usually `"burn_halo"`; the chemistry of the alteration ring after the fire dies. |
| `post_quench_duration_steps`| How long the burn_halo persists before chemistry returns to whatever zone the affected tiles belong to. |
| `narrator_emphasis`         | Free-text hint for narrators authoring burn-derived phases — what the closer should reframe. |
| `evidence_basis`            | `"documented"` \| `"implied_typical_msw"` \| `"chemistry_predicted"`. Same vocabulary as `substrate_inventory` evidence_basis. |
| `citation`                  | Site + monitoring-window short-form when documented; empty string when chemistry_predicted. |

The renderer needs three new tile states:

- **In-burn** (during event): override tile chemistry to `burn_zone`
  phase; render with hot-orange tint OVER the existing zone tint.
- **In-halo** (post-quench window): override to `burn_halo` phase;
  render with cooler chloride-brine tint.
- **Frozen-metastable** (post-quench, after halo expires): the tile's
  chemistry returns to its base zone chemistry, but the metastable
  phases that survived are permanently rendered there. A faint
  scarred tint marks the tile as fire-affected.

The crystal-dot generator needs the burn-event context too. A tire
item that was in a burn-affected tile gets sphalerite via the
tire-pyrolysis path; a buried battery in the same tile gets
hydrocalumite (Pb-locking) instead of pyromorphite (steady-state
Pb-PO₄-Cl). The dot's host_item_id stays anchored; the mineral set
shifts based on the tile's burn history.

---

## The narrator pattern for burn-derived phases

Per [HANDOFF-VOICE-AND-DISCIPLINE.md](HANDOFF-VOICE-AND-DISCIPLINE.md)
§"Burn zones — when the chemistry-overlay lands": **emphasize event
sequence over steady-state.**

A standard narrator opens with substrate decay → mobilization →
transport → reprecipitation. A burn-narrator opens with the fire
event:

> "Where the cell's surface fire reached the buried concrete
> fragments at year 15 (Halbenrain test pit, ELFM 2022 monitoring
> window), the cement matrix flashed to calcium-aluminate hydrates
> that, in steady-state alkaline chemistry, would have lost their
> chloride substituents to leachate flow within months. The fire's
> quench was fast enough to trap the Cl in the lattice — Friedel's
> salt, the burn-halo's Pb-immobilization phase, locked structurally
> rather than chemically. The cell's lead exposure, post-fire, is
> fixed not because the chemistry resolved but because the fire
> ended before the chemistry could."

This sketch follows the existing voice rules:

1. **Causal chain** (fire → flash transformation → quench →
   metastable lock).
2. **Closer-as-aphorism** (*"not because the chemistry resolved but
   because the fire ended before the chemistry could"*).
3. **Cite the locality + monitoring window** when the fire is
   documented.
4. **Hedge if the fire is hypothetical:** "the cell's surface fire
   (hypothetical, not documented at this site)..."

The closer for burn-derived phases should reframe the chemistry as
**captured by the event's end, not by its peak.** That's the
Colette-Gaston insight in prose form. The fire's *timing* is the
variable; the closer is where the timing becomes the meaning.

### Annotated example: hydrocalumite at a fire-affected tile

```
Where the cell's surface fire reached the buried concrete fragments
at year 15, the cement matrix flashed to calcium-aluminate hydrates
[1] that, in steady-state alkaline chemistry, would have lost their
chloride substituents to leachate flow within months [2]. The fire's
quench was fast enough to trap the Cl in the lattice — Friedel's
salt, the burn-halo's Pb-immobilization phase, locked structurally
rather than chemically [3]. The cell's lead exposure, post-fire, is
fixed not because the chemistry resolved but because the fire ended
before the chemistry could [4].

[1] Event-sequence opener: the FIRE is the actor, not the substrate.
    The "flashed to" verb signals fast transformation.
[2] The counterfactual establishes that this phase is metastable —
    in steady-state, it wouldn't survive. The narrator names what
    DIDN'T happen so the reader understands what makes the survival
    notable.
[3] The Pb-immobilization role connects this phase to the
    chemistry-flip principle. Hydrocalumite is the "burn zones lock
    heavy metals beyond just sulfide precipitation" mechanism in
    prose form.
[4] Closer-as-aphorism, event-end-shaped. The chemistry didn't
    resolve; the event ended. That's the Colette-Gaston insight as
    a sentence.
```

---

## The UX layer protections — load-bearing

This is the load-bearing point from the herd's discussion. The
burn-zone scenario will be **the project's most spectacular feature
so far** — fire tints, alteration rings, metastable phases freezing.
Without UX-layer protections against achievement-shape, the burn-zone
scenario will undermine the surveyor's voice faster than any prose
choice could fix.

> "A chime that plays when a mineral appears will undermine that
> voice faster than any prose choice."  
> — the herd, after Gaston and Colette's UX thread.

**Before authoring the burn-zone scenario, the following UX
protections must be in place:**

### 1. Two-column catalog asymmetry

Geological column closes at fourth-encounter ("calcite, classified,
done"). Anthropogenic column never closes. Burn-flagged phases
belong to the anthropogenic column — they are event-conditional, not
steady-state mineral species. The catalog should never let the
player feel "complete" about an anthropogenic phase, especially a
burn phase. The four-tier `evidence_level` ladder maps onto this
split: `geological_analog` and most `chemistry_predicted` entries
belong to the geological (settling) column; `landfill_specific` and
`anthropogenic_documented` entries belong to the anthropogenic
(open) column.

### 2. Pulse-not-chime notifications

When the fire triggers, when phases flash to metastable forms, when
the quench locks them — these are events the **catalog notices**,
not achievements the **player unlocks**. Use ambient pulse on the
catalog item, not a sound effect on the schematic. Achievement-shape
implies a goal; observation-shape implies a process. The surveyor's
voice and a *"ding! +50 points!"* cannot occupy the same screen; one
of them is lying.

### 3. No toasts, no XP, no counters

The mining mechanic, when it lands, should resolve to *"this tile is
now a survey datum"* — not *"you got X."* No "extracted: hydrocalumite!"
toasts. No achievement banners. The fire should be observed, not
celebrated.

These protections are **not burn-zone work.** They should ship
before the burn-zone scenario lands. Otherwise the scenario becomes
a more spectacular version of the aestheticization problem rather
than the chemistry-flip demonstration the project has been building
toward.

---

## Anti-patterns

### Burn zones as a position-class entry in `zones.json`

Tempting because the existing zone overlay is well-factored. **Don't.**
Fires happen wherever they happen. Position-class entries are
persistent territories; events are non-persistent overlays. The
zones.json `_audit_summary._notes` already says: *"Burn zones are
NOT a position-class entry — fires happen wherever they happen, so
burn chemistry will be a separate per-scenario overlay."* Preserve
that.

### Steady-state chemistry for burn-affected tiles

The whole point is that burn chemistry is non-equilibrium. A "this
tile has alkaline chemistry now" override that reaches equilibrium
misses Gaston's fast-quench point. **Burn chemistry IS the rate of
approach to equilibrium, not equilibrium itself.** The phases that
survive depend on how fast the fire ended, not on how hot it got at
peak.

### Shipping a fire without quench

*"The fire ran for 30 hours, here are the burn-zone phases"* without
*"the fire ended at hour 30 with quench-rate X, here is what
survived"* misses Colette's "what you make depends on when you stop
the process." Fast-quench and slow-quench should produce different
phase assemblages from the same fire's peak chemistry; the duration
AND the quench-rate are both variables.

### Spectacular UI effects (boom, flash, screen-shake)

The fire is mineralogy-shaping, not action-game-shaping. A boom
undermines the surveyor's voice. The fire's notification should be a
pulse on the affected tiles and a catalog entry update —
observation-shape, not achievement-shape.

### Hypothetical fires presented as documented

If the fire is fabricated (e.g., "let's add a tire-pile fire to
Mont-Saint-Guibert"), the scenario must declare
`evidence_basis: "chemistry_predicted"` and the narrator must hedge
accordingly. **Prefer authoring a NEW scenario based on a documented
fire** over fabricating fire history at MSG / Halbenrain. Bridgeton
Landfill (Missouri, USA) hosts a documented subsurface smoldering
reaction (SSR) that has been characterized in MO DNR reports and
peer-reviewed literature since 2010 — the strongest documented
landfill-fire scenario currently available.

---

## Recommended sequence

1. **UX protections** (separate work package, NOT burn-zone
   itself): two-column catalog asymmetry, pulse-not-chime
   notifications, no-toast no-XP discipline. **Ship before any
   burn-zone work.**

2. **Catalog additions** (small): `anhydrite`, `plumbojarosite`,
   optionally `cotunnite` / `laurionite`. Each gets the standard
   minerals.json treatment with `chemistry_phase: ["burn_zone"]` or
   `["burn_halo"]`, evidence_level honest about real characterization
   vs prediction.

3. **`scenarios.json` events[] schema** (small): the structure
   above, with at least one populated event. **Author a NEW scenario**
   rather than retrofitting MSG / Halbenrain. Bridgeton SSR is the
   strongest documented candidate.

4. **Renderer event-overlay layer**: tile-level tint override for
   `burn_zone` (during event) and `burn_halo` (post-quench window)
   and `frozen_metastable` (permanent, post-event). Composes with
   existing zone tints rather than replacing them.

5. **Narrator additions for burn-flagged minerals**: hydrocalumite,
   jarosite (burn-halo path), tinnunculite, anhydrite, plumbojarosite.
   Each follows the burn-narrator pattern (event-sequence opener,
   fast-quench closer).

6. **Engine quench-rate gating** (when the chemistry engine arrives):
   each event samples a quench_rate; metastable phases gate on
   quench_rate. This composes with the goslarite-first engine work
   when that lands; goslarite is the simplest steady-state case,
   the burn-flagged minerals are the simplest event-driven case.

---

## Checklist for adding a burn-event scenario

Before authoring:

- [ ] At least 3 burn-flagged minerals exist in `data/minerals.json`
      with proper `chemistry_phase` flags and citations. Audit each
      entry's `evidence_level` against actual literature.
- [ ] UX protections (two-column catalog, pulse-not-chime) have
      shipped. The burn-zone scenario should never be the first
      feature that visually rewards the player.
- [ ] The fire's source is decided: documented site (preferred) or
      chemistry-predicted (acceptable with `evidence_basis:
      "chemistry_predicted"`). If documented, you have read the
      cited paper or report.

Authoring the event:

- [ ] Spatial extent in tile coordinates; center tile and radius
      (or polygon for irregular fires).
- [ ] Trigger step in cell-time units (100 steps/year convention).
- [ ] Duration in steps. Tire-pile fires: 24–72 steps; SSR:
      thousands of steps.
- [ ] Peak temperature reasoned from fuel substrate (tire: 400–800°C;
      mixed waste: 200–400°C; SSR: 250–400°C).
- [ ] Quench rate gating: `"fast"` (rain, methanogenic-core contact)
      → metastable survives; `"slow"` (depleted fuel, ambient cool)
      → annealed.
- [ ] Post-quench `burn_halo` duration: weeks to years depending on
      Cl supply.

Authoring the narrator:

- [ ] Open with the event ("Where the cell's surface fire reached..."),
      not the substrate.
- [ ] Causal chain through the burn: fuel + ignition → fire phase →
      high-T transformation → quench → metastable capture.
- [ ] Closer reframes the chemistry as **event-captured rather than
      equilibrium-resolved**.
- [ ] If the fire is hypothetical, the prose acknowledges it ("the
      cell's hypothetical surface fire" or "in the
      chemistry-predicted scenario where a fire reached..."). Prefer
      documented sites.

Reviewing your own narrator:

- [ ] No second-person, no game framing, no promotional adjectives.
- [ ] Hedges by basis (the `_phrase` "likely" prefix), not by tone.
- [ ] Closer is event-end-shaped, not steady-state-shaped.
- [ ] If the fire is documented, the narrator cites the paper /
      monitoring window. If hypothetical, the narrator says so.

---

## A note on what the scenario should make the player feel

The herd's design instinct: garbage time and geological time are
categorically different temporalities, and **the burn-zone scenario
is the sharpest place that distinction lives.** A geological mineral
catalog closes — calcite is calcite, classified, done. An
anthropogenic mineral catalog never closes, and a burn-affected
anthropogenic catalog refuses closure even harder, because each
fire's metastable assemblage is a one-time chemistry. The same fire
running through the same cell with the same fuel produces a
different mineral set at fast-quench vs slow-quench. There is no
"true" answer to *what does this fire produce* — only *what did this
fire produce, given when it stopped.*

The narrators should preserve that. The UX should preserve it. The
renderer's event-overlay should preserve it. **A burn event should
never feel like an achievement; it should feel like reading a
quarterly report from a future surveyor who is documenting a
chemistry that will never resolve, only quench again next time.**

The aphorism the closer is reaching for is something like:
*chemistry stopped here, not because it was finished but because the
fire was.*

Preserve them. They compound.
