// ============================================================
// js/07-cell-population.ts — deterministic tile-grid item placement
// ============================================================
//
// Given a scenario's items_in_cell counts and the loaded item-class catalog,
// returns a list of placed items snapped to a 1m × 1m tile grid covering
// the trapezoid's waste body. Per the boss's 2026-05-07 design framing:
// 'track what garbage is where before it breaks down' + 'a grid would be
// ideal, that way if there's a mining element later it makes tiles easier
// to handle.'
//
// Grid topology (TILE_SIZE_M = 1.0):
// - cell-local origin: top-left of the cell rim (inside the native flank,
//   at world x = nativeFlankWidthM, y = cellTopYM = aboveGradeM)
// - col (0..cellTopWidthM-1) is the horizontal tile index
// - row (0..cellDepthM-1) is the vertical tile index, increasing downward
// - tile (col, row) is "valid" when its full footprint sits within the
//   waste-body band (between cap stack and LCS+liner) AND inside the
//   trapezoid's slanted walls at that depth
//
// Placement algorithm (v0.1 — deterministic random with no-overlap):
// - Item classes processed largest-area-first (cars before fridges before
//   batteries) so big items get first claim on tiles. Same-class items
//   processed in instance-index order.
// - Each item gets a deterministic mulberry32 PRNG seeded by
//   (scenario.id + class_id + instance_index). Up to MAX_PLACEMENT_TRIES
//   attempts to find a valid + unoccupied tile block; items that can't
//   fit after MAX tries are dropped (warn-via-console at boot).
// - Each placed tile is recorded in an occupancy map; subsequent items
//   skip occupied tiles. The occupancy map is exported alongside the
//   placed-item list so future mining code can address tiles directly.
//
// NOT YET IMPLEMENTED (slated for future passes):
// - Differential settlement physics (dense items sink toward bottom of
//   each lift; rigid items resist compaction; fines fill voids).
// - Decay state (each item carries an age fraction relative to closure;
//   future passes will visualize decay as opacity/edge dissolve).
// - Crystal anchoring to specific tiles (next pass: each crystal dot
//   inherits the tile it sits in, so the narrator can name the host item
//   "battery #3 at lift 4 col 22 row 18").

const TILE_SIZE_M = 1.0;
const MAX_PLACEMENT_TRIES = 50;

interface PlacedItem {
  id: string;            // unique within scenario: ${classId}_${index}
  class_id: string;
  display_name: string;
  substrate_tokens: string[];
  size_class: string;
  rigid: boolean;
  tile_col: number;      // grid column (0 = leftmost cell-local tile)
  tile_row: number;      // grid row (0 = topmost cell-local tile)
  tile_w: number;        // footprint in tiles
  tile_h: number;
  x_m: number;           // center x in world meters (matches renderer's X() input)
  y_m: number;           // center y in world meters
  w_m: number;           // render width in m (= tile_w * TILE_SIZE_M)
  h_m: number;
}

interface CellPopulationGeom {
  cellTopWidthM: number;
  cellBottomWidthM: number;
  cellDepthM: number;
  nativeFlankWidthM: number;
  upperLayersM: number;   // sum of upper engineered layers thickness
  lowerLayersM: number;   // sum of lower engineered layers thickness
  cellTopYM: number;      // y at the cell rim (= aboveGradeM)
}

interface CellPopulationResult {
  items: PlacedItem[];
  occupancy: { [tileKey: string]: string };  // "col,row" → item_id
  unplaced: { [classId: string]: number };    // class_id → count of items that couldn't fit
  grid_cols: number;
  grid_rows: number;
  tile_size_m: number;
}

function _hashStr07(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function _mulberry32_07(seed: number): () => number {
  let t = seed >>> 0;
  return function () {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// Trapezoid clip: at cell-local depth y_m, returns the x-range (in cell-local
// meters) that is INSIDE the slanted walls. cell-local x=0 is at the cell's
// upper-left rim corner.
function _trapezoidXRangeAt(geom: CellPopulationGeom, yLocalM: number): { leftXM: number; rightXM: number } {
  const t = yLocalM / geom.cellDepthM;
  const wAtDepth = geom.cellTopWidthM * (1 - t) + geom.cellBottomWidthM * t;
  const leftXM = (geom.cellTopWidthM - wAtDepth) / 2;
  return { leftXM, rightXM: leftXM + wAtDepth };
}

// Test whether the rectangular tile block (col..col+w-1, row..row+h-1) fits
// entirely within the waste-body band AND inside the trapezoid's slanted
// walls at every tile's center depth.
function _tileBlockValid(geom: CellPopulationGeom, col: number, row: number, wTiles: number, hTiles: number): boolean {
  for (let dr = 0; dr < hTiles; dr++) {
    const yCellLocal = (row + dr + 0.5) * TILE_SIZE_M;
    if (yCellLocal < geom.upperLayersM) return false;
    if (yCellLocal > geom.cellDepthM - geom.lowerLayersM) return false;
    const range = _trapezoidXRangeAt(geom, yCellLocal);
    for (let dc = 0; dc < wTiles; dc++) {
      const xCellLocal = (col + dc + 0.5) * TILE_SIZE_M;
      if (xCellLocal < range.leftXM) return false;
      if (xCellLocal > range.rightXM) return false;
    }
  }
  return true;
}

function _isBlockFree(occupancy: { [k: string]: string }, col: number, row: number, wTiles: number, hTiles: number): boolean {
  for (let dr = 0; dr < hTiles; dr++) {
    for (let dc = 0; dc < wTiles; dc++) {
      if (occupancy[`${col + dc},${row + dr}`]) return false;
    }
  }
  return true;
}

function _markBlockOccupied(occupancy: { [k: string]: string }, col: number, row: number, wTiles: number, hTiles: number, itemId: string): void {
  for (let dr = 0; dr < hTiles; dr++) {
    for (let dc = 0; dc < wTiles; dc++) {
      occupancy[`${col + dc},${row + dr}`] = itemId;
    }
  }
}

function generatePlacedItems(
  scenario: any,
  itemSpec: { [id: string]: any } | null,
  geom: CellPopulationGeom,
  sessionSeed: number = 0,
): CellPopulationResult {
  const items: PlacedItem[] = [];
  const occupancy: { [k: string]: string } = {};
  const unplaced: { [classId: string]: number } = {};
  const gridCols = Math.floor(geom.cellTopWidthM / TILE_SIZE_M);
  const gridRows = Math.floor(geom.cellDepthM / TILE_SIZE_M);

  if (!scenario || !itemSpec || !scenario.items_in_cell) {
    return { items, occupancy, unplaced, grid_cols: gridCols, grid_rows: gridRows, tile_size_m: TILE_SIZE_M };
  }

  const counts = scenario.items_in_cell as { [classId: string]: number };

  // Sort classes largest-area-first so cars + fridges claim tiles before
  // batteries + drywall. Same-area ties broken by class_id alphabetical.
  const classOrder = Object.keys(counts)
    .filter((cid) => itemSpec[cid] && itemSpec[cid].size_class !== "fines")
    .map((cid) => {
      const k = itemSpec[cid];
      const wT = Math.max(1, Math.round(k.typical_dim_m[0] / TILE_SIZE_M));
      const hT = Math.max(1, Math.round(k.typical_dim_m[1] / TILE_SIZE_M));
      return { classId: cid, area: wT * hT, wT, hT };
    })
    .sort((a, b) => b.area - a.area || a.classId.localeCompare(b.classId));

  for (const co of classOrder) {
    const classId = co.classId;
    const klass = itemSpec[classId];
    const wTiles = co.wT;
    const hTiles = co.hT;
    const count = counts[classId];

    for (let i = 0; i < count; i++) {
      const seed = _hashStr07(`${scenario.id}|${classId}|${i}|${sessionSeed}`);
      const rng = _mulberry32_07(seed);

      let placedThis = false;
      for (let attempt = 0; attempt < MAX_PLACEMENT_TRIES; attempt++) {
        // Pick a random anchor (col, row) such that the block fits inside the
        // grid bounds. Trapezoid + occupancy validity checked next.
        const col = Math.floor(rng() * Math.max(1, gridCols - wTiles + 1));
        const row = Math.floor(rng() * Math.max(1, gridRows - hTiles + 1));

        if (!_tileBlockValid(geom, col, row, wTiles, hTiles)) continue;
        if (!_isBlockFree(occupancy, col, row, wTiles, hTiles)) continue;

        const itemId = `${classId}_${i}`;
        _markBlockOccupied(occupancy, col, row, wTiles, hTiles, itemId);

        // Convert tile coords to world meters for the renderer.
        const cellLocalCenterX = (col + wTiles / 2) * TILE_SIZE_M;
        const cellLocalCenterY = (row + hTiles / 2) * TILE_SIZE_M;
        const worldX = geom.nativeFlankWidthM + cellLocalCenterX;
        const worldY = geom.cellTopYM + cellLocalCenterY;

        items.push({
          id: itemId,
          class_id: classId,
          display_name: klass.display_name,
          substrate_tokens: klass.substrate_tokens,
          size_class: klass.size_class,
          rigid: klass.rigid,
          tile_col: col,
          tile_row: row,
          tile_w: wTiles,
          tile_h: hTiles,
          x_m: worldX,
          y_m: worldY,
          w_m: wTiles * TILE_SIZE_M,
          h_m: hTiles * TILE_SIZE_M,
        });
        placedThis = true;
        break;
      }
      if (!placedThis) {
        unplaced[classId] = (unplaced[classId] ?? 0) + 1;
      }
    }
  }

  return { items, occupancy, unplaced, grid_cols: gridCols, grid_rows: gridRows, tile_size_m: TILE_SIZE_M };
}
