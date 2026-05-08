// ============================================================
// js/11-engine-goslarite.ts — goslarite growth engine
// ============================================================
//
// First per-mineral chemistry engine, per proposals/PROPOSAL-WASTELAND-
// CRYSTALS.md §"First mineral: pick goslarite":
//
//   Goslarite (ZnSO4·7H2O) on rusted galvanized steel is the canonical
//   "hello world" of anthropogenic mineralogy:
//   - Substrate is universal (steel is in every dump)
//   - Chemistry is single-substrate (Zn²⁺ + SO4²⁻ → ZnSO4·7H2O)
//   - Acid phase only (pH 3-6, yrs 1-10)
//   - Highly soluble — recrystallizes seasonally with rain pulses
//
// And HANDOFF-VOICE-AND-DISCIPLINE.md §"First growth engine":
//   "If goslarite renders correctly as a pulsing acicular efflorescence
//   on a buried fence-wire fragment, the engine's data plumbing is
//   proven and every other mineral is content."
//
// What this engine does:
// 1. For each PlacedItem whose substrate_tokens include galvanized_steel,
//    find the zone the item sits in.
// 2. Gate on the zone's phase: cap_contact (acid_leaning) or
//    acidogenic_horizon (acid) — both meet goslarite's pH_optimum [3, 6].
// 3. Gate on substrate inventory: the cell must have a SO4 source —
//    drywall_gypsum (drywall_sulfate precursor) or lead_acid_battery
//    (battery_h2so4 precursor). Without SO4, goslarite has no anion.
// 4. Compute supersaturation score from local Zn enrichment (the
//    galvanized item locally elevates Zn well above zone-typical bulk
//    leachate values; the engine treats per-tile Zn at near-saturation).
// 5. Place 2-4 deterministic crystals per (item, zone) match, jittered
//    inside the item footprint. Each crystal carries:
//      - born_step  (when nucleation fired; ~5% of cell age in v11)
//      - age_steps  (cellAgeSteps - born_step)
//      - crystal_mass_mg = age_steps × growth_rate × season_modulator ×
//                          supersaturation × 0.7  (the 0.7 captures net
//                          mass loss from seasonal redissolution
//                          averaged over many wet-dry cycles)
// 6. The seasonal-pulse modulator: at the cell's current step,
//    season_modulator = 1.0 (peak dry season) ... 0.5 (peak wet season)
//    so the same scenario reloaded at different sessionSeeds shows
//    different pulse phases on the goslarite crusts. The proposal's
//    "snow-white efflorescence pulses rather than accumulates" rendered
//    as actual variance.

const GOSLARITE_TARGET_SUBSTRATE = "galvanized_steel";
const GOSLARITE_SO4_SOURCE_TOKENS = ["drywall_gypsum", "lead_acid_battery"];
// Goslarite-friendly zone phases — derived from minerals.json
// pH_optimum [3, 6] mapped against zones.json typical_phase tokens.
const GOSLARITE_FRIENDLY_PHASES = ["acid", "acid_leaning", "mixed"];
// Crystals per (item, zone) match, fixed for v11 determinism. Spreads
// the goslarite efflorescence across the item's footprint as a small
// cluster rather than a single dot.
const GOSLARITE_CRYSTALS_PER_ITEM = 3;
// Nucleation lag fraction: goslarite nucleates fast (highly soluble,
// low nucleation_sigma=1.0), but not at step 0. v11 sets nucleation
// at 5% of cellAgeSteps so the crystal age = 95% of cell age.
const GOSLARITE_NUCLEATION_LAG_FRAC = 0.05;
// Net-mass-after-pulse coefficient: integrated growth-minus-dissolution
// over many wet-dry cycles. 0.7 = 30% of grown mass redissolves on
// average. Tunable; the visual harness will tell us when this drifts.
const GOSLARITE_NET_MASS_COEFF = 0.7;
// Reference crystal mass at age=120 ticks (10 yrs) under ideal conditions
// (supersaturation=1, season_modulator=1). Mass scales linearly with
// age beyond this in v11; future passes will saturate at max_size_cm.
const GOSLARITE_REFERENCE_MASS_MG_AT_120_TICKS = 1.0;

function _seasonModulator(stepIdx: number): number {
  // Annual sinusoid: peak at month 9 (driest, deepest evaporation),
  // trough at month 3 (wettest spring). Period = 12 ticks.
  const phase = ((stepIdx % 12) - 9) * (Math.PI / 6);
  return 0.75 + 0.25 * Math.cos(phase);  // 0.5 at trough, 1.0 at peak
}

function _scenarioHasSO4Source(scenario: any): boolean {
  const inv = scenario && scenario.substrate_inventory;
  if (!Array.isArray(inv)) return false;
  for (const entry of inv) {
    if (GOSLARITE_SO4_SOURCE_TOKENS.indexOf(entry.token) >= 0) return true;
  }
  return false;
}

// Local Zn supersaturation factor, ad-hoc for v11. The galvanized item
// locally elevates Zn well above the zone-typical bulk value. We
// estimate "local Zn" as 200 mg/L (4× goslarite's required Zn=50)
// scaled down by zone confinement (cap_contact: full air contact, peak
// elevation; deep zones: less elevation due to drainage washing). The
// supersaturation score is then local Zn / required Zn.
function _localZnSupersaturation(zoneId: string): number {
  if (zoneId === "cap_contact") return 4.0;            // full O2, evaporation-concentrating
  if (zoneId === "acidogenic_horizon") return 2.5;     // moist but acidic, intermediate
  if (zoneId === "wall_contact_flank") return 1.5;     // drainage-flushed
  return 1.0;                                          // other zones: just at saturation
}

function growGoslarite(state: CellState): EngineCrystal[] {
  const out: EngineCrystal[] = [];
  if (!state || !state.scenario || !state.items || state.items.length === 0) return out;
  if (!_scenarioHasSO4Source(state.scenario)) return out;
  const mineral = (state.mineralSpec ?? {})["goslarite"];
  if (!mineral) return out;

  const cellAgeSteps = state.cellAgeSteps;
  const bornStep = Math.floor(cellAgeSteps * GOSLARITE_NUCLEATION_LAG_FRAC);
  const ageSteps = Math.max(0, cellAgeSteps - bornStep);
  const seasonAtBorn = _seasonModulator(bornStep);
  const seasonAtNow = _seasonModulator(cellAgeSteps);
  const growthRate = (typeof mineral.growth_rate_mult === "number") ? mineral.growth_rate_mult : 1.0;

  for (const item of state.items) {
    const tokens = item.substrate_tokens ?? [];
    if (tokens.indexOf(GOSLARITE_TARGET_SUBSTRATE) < 0) continue;

    const zoneMatch = (typeof _findItemZone === "function") ? _findItemZone(item, state.zoneSpec, state.geom) : null;
    if (!zoneMatch) continue;
    const phase = zoneMatch.zone && zoneMatch.zone.typical_phase;
    if (GOSLARITE_FRIENDLY_PHASES.indexOf(phase) < 0) continue;

    const supersat = _localZnSupersaturation(zoneMatch.id);
    if (supersat < 1.0) continue;  // goslarite doesn't nucleate at sub-saturation

    // Closed-form mass model: linear growth × seasonal pulse × net-mass
    // coefficient. Pegged so 10 yrs (120 ticks) at ideal conditions =
    // 1.0 mg of goslarite per crystal — small efflorescence flake scale.
    const baseMass = (ageSteps / 120) * GOSLARITE_REFERENCE_MASS_MG_AT_120_TICKS;
    const supersatBoost = Math.min(supersat, 6) / 4;  // diminishing returns past 4×
    // Pulse phase: average of season-at-now and season-at-born so we
    // capture both the current cycle and the one we nucleated in.
    const pulseModulator = (seasonAtBorn + seasonAtNow) / 2;
    const massPerCrystal = baseMass * growthRate * supersatBoost * pulseModulator * GOSLARITE_NET_MASS_COEFF;

    if (massPerCrystal <= 0) continue;

    // Deterministic per-item RNG so re-runs produce the same dot
    // positions. Mixes session seed + item id so BEGIN re-rolls
    // micro-position but not the gross output.
    const rng = _mulberry32Engine(_hashStrEngine(`engine|goslarite|${item.id}|${state.sessionSeed}`));

    for (let i = 0; i < GOSLARITE_CRYSTALS_PER_ITEM; i++) {
      const jitterX = (rng() - 0.5) * (item.w_m ?? 0.5) * 0.7;
      const jitterY = (rng() - 0.5) * (item.h_m ?? 0.5) * 0.7;
      out.push({
        mineral_id: "goslarite",
        host_item_id: item.id,
        host_item_class: item.class_id,
        zone_id: zoneMatch.id,
        x_m: (item.x_m ?? 0) + jitterX,
        y_m: (item.y_m ?? 0) + jitterY,
        age_steps: ageSteps,
        born_step: bornStep,
        crystal_mass_mg: massPerCrystal,
        source: "engine",
      });
    }
  }
  return out;
}
