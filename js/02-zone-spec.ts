// ============================================================
// js/02-zone-spec.ts — chemistry-zone spec types + loader
// ============================================================
//
// Type declarations for the zone catalog at data/zones.json. Parallel in
// shape to 00-mineral-spec and 01-scenario-spec: the JSON is the source of
// truth, this file gives TypeScript names to the spec.
//
// Zones are the chemistry territories within the trapezoid (cell pit). The
// boss's design framing 2026-05-07: trapezoid-as-vugg-wall is the engine
// port from vugg-simulator; chemistry varies across the pit by depth and
// centrality, with the LCS layer at the bottom as its own distinct zone.
// Zones compose with substrate (per minerals.json substrate_grows_on) and
// chemistry — three axes (zone × substrate × chemistry), not zone alone.
//
// Loader: at boot, fetch data/zones.json and assign the .zones dict to the
// global ZONE_SPEC. Until the fetch resolves, ZONE_SPEC is null. Code that
// needs the spec should await onZoneSpecReady() or check ZONE_SPEC_READY.

type ZonePositionClass = "depth_band" | "wall_band" | "bottom_strip";

type ZonePhase =
  | "acid"
  | "acid_leaning"
  | "methanogenic"
  | "stable"
  | "alkaline_cap"
  | "burn_zone"
  | "mixed"
  | "biofilm";

type ZoneRedox = "reducing" | "oxidizing" | "mixed" | "drainage_oxidized";

type ZoneBoundaryStyle = "dashed" | "solid" | "none";

interface ZoneGeometryDepthBand {
  depth_frac_top: number;
  depth_frac_bottom: number;
  radial_extent_frac: number;
  _note?: string;
}

interface ZoneGeometryWallBand {
  inset_m: number;
  _note?: string;
}

interface ZoneGeometryBottomStrip {
  occupies: string;
  _note?: string;
}

type ZoneGeometry =
  | ZoneGeometryDepthBand
  | ZoneGeometryWallBand
  | ZoneGeometryBottomStrip;

interface ZoneEntry {
  id: string;
  name: string;
  position_class: ZonePositionClass;
  geometry: ZoneGeometry;
  typical_phase: ZonePhase;
  typical_redox: ZoneRedox;
  characteristic_ions_mg_per_L: { [species: string]: number | string };
  expected_mineral_clusters: string[];
  color_visual: string;
  boundary_style: ZoneBoundaryStyle;
  label: string;
  description: string;
}

interface ZoneSpecFile {
  _schema_version: string;
  _last_updated: string;
  _source_of_truth_for: string[];
  _source_of_truth_note: string;
  _schema: { [field: string]: string };
  _audit_summary: {
    total_zones: number;
    by_position_class: { [cls: string]: number };
    by_typical_phase: { [phase: string]: number };
    _notes: string;
  };
  zones: { [id: string]: ZoneEntry };
}

let ZONE_SPEC: { [id: string]: ZoneEntry } | null = null;
let ZONE_SPEC_READY = false;
const _zoneReadyCallbacks: Array<() => void> = [];

function onZoneSpecReady(cb: () => void): void {
  if (ZONE_SPEC_READY) cb();
  else _zoneReadyCallbacks.push(cb);
}

async function _loadZoneSpec(): Promise<void> {
  try {
    const resp = await fetch("data/zones.json");
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const file = (await resp.json()) as ZoneSpecFile;
    ZONE_SPEC = file.zones;
    ZONE_SPEC_READY = true;
    for (const cb of _zoneReadyCallbacks) cb();
    _zoneReadyCallbacks.length = 0;
    const cls = file._audit_summary.by_position_class;
    const clsLine = `${cls.depth_band ?? 0} depth_band / ${cls.wall_band ?? 0} wall_band / ${cls.bottom_strip ?? 0} bottom_strip`;
    console.info(`[zones] loaded ${Object.keys(file.zones).length} zones from data/zones.json (schema ${file._schema_version}; ${clsLine})`);
  } catch (e) {
    console.warn(`[zones] data/zones.json fetch failed: ${e instanceof Error ? e.message : e}. ZONE_SPEC remains null.`);
  }
}

_loadZoneSpec();
