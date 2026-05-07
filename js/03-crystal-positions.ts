// ============================================================
// js/03-crystal-positions.ts — deterministic crystal-dot generator
// ============================================================
//
// Given a scenario + the loaded zones + minerals catalogs, returns a list of
// dot positions in cell-local coordinates (meters), each tagged with its
// mineral_id and evidence_role. Used by the renderer to scatter "simple
// dots for the crystal locations" (boss instruction 2026-05-07) over the
// schematic — pre-engine placeholder for what will eventually be the
// per-cell crystal-growth model output.
//
// Design choices:
// - Active_zones is NOT a placement filter. Crystals nucleated in zones
//   that have since waned still persist (a future-miner sees ACCUMULATED
//   paragenesis since cell closure, not just the current chemistry
//   snapshot). active_zones gates only the zone TINTS in the schematic.
// - Placement uses zones.json expected_mineral_clusters: a mineral grows
//   wherever the zone has it in its expected cluster, regardless of the
//   scenario's current phase.
// - Dot count per (zone, mineral) scales with evidence_role:
//     directly_observed                   → 6 dots
//     implied_by_substrate_chemistry      → 4 dots
//     predicted_from_program_synthesis    → 2 dots
// - Determinism: mulberry32 PRNG seeded by hash(scenario_id + mineral_id +
//   zone_id) so dots are stable across reloads but differ across
//   (scenario × mineral × zone) tuples.
//
// Future engine work will replace this generator with the per-cell
// crystal-growth output; the dot list shape is stable so the renderer
// can keep consuming the same data.

interface CrystalDot {
  x_m: number;          // cell-local meters from xWorld origin (matches renderer's X())
  y_m: number;          // cell-local meters from yWorld origin
  mineral_id: string;
  evidence_role: string;
  zone_id: string;
  host_item_id: string | null;     // when set, the placed-item this crystal grew on (e.g. "lead_acid_battery_3")
  host_item_class: string | null;  // class_id of the host item ("lead_acid_battery"); null when no item-anchor
}

// Per-mineral display color. Tokens come from minerals.json color_visual but
// the renderer carries the canonical hex mapping (similar to how host-rock
// colors live in the renderer in vugg-simulator's host-rock branch).
// Picked to be visually distinct over the dark cyberpunk backdrop and to
// match each mineral's real-world reference color where possible.
const MINERAL_COLORS: { [id: string]: string } = {
  // Sulfates
  goslarite:     "#f5f0e6",  // white acicular efflorescence
  anglesite:     "#e8e0c0",  // tabular white-cream
  jarosite:      "#c08828",  // ochre-yellow
  posnjakite:    "#3070b0",  // posnjakite blue

  // Carbonates
  malachite:     "#2d9c4c",  // malachite green
  hydrozincite:  "#d8d0c0",  // off-white pearl
  cerussite:     "#e8d8c0",  // pale cream
  calcite:       "#e0dcb8",  // ivory

  // Halide-hydroxides / hydroxide-halides
  simonkolleite: "#8cb8b8",  // pale blue-grey
  atacamite:     "#1cac6c",  // electric atacamite green

  // Phosphates
  pyromorphite:  "#90b840",  // olive-green hexagonal prisms
  struvite:      "#e8e0d4",  // white-prismatic
  vivianite:     "#3a5fa8",  // vivianite blue (oxidized)

  // Oxides
  ettringite:    "#f0eadc",  // white acicular
  goethite:      "#9a5424",  // ferric brown
  tenorite:      "#1a1a1a",  // black
  cuprite:       "#a02828",  // ruby red

  // Sulfides
  sphalerite:    "#c0883c",  // amber to dark brown
  galena:        "#8a8a92",  // lead grey
  pyrite:        "#d8b438",  // brassy gold
  covellite:     "#283c70",  // indigo-blue

  // Native metals
  native_copper: "#b87038",  // copper red-brown
  native_silver: "#dcdce0",  // silver-grey
};

const FALLBACK_DOT_COLOR = "#888888";

function mineralDotColor(mineralId: string): string {
  return MINERAL_COLORS[mineralId] ?? FALLBACK_DOT_COLOR;
}

function _dotsForRole(role: string): number {
  if (role === "directly_observed") return 6;
  if (role === "implied_by_substrate_chemistry") return 4;
  if (role === "predicted_from_program_synthesis") return 2;
  return 1;
}

// mulberry32 PRNG — deterministic, fast, reasonable distribution.
function _mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Cheap string hash → uint32. Good enough for seed derivation.
function _hashStr(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

// Cell trapezoid geometry helper — duplicated from the renderer's local
// computations. Reads cellTopWidthM/etc. from a config-shaped object.
interface CellGeomInput {
  cellTopWidthM: number;
  cellBottomWidthM: number;
  cellDepthM: number;
  nativeFlankWidthM: number;
  upperLayersM: number;   // sum of upperLayers thicknessM (waste body starts at cellTopYM + upperLayersM)
  lowerLayersM: number;   // sum of lowerLayers thicknessM (waste body ends at cellTopYM + cellDepthM - lowerLayersM)
  cellTopYM: number;      // y-coord of cell rim in cell-local meters (= aboveGradeM)
  lcsThicknessM: number;  // thickness of LCS layer (lowerLayers[0])
}

function _widthAtDepth(geom: CellGeomInput, mDepth: number): { leftXM: number; rightXM: number } {
  const t = mDepth / geom.cellDepthM;
  const w = geom.cellTopWidthM * (1 - t) + geom.cellBottomWidthM * t;
  const cx = geom.nativeFlankWidthM + geom.cellTopWidthM / 2;
  return { leftXM: cx - w / 2, rightXM: cx + w / 2 };
}

// Sample one dot position within a zone's geometry. Reads zone shape from
// a zone entry (any cast — the actual ZoneEntry type lives in 02-zone-spec).
function _sampleZonePoint(zone: any, geom: CellGeomInput, rng: () => number): { x_m: number; y_m: number } {
  if (zone.position_class === "depth_band") {
    // Pick a depth fraction within [depth_frac_top, depth_frac_bottom],
    // then a horizontal fraction within radial_extent_frac of that depth's
    // cell width, centered.
    const ft = zone.geometry.depth_frac_top;
    const fb = zone.geometry.depth_frac_bottom;
    const rextent = zone.geometry.radial_extent_frac;
    const f = ft + rng() * (fb - ft);
    const mDepth = f * geom.cellDepthM;
    const w = _widthAtDepth(geom, mDepth);
    const cellWidthM = w.rightXM - w.leftXM;
    const usableWidthM = cellWidthM * rextent;
    const cx = (w.leftXM + w.rightXM) / 2;
    const xOffset = (rng() - 0.5) * usableWidthM;
    return { x_m: cx + xOffset, y_m: geom.cellTopYM + mDepth };
  } else if (zone.position_class === "wall_band") {
    const inset = zone.geometry.inset_m;
    // Pick a depth within the cell, then place on left or right wall flank.
    const mDepth = rng() * geom.cellDepthM;
    const w = _widthAtDepth(geom, mDepth);
    const useLeft = rng() < 0.5;
    const wallX = useLeft ? w.leftXM : w.rightXM;
    const insetSign = useLeft ? +1 : -1;
    const xOffset = rng() * inset * insetSign;
    return { x_m: wallX + xOffset, y_m: geom.cellTopYM + mDepth };
  } else if (zone.position_class === "bottom_strip") {
    // LCS layer: y in [cellTopYM + cellDepthM - lowerLayersM, +lcsThicknessM],
    // x within the cell width at that depth.
    const yTopOfLcsM = geom.cellTopYM + geom.cellDepthM - geom.lowerLayersM;
    const yBotOfLcsM = yTopOfLcsM + geom.lcsThicknessM;
    const mDepth = (yTopOfLcsM + rng() * (yBotOfLcsM - yTopOfLcsM)) - geom.cellTopYM;
    const w = _widthAtDepth(geom, mDepth);
    const cellWidthM = w.rightXM - w.leftXM;
    const cx = (w.leftXM + w.rightXM) / 2;
    const xOffset = (rng() - 0.5) * cellWidthM * 0.92; // keep dots a hair inside the LCS strip
    return { x_m: cx + xOffset, y_m: geom.cellTopYM + mDepth };
  }
  // Fallback — shouldn't hit if zone JSON is well-formed.
  return { x_m: geom.nativeFlankWidthM + geom.cellTopWidthM / 2, y_m: geom.cellTopYM + geom.cellDepthM / 2 };
}

// Helpers for v8 item-anchored placement: substrate matching + item-zone test.

function _substratesMatch(itemTokens: string[], mineralTokens: string[]): boolean {
  for (const t of itemTokens) {
    if (mineralTokens.indexOf(t) >= 0) return true;
  }
  return false;
}

// True when the placed item's CENTER falls inside the zone's footprint. Items
// are placed with x_m/y_m in WORLD-meter coords (per 07-cell-population.ts);
// zones are defined in cell-local coords, so we subtract the geom origins.
function _itemInZone(item: any, zone: any, geom: CellGeomInput): boolean {
  const cellLocalX = item.x_m - geom.nativeFlankWidthM;
  const cellLocalY = item.y_m - geom.cellTopYM;

  if (zone.position_class === "depth_band") {
    const yTop = zone.geometry.depth_frac_top * geom.cellDepthM;
    const yBot = zone.geometry.depth_frac_bottom * geom.cellDepthM;
    if (cellLocalY < yTop || cellLocalY > yBot) return false;
    const t = cellLocalY / geom.cellDepthM;
    const wAt = geom.cellTopWidthM * (1 - t) + geom.cellBottomWidthM * t;
    const usableHalfWidth = wAt * zone.geometry.radial_extent_frac / 2;
    const cellCx = geom.cellTopWidthM / 2;
    return Math.abs(cellLocalX - cellCx) <= usableHalfWidth;
  }

  if (zone.position_class === "wall_band") {
    const t = cellLocalY / geom.cellDepthM;
    const wAt = geom.cellTopWidthM * (1 - t) + geom.cellBottomWidthM * t;
    const leftEdge = (geom.cellTopWidthM - wAt) / 2;
    const rightEdge = leftEdge + wAt;
    const inset = zone.geometry.inset_m;
    return (cellLocalX - leftEdge) <= inset || (rightEdge - cellLocalX) <= inset;
  }

  // bottom_strip: items don't get placed in the LCS layer (07-cell-population
  // confines them to the waste body), so the LCS biofilm zone has no items.
  return false;
}

function generateCrystalDots(
  scenario: any,
  zoneSpec: { [id: string]: any },
  mineralSpec: { [id: string]: any } | null,
  items: any[] | null,
  geom: CellGeomInput,
): CrystalDot[] {
  const dots: CrystalDot[] = [];
  if (!scenario || !zoneSpec) return dots;

  const itemList = items ?? [];

  const expectedSpecies = scenario.expected_species ?? {};
  for (const mineralId of Object.keys(expectedSpecies)) {
    const speciesEntry = expectedSpecies[mineralId];
    const role = speciesEntry.evidence_role;
    const dotsPerZone = _dotsForRole(role);
    const mineralEntry = mineralSpec ? mineralSpec[mineralId] : null;
    const mineralSubstrates: string[] = (mineralEntry && mineralEntry.substrate_grows_on) || [];

    // Find which zones reference this mineral in expected_mineral_clusters.
    // Note: NOT filtered by scenario.active_zones — see file header for why.
    for (const zoneId of Object.keys(zoneSpec)) {
      const zone = zoneSpec[zoneId];
      const cluster: string[] = zone.expected_mineral_clusters ?? [];
      if (!cluster.includes(mineralId)) continue;

      // v8: candidate hosts = items in this zone whose substrate_tokens
      // intersect the mineral's substrate_grows_on. When at least one host
      // exists, dots anchor to hosts (with small jitter). When none exist
      // (e.g. lcs_biofilm zone has no items by design; or vocabulary gaps
      // for some minerals), fall back to zone-uniform placement.
      const candidateHosts: any[] = mineralSubstrates.length > 0
        ? itemList.filter((it) => _substratesMatch(it.substrate_tokens, mineralSubstrates) && _itemInZone(it, zone, geom))
        : [];

      const seed = _hashStr(`${scenario.id}|${mineralId}|${zoneId}`);
      const rng = _mulberry32(seed);

      for (let i = 0; i < dotsPerZone; i++) {
        if (candidateHosts.length > 0) {
          // Round-robin host pick + small jitter inside the host's footprint.
          const host = candidateHosts[i % candidateHosts.length];
          const jitterX = (rng() - 0.5) * host.w_m * 0.6;
          const jitterY = (rng() - 0.5) * host.h_m * 0.6;
          dots.push({
            x_m: host.x_m + jitterX,
            y_m: host.y_m + jitterY,
            mineral_id: mineralId,
            evidence_role: role,
            zone_id: zoneId,
            host_item_id: host.id,
            host_item_class: host.class_id,
          });
        } else {
          const pt = _sampleZonePoint(zone, geom, rng);
          dots.push({
            x_m: pt.x_m,
            y_m: pt.y_m,
            mineral_id: mineralId,
            evidence_role: role,
            zone_id: zoneId,
            host_item_id: null,
            host_item_class: null,
          });
        }
      }
    }
  }
  return dots;
}
