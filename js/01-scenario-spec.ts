// ============================================================
// js/01-scenario-spec.ts — ELFM scenario spec types + loader
// ============================================================
//
// Type declarations for the scenario catalog at data/scenarios.json. Parallel
// in shape to 00-mineral-spec.ts: the JSON file is the source of truth, this
// file just gives TypeScript names to the spec so engine code (when it lands)
// can be statically checked.
//
// A scenario is a real-world ELFM site characterization — the cell that the
// player is "working today" per the operative narrative frame
// (proposals/PROPOSAL-WASTELAND-CRYSTALS.md §'Update 2026-05-07'). The schema
// is structured around the evidence pedigree of the data: what the cited
// excavation paper directly observed vs. what the chemistry implies vs. what
// a multi-site program synthesis covers without site-specific granularity.
//
// Loader: at boot, fetch data/scenarios.json and assign the .scenarios dict
// to the global SCENARIO_SPEC. Until the fetch resolves, SCENARIO_SPEC is
// null. Code that needs the spec should await onScenarioSpecReady() or check
// SCENARIO_SPEC_READY.

type SiteClass =
  | "municipal_landfill"
  | "mswi_bottom_ash_cell"
  | "mixed_msw_legacy"
  | "leachate_collection_biofilm"
  | "construction_demolition_pile";

type ScenarioEvidenceLevel =
  | "landfill_specific"
  | "program_synthesis"
  | "chemistry_archetype";

type DominantPhase =
  | "acid"
  | "methanogenic"
  | "stable"
  | "alkaline_cap"
  | "burn_zone";

type EvidenceRole =
  | "directly_observed"
  | "implied_by_substrate_chemistry"
  | "predicted_from_program_synthesis";

interface ScenarioLocation {
  country: string;
  region: string;
  locality: string;
}

type SubstrateEvidenceBasis = "documented" | "implied_typical_msw";

interface SubstrateInventoryItem {
  token: string;
  evidence_basis?: SubstrateEvidenceBasis;
  note: string;
}

interface ScenarioLeachateChemistry {
  pH: number;
  T_C: number;
  redox: string;
  ions_mg_per_L: { [species: string]: number };
  _note?: string;
}

interface ScenarioExpectedSpecies {
  evidence_role: EvidenceRole;
  note: string;
}

interface ScenarioEntry {
  id: string;
  name: string;
  site_class: SiteClass;
  location: ScenarioLocation;
  operator_or_excavator: string;
  excavation_year: number;
  citations: string[];
  evidence_level: ScenarioEvidenceLevel;
  waste_age_years: number;
  dominant_phase: DominantPhase;
  active_zones: string[];
  items_in_cell?: { [itemClassId: string]: number };
  substrate_inventory: SubstrateInventoryItem[];
  leachate_chemistry: ScenarioLeachateChemistry;
  expected_species: { [mineralId: string]: ScenarioExpectedSpecies };
  player_brief: string;
  _active_zones_note?: string;
}

interface ScenarioSpecFile {
  _schema_version: string;
  _last_updated: string;
  _source_of_truth_for: string[];
  _source_of_truth_note: string;
  _schema: { [field: string]: string };
  _audit_summary: {
    total_scenarios: number;
    by_site_class: { [siteClass: string]: number };
    by_evidence_level: { [level: string]: number };
    _notes: string;
  };
  scenarios: { [id: string]: ScenarioEntry };
}

let SCENARIO_SPEC: { [id: string]: ScenarioEntry } | null = null;
let SCENARIO_SPEC_READY = false;
const _scenarioReadyCallbacks: Array<() => void> = [];

function onScenarioSpecReady(cb: () => void): void {
  if (SCENARIO_SPEC_READY) cb();
  else _scenarioReadyCallbacks.push(cb);
}

async function _loadScenarioSpec(): Promise<void> {
  try {
    const resp = await fetch("data/scenarios.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const file = (await resp.json()) as ScenarioSpecFile;
    SCENARIO_SPEC = file.scenarios;
    SCENARIO_SPEC_READY = true;
    for (const cb of _scenarioReadyCallbacks) cb();
    _scenarioReadyCallbacks.length = 0;
    const ev = file._audit_summary.by_evidence_level;
    const evLine = `${ev.landfill_specific ?? 0} landfill_specific / ${ev.program_synthesis ?? 0} program_synthesis / ${ev.chemistry_archetype ?? 0} archetype`;
    console.info(`[scenarios] loaded ${Object.keys(file.scenarios).length} scenarios from data/scenarios.json (schema ${file._schema_version}; ${evLine})`);
  } catch (e) {
    console.warn(`[scenarios] data/scenarios.json fetch failed: ${e instanceof Error ? e.message : e}. SCENARIO_SPEC remains null.`);
  }
}

_loadScenarioSpec();
