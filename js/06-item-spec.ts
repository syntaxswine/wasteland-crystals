// ============================================================
// js/06-item-spec.ts — item-class spec types + loader
// ============================================================
//
// Type declarations for the item-class catalog at data/item_classes.json.
// Per the boss's 2026-05-07 design framing: 'there should be a variable
// inventory of items in the trash that can break down. you will probably
// want a system to track what garbage is where before it breaks down.'
//
// Item classes are the discrete things that exist in a cell — appliances,
// batteries, drywall sheets, etc. Each carries the substrate tokens it
// contributes to local chemistry. Per-scenario item counts live in
// scenarios.json items_in_cell; placement is procedural (07-cell-population.ts)
// with a deterministic seed.
//
// Loader: at boot, fetch data/item_classes.json and assign the .item_classes
// dict to the global ITEM_SPEC. Until the fetch resolves, ITEM_SPEC is null.
// Code that needs the spec should await onItemSpecReady() or check
// ITEM_SPEC_READY.

type ItemSizeClass = "coarse_rigid_void" | "medium" | "fines";

interface ItemClassEntry {
  id: string;
  display_name: string;
  substrate_tokens: string[];
  size_class: ItemSizeClass;
  rigid: boolean;
  typical_dim_m: [number, number];
  typical_mass_kg: number;
  decay_phase_window: string[];
  decay_timescale_yr: number;
  description: string;
}

interface ItemSpecFile {
  _schema_version: string;
  _last_updated: string;
  _source_of_truth_for: string[];
  _source_of_truth_note: string;
  _schema: { [field: string]: string };
  _audit_summary: {
    total_classes: number;
    by_size_class: { [cls: string]: number };
    _notes: string;
  };
  item_classes: { [id: string]: ItemClassEntry };
}

let ITEM_SPEC: { [id: string]: ItemClassEntry } | null = null;
let ITEM_SPEC_READY = false;
const _itemReadyCallbacks: Array<() => void> = [];

function onItemSpecReady(cb: () => void): void {
  if (ITEM_SPEC_READY) cb();
  else _itemReadyCallbacks.push(cb);
}

async function _loadItemSpec(): Promise<void> {
  try {
    const resp = await fetch("data/item_classes.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const file = (await resp.json()) as ItemSpecFile;
    ITEM_SPEC = file.item_classes;
    ITEM_SPEC_READY = true;
    for (const cb of _itemReadyCallbacks) cb();
    _itemReadyCallbacks.length = 0;
    const sz = file._audit_summary.by_size_class;
    const szLine = `${sz.coarse_rigid_void ?? 0} coarse_rigid_void / ${sz.medium ?? 0} medium / ${sz.fines ?? 0} fines`;
    console.info(`[items] loaded ${Object.keys(file.item_classes).length} item classes from data/item_classes.json (schema ${file._schema_version}; ${szLine})`);
  } catch (e) {
    console.warn(`[items] data/item_classes.json fetch failed: ${e instanceof Error ? e.message : e}. ITEM_SPEC remains null.`);
  }
}

_loadItemSpec();
