// ============================================================
// js/10-engine-cell.ts — cell-state model + tick loop scaffolding
// ============================================================
//
// First chemistry-engine pass per proposals/PROPOSAL-WASTELAND-CRYSTALS.md
// §"First mineral: pick goslarite" and HANDOFF-VOICE-AND-DISCIPLINE.md
// §"First growth engine — when chemistry math lands". The data spines
// (minerals × scenarios × zones × precursors × items) have been complete
// since v6; v11 lights the chemistry engine that consumes them.
//
// Architecture:
// - One tick = 1 month of cell time. 12 ticks/year. A scenario's
//   cell_age = scenario.waste_age_years × 12 (so MSG = 360, Halbenrain
//   = 300, Bridgeton = 264).
// - Each mineral has a per-mineral growth function (e.g. js/11-engine-
//   goslarite.ts grows goslarite). v11 ships only the goslarite engine;
//   other minerals fall through to the seeded-sampler path in
//   js/03-crystal-positions.ts. New per-mineral engines drop into
//   js/12-engine-*.ts as they're authored.
// - Engine output is a list of EngineCrystal entries that the dot
//   generator consumes. Each carries mass + age, so the renderer can
//   scale dot size with crystal_mass_mg.
// - Determinism: the engine uses the same session-seeded mulberry32 the
//   sampler uses, plus the cell's age in steps. Re-running gives the
//   same crystals; the BEGIN button's session seed scrambles the
//   per-tile noise but not the gross deterministic output.
//
// What the v11 engine does NOT do (slated for later):
// - True per-tick supersaturation math with mass balance against zone
//   thickness_um. v11 computes a closed-form mass = age × growth_rate ×
//   season_modulator. The handoff said "~50 lines + mass balance + a
//   baseline test"; v11 ships the 50 lines + scaffolds for mass
//   balance + the visual harness as the baseline.
// - Inter-mineral competition (one mineral consuming a precursor that
//   another mineral was about to use). Slated for v12-v13.
// - Burn-event quench-rate gating (per HANDOFF-BURN-ZONE.md §"Engine
//   quench-rate gating"). The events schema is structured for it; the
//   engine will read it when this layer matures.

interface CellState {
  scenario: any;
  zoneSpec: { [id: string]: any };
  mineralSpec: { [id: string]: any };
  itemSpec: { [id: string]: any };
  precursorSpec: { [id: string]: any };
  items: any[];                           // PlacedItem[] from 07-cell-population.ts
  geom: any;                              // CellGeomInput from 03-crystal-positions.ts
  cellAgeSteps: number;                   // total ticks since cell closure (1 tick = 1 month)
  sessionSeed: number;
  crystals: EngineCrystal[];              // accumulated engine output
}

interface EngineCrystal {
  mineral_id: string;
  host_item_id: string;
  host_item_class: string;
  zone_id: string;                        // which zone the host item sits in
  x_m: number;                            // world meters (renderer-ready)
  y_m: number;
  age_steps: number;                      // ticks since nucleation (= cellAgeSteps - born_step)
  born_step: number;                      // tick at which nucleation fired
  crystal_mass_mg: number;                // accumulated mass (for dot size scaling + future mass balance)
  source: "engine";                       // distinguishes from sampler-placed dots
}

// Default ticks-per-year convention. Mirrored in HANDOFF-BURN-ZONE.md
// events[] schema: 100 steps/year was the burn-zone aspirational rate;
// 12 ticks/year is what the engine actually uses for chemistry math
// because monthly granularity matches the scale of seasonal-pulse
// processes (goslarite efflorescence-dissolution cycles, methanogenic-
// front migration). Burn events will be re-quantized to monthly when
// the quench-rate engine arrives.
const TICKS_PER_YEAR = 12;

function _hashStrEngine(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function _mulberry32Engine(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns the zone whose footprint contains the placed item's center,
// using the same _itemInZone test the sampler uses. When an item sits
// in multiple zones (zone overlap), returns the first match in zoneSpec
// iteration order. Returns null when no zone contains the item.
function _findItemZone(item: any, zoneSpec: { [id: string]: any }, geom: any): { id: string; zone: any } | null {
  for (const id of Object.keys(zoneSpec)) {
    const zone = zoneSpec[id];
    if (typeof _itemInZone === "function" && _itemInZone(item, zone, geom)) {
      return { id, zone };
    }
  }
  return null;
}

// Initialize a cell state at age=0 with no crystals. Caller is expected
// to advance the cell by calling runCellEngine (or per-mineral growth
// functions directly). Per-scenario default age comes from
// scenario.waste_age_years.
function initCellState(
  scenario: any,
  zoneSpec: { [id: string]: any } | null,
  mineralSpec: { [id: string]: any } | null,
  itemSpec: { [id: string]: any } | null,
  precursorSpec: { [id: string]: any } | null,
  items: any[],
  geom: any,
  sessionSeed: number = 0,
): CellState {
  return {
    scenario,
    zoneSpec: zoneSpec ?? {},
    mineralSpec: mineralSpec ?? {},
    itemSpec: itemSpec ?? {},
    precursorSpec: precursorSpec ?? {},
    items: items ?? [],
    geom,
    cellAgeSteps: 0,
    sessionSeed,
    crystals: [],
  };
}

// Run the engine forward to the cell's full age. Per-mineral growth
// functions are dispatched inside; v11 dispatches only goslarite. The
// closed-form mass model means we don't need a real per-tick loop —
// growGoslarite computes mass once given the final age. When v12-v13
// add per-tick supersaturation math, this function will switch to a
// real loop.
function runCellEngine(state: CellState, totalSteps: number): CellState {
  state.cellAgeSteps = totalSteps;
  // Goslarite engine — js/11-engine-goslarite.ts.
  if (typeof growGoslarite === "function") {
    const goslariteCrystals = growGoslarite(state);
    state.crystals.push(...goslariteCrystals);
  }
  // Future per-mineral engines wire in here:
  // if (typeof growSphalerite === "function") state.crystals.push(...growSphalerite(state));
  // if (typeof growPyromorphite === "function") state.crystals.push(...growPyromorphite(state));
  return state;
}

// Convenience: run the engine for a scenario at its declared waste_age
// in years. Used by 03-crystal-positions.ts when wiring the engine into
// the dot-generation path.
function runCellEngineForScenarioAge(state: CellState): CellState {
  const ageYears = (state.scenario && typeof state.scenario.waste_age_years === "number")
    ? state.scenario.waste_age_years
    : 25;
  return runCellEngine(state, ageYears * TICKS_PER_YEAR);
}

// Helper exposed for per-mineral engines: tells you the supersaturation
// score for a (zone, scenario, mineral) tuple. Score in [0, ∞):
//   < 1.0  → undersaturated (mineral does not nucleate)
//   1.0    → at saturation
//   > 1.0  → supersaturated (faster nucleation, faster growth)
//   ≥ nucleation_sigma → nucleation gate fires
// For v11 this is a simple ratio of available ions to required;
// per-mineral engines can override with chemistry-specific heuristics.
function _supersaturationScore(zone: any, mineral: any, scenario: any): number {
  if (!zone || !mineral || !mineral.required_ingredients) return 0;
  const reqs = mineral.required_ingredients;
  const zoneIons = (zone.characteristic_ions_mg_per_L ?? {}) as { [k: string]: number | string };
  const scenIons = (scenario && scenario.leachate_chemistry && scenario.leachate_chemistry.ions_mg_per_L) || {};
  let minRatio = Infinity;
  for (const sp of Object.keys(reqs)) {
    const need = (reqs as any)[sp];
    if (typeof need !== "number" || need <= 0) continue;
    // Take the larger of zone-typical and scenario-bulk for this species.
    const zoneVal = typeof zoneIons[sp] === "number" ? (zoneIons[sp] as number) : 0;
    const scenVal = typeof (scenIons as any)[sp] === "number" ? ((scenIons as any)[sp] as number) : 0;
    const have = Math.max(zoneVal, scenVal);
    const ratio = have / need;
    if (ratio < minRatio) minRatio = ratio;
  }
  return isFinite(minRatio) ? minRatio : 0;
}

// Helper: pH-window score in [0, 1].
//   1.0 = pH sits at the optimum window's center
//   0.0 = pH is outside the window entirely
//   linear falloff toward the window edges and beyond
function _pHWindowScore(zone: any, mineral: any, scenario: any): number {
  if (!mineral || !mineral.pH_optimum) return 1;
  const [lo, hi] = mineral.pH_optimum;
  const scenPH = scenario && scenario.leachate_chemistry && typeof scenario.leachate_chemistry.pH === "number"
    ? scenario.leachate_chemistry.pH : 7;
  // Zone phase translates loosely to a pH bias. v11 uses the zone's
  // typical_phase as a hint and takes the scenario pH offset by the
  // zone phase's expected adjustment. Crude but enough for v11.
  const phaseBias: { [k: string]: number } = {
    acid: -2,
    acid_leaning: -1,
    methanogenic: 0,
    mixed: -0.5,
    stable: 0.5,
    alkaline_cap: +2,
    biofilm: -0.2,
    burn_zone: +3,
    burn_halo: -1.5,
  };
  const bias = phaseBias[zone && zone.typical_phase] ?? 0;
  const localPH = scenPH + bias;
  if (localPH < lo || localPH > hi) {
    // Soft tail: 0.5 pH outside the window still gets partial credit.
    const dist = Math.min(Math.abs(localPH - lo), Math.abs(localPH - hi));
    return Math.max(0, 1 - dist / 0.5) * 0.3;
  }
  // Inside the window: peak at center, falloff toward edges.
  const center = (lo + hi) / 2;
  const halfWidth = (hi - lo) / 2;
  const offset = Math.abs(localPH - center);
  return Math.max(0.3, 1 - (offset / halfWidth) * 0.5);
}
