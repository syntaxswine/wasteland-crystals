// ============================================================
// js/00-mineral-spec.ts — anthropogenic mineral spec types + loader
// ============================================================
//
// Type declarations for the mineral catalog at data/minerals.json. The JSON
// file is the source of truth; this file just gives TypeScript names to
// the shape so engine code (when it lands) can be statically checked.
//
// Loader: at boot, fetch data/minerals.json and assign the .minerals
// dict to the global MINERAL_SPEC. Until the fetch resolves, MINERAL_SPEC
// is null. Code that needs the spec should await onSpecReady() or check
// MINERAL_SPEC_READY.
//
// No fallback yet (vugg-simulator's pattern of inline MINERAL_SPEC_FALLBACK
// is not yet ported). This means file:// browser-opens will see no minerals
// until the file is served via http. Fine for v1 where there's no engine
// depending on the spec.

type ChemistryPhase =
  | "acid"
  | "methanogenic"
  | "stable"
  | "alkaline_cap"
  | "burn_zone"
  | "burn_halo";

type RedoxRequirement = "reducing" | "oxidizing" | "any";

type MineralClass =
  | "sulfate"
  | "carbonate"
  | "halide_hydroxide"
  | "hydroxide_halide"
  | "phosphate"
  | "oxide"
  | "sulfide"
  | "native"
  | "mixed";

type EvidenceLevel =
  | "landfill_specific"
  | "anthropogenic_documented"
  | "geological_analog"
  | "chemistry_predicted";

interface MineralEntry {
  formula: string;
  class: MineralClass;
  habit: string;
  substrate_grows_on: string[];
  chemistry_phase: ChemistryPhase[];
  decay_precursor: string[];
  nucleation_sigma: number;
  max_size_cm: number;
  growth_rate_mult: number;
  T_range_C: [number, number];
  pH_optimum: [number, number];
  redox_requirement: RedoxRequirement;
  required_ingredients: { [species: string]: number };
  color_visual: string;
  description: string;
  citations: string[];
  evidence_level: EvidenceLevel;
}

interface MineralSpecFile {
  _schema_version: string;
  _last_updated: string;
  _source_of_truth_for: string[];
  _source_of_truth_note: string;
  _schema: { [field: string]: string };
  _audit_summary: {
    total_minerals: number;
    classes_covered: string[];
    classes_pending: string[];
    by_evidence_level: {
      landfill_specific: number;
      anthropogenic_documented: number;
      geological_analog: number;
      chemistry_predicted: number;
    };
    _notes: string;
  };
  minerals: { [name: string]: MineralEntry };
}

let MINERAL_SPEC: { [name: string]: MineralEntry } | null = null;
let MINERAL_SPEC_READY = false;
const _specReadyCallbacks: Array<() => void> = [];

function onSpecReady(cb: () => void): void {
  if (MINERAL_SPEC_READY) cb();
  else _specReadyCallbacks.push(cb);
}

async function _loadMineralSpec(): Promise<void> {
  try {
    const resp = await fetch("data/minerals.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const file = (await resp.json()) as MineralSpecFile;
    MINERAL_SPEC = file.minerals;
    MINERAL_SPEC_READY = true;
    for (const cb of _specReadyCallbacks) cb();
    _specReadyCallbacks.length = 0;
    const ev = file._audit_summary.by_evidence_level;
    console.info(`[spec] loaded ${Object.keys(file.minerals).length} minerals from data/minerals.json (schema ${file._schema_version}; ${ev.landfill_specific} landfill_specific / ${ev.anthropogenic_documented} anthropogenic / ${ev.geological_analog} analog / ${ev.chemistry_predicted} predicted)`);
  } catch (e) {
    console.warn(`[spec] data/minerals.json fetch failed: ${e instanceof Error ? e.message : e}. MINERAL_SPEC remains null.`);
  }
}

// Kick off the fetch as soon as the bundle loads. Top-level await is not
// available in script-mode TS, so we fire-and-forget.
_loadMineralSpec();
