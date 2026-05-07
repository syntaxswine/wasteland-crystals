// ============================================================
// js/05-precursor-spec.ts — precursor-origin spec types + loader
// ============================================================
//
// Type declarations for the precursor catalog at data/precursors.json. Per
// the boss's 2026-05-07 design note: 'i think the units of precursor
// chemicals will have to have origins attached to them to get an accurate
// paragenesis.' This spec maps each precursor token (used in minerals.json
// decay_precursor arrays) to its source substrate, the chemical species it
// delivers, and the decay mechanism by which the substrate releases it.
//
// Narrators (js/04-narrators.ts) compose paragenesis by intersecting the
// active scenario's substrate_inventory with the mineral's decay_precursor
// array against this catalog — the chain becomes
//
//   mineral.decay_precursor → precursor.source_substrate → scenario.substrate_inventory
//
// where each link is a confirmed origin if all three resolve. Narrators
// hedge prose for substrates whose evidence_basis is implied_typical_msw
// rather than documented.
//
// Loader: at boot, fetch data/precursors.json and assign the .precursors
// dict to the global PRECURSOR_SPEC. Until the fetch resolves, PRECURSOR_SPEC
// is null. Code that needs the spec should await onPrecursorSpecReady() or
// check PRECURSOR_SPEC_READY.

interface PrecursorEntry {
  id: string;
  species: string;
  source_substrate: string;
  decay_mechanism: string;
  phase_window: string[];
  narrator_phrase_short: string;
}

interface PrecursorSpecFile {
  _schema_version: string;
  _last_updated: string;
  _source_of_truth_for: string[];
  _source_of_truth_note: string;
  _schema: { [field: string]: string };
  _audit_summary: {
    total_precursors: number;
    _notes: string;
  };
  precursors: { [id: string]: PrecursorEntry };
}

let PRECURSOR_SPEC: { [id: string]: PrecursorEntry } | null = null;
let PRECURSOR_SPEC_READY = false;
const _precursorReadyCallbacks: Array<() => void> = [];

function onPrecursorSpecReady(cb: () => void): void {
  if (PRECURSOR_SPEC_READY) cb();
  else _precursorReadyCallbacks.push(cb);
}

async function _loadPrecursorSpec(): Promise<void> {
  try {
    const resp = await fetch("data/precursors.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const file = (await resp.json()) as PrecursorSpecFile;
    PRECURSOR_SPEC = file.precursors;
    PRECURSOR_SPEC_READY = true;
    for (const cb of _precursorReadyCallbacks) cb();
    _precursorReadyCallbacks.length = 0;
    console.info(`[precursors] loaded ${Object.keys(file.precursors).length} precursors from data/precursors.json (schema ${file._schema_version})`);
  } catch (e) {
    console.warn(`[precursors] data/precursors.json fetch failed: ${e instanceof Error ? e.message : e}. PRECURSOR_SPEC remains null.`);
  }
}

_loadPrecursorSpec();
