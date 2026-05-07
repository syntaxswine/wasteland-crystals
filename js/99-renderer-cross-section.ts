// ============================================================
// js/99-renderer-cross-section.ts — vector schematic of a landfill cell
// ============================================================
//
// Renders a textbook secure-landfill cross-section as inline SVG. This is
// the canonical "map view" for Wasteland Crystals (per proposal §"Map view —
// cross-section schematic"): cap → gas collection → waste lifts → leachate
// collection → composite base liner → native soil + water table, with gas
// extraction wells, monitoring wells, and a leachate sump as side annotations.
//
// v0.5 (skeleton renderer): hardcoded geometry + layer set. No PileState
// hookup yet — the data structure that will eventually drive this renderer
// (per-cell substrate type, per-cell phase, perched-leachate level, lift
// stratigraphy) doesn't exist in the engine yet. When v2 ports the pile
// geometry, this file will be parameterized off PileState instead of the
// inline DEFAULT_SCHEMATIC.
//
// SVG choice: vector is correct for the schematic level. Crisp at any zoom,
// CSS-stylable per-feature, DOM-inspectable. Canvas-2D and Three.js belong
// to the detail view (zoomed-in crystal habits), not this top-level diagram.

interface SchematicLayer {
  name: string;
  thicknessM: number;
  cls: string;        // CSS class for fill
  showLabel?: boolean;
}

interface SchematicLift {
  // Each lift is a horizontal band of waste body, separated from neighbors
  // by a thin daily-cover stripe.
  ageLabel: string;   // e.g. "1995", "1992-93"
  phaseLabel: string; // e.g. "methanogenic", "stabilized"
  cls: string;        // CSS class for fill (greys graduate by age)
}

interface SchematicConfig {
  // World coordinates: meters. SVG handles the m→px scale.
  cellTopWidthM: number;
  cellBottomWidthM: number;
  cellDepthM: number;
  aboveGradeM: number;       // depth of native ground above the cell rim shown
  nativeFlankWidthM: number; // native soil shown on each side
  waterTableDepthM: number;  // depth below cap to water table

  upperLayers: SchematicLayer[];   // top-down: cap layers + gas collection
  lifts: SchematicLift[];          // top-down: oldest at bottom of array displays at top
  lowerLayers: SchematicLayer[];   // top-down: leachate collection + composite liner

  gasVentXFractions: number[];      // x positions in cap, as fraction of top width
  monitoringWellXOffsetsM: number[]; // x offsets from cell edges, into native ground
}

const DEFAULT_SCHEMATIC: SchematicConfig = {
  cellTopWidthM: 80,
  cellBottomWidthM: 56,
  cellDepthM: 30,
  aboveGradeM: 6,
  nativeFlankWidthM: 18,
  waterTableDepthM: 38,

  upperLayers: [
    { name: "VEGETATIVE COVER", thicknessM: 0.5, cls: "layer-veg",     showLabel: true },
    { name: "BARRIER LAYER",    thicknessM: 0.5, cls: "layer-barrier", showLabel: true },
    { name: "GAS COLLECTION",   thicknessM: 0.4, cls: "layer-gas",     showLabel: true },
  ],

  lifts: [
    // newest at top of waste body → oldest at bottom; phase progresses with age
    { ageLabel: "RECENT",  phaseLabel: "AEROBIC",      cls: "lift-recent" },
    { ageLabel: "+5 YR",   phaseLabel: "ACIDOGENIC",   cls: "lift-acid" },
    { ageLabel: "+10 YR",  phaseLabel: "ACIDOGENIC",   cls: "lift-acid" },
    { ageLabel: "+15 YR",  phaseLabel: "METHANOGENIC", cls: "lift-meth" },
    { ageLabel: "+20 YR",  phaseLabel: "METHANOGENIC", cls: "lift-meth" },
    { ageLabel: "+30 YR",  phaseLabel: "METHANOGENIC", cls: "lift-meth-deep" },
    { ageLabel: "+50 YR",  phaseLabel: "STABILIZED",   cls: "lift-stable" },
    { ageLabel: "LEGACY",  phaseLabel: "STABILIZED",   cls: "lift-legacy" },
  ],

  lowerLayers: [
    { name: "LEACHATE COLLECTION", thicknessM: 0.4, cls: "layer-lcs",      showLabel: true },
    { name: "HDPE GEOMEMBRANE",    thicknessM: 0.15, cls: "layer-hdpe",    showLabel: true },
    { name: "GCL + COMPACTED CLAY", thicknessM: 0.6, cls: "layer-clay",    showLabel: true },
  ],

  gasVentXFractions: [0.18, 0.45, 0.78],
  monitoringWellXOffsetsM: [10, 10],
};

// ZoneSpec / ScenarioEntry are parameters to keep the renderer module-
// independent — the actual types are declared in their respective spec files.
// We accept any-cast shapes to avoid hard cross-module type deps.
type ZoneSpecMap = { [id: string]: any };

interface RenderOpts {
  zoneSpec?: ZoneSpecMap | null;
  scenario?: any | null;  // ScenarioEntry from 01-scenario-spec; when set, zones filter to scenario.active_zones and crystal dots render
}

function renderCrossSectionInto(container: HTMLElement, opts?: RenderOpts): void {
  if (!container) return;
  const cfg = DEFAULT_SCHEMATIC;
  container.innerHTML = buildSchematicSVG(cfg, opts ?? {});
}

function buildSchematicSVG(cfg: SchematicConfig, opts: RenderOpts): string {
  const zoneSpec = opts.zoneSpec ?? null;
  const scenario = opts.scenario ?? null;
  // Effective zone subset for tinting: when a scenario is selected, only
  // its active_zones render; otherwise (OVERVIEW mode) all zones render.
  // Crystal dot placement uses the FULL zoneSpec regardless — see
  // 03-crystal-positions.ts header for the active_zones-vs-history split.
  const activeZoneIds: Set<string> | null = scenario && scenario.active_zones
    ? new Set<string>(scenario.active_zones)
    : null;
  // World extents in meters
  const totalWidthM = cfg.cellTopWidthM + 2 * cfg.nativeFlankWidthM;
  const cellEngineeredM =
    cfg.upperLayers.reduce((s, l) => s + l.thicknessM, 0) +
    cfg.lowerLayers.reduce((s, l) => s + l.thicknessM, 0);
  const liftBandM = cfg.cellDepthM - cellEngineeredM;
  const liftHeightM = liftBandM / cfg.lifts.length;

  // Padding for labels around the diagram (in meters at world scale)
  const padLeftM = 12;
  const padRightM = 22;
  const padTopM = 4;
  const padBottomM = 8;

  // Total drawable extent in meters (translated to viewBox px at 10 px/m)
  const PX_PER_M = 10;
  const worldWidthM = totalWidthM + padLeftM + padRightM;
  const worldHeightM = cfg.aboveGradeM + cfg.cellDepthM + (cfg.waterTableDepthM - cfg.cellDepthM) + padTopM + padBottomM;
  const vbW = worldWidthM * PX_PER_M;
  const vbH = worldHeightM * PX_PER_M;

  // Helpers: convert world (m) to viewBox (px). x is from-left in the world, y is from-top.
  const xWorldOrigin = padLeftM; // x origin (left edge of native flank) in world meters
  const yWorldOrigin = padTopM;  // y origin (top of native ground above cap) in world meters
  const X = (mx: number): number => (xWorldOrigin + mx) * PX_PER_M;
  const Y = (my: number): number => (yWorldOrigin + my) * PX_PER_M;

  // Cell trapezoid vertices (cell rim at y=aboveGradeM, cell floor at y=aboveGradeM+cellDepthM)
  const cellLeftXTopM   = cfg.nativeFlankWidthM;
  const cellRightXTopM  = cfg.nativeFlankWidthM + cfg.cellTopWidthM;
  const inset = (cfg.cellTopWidthM - cfg.cellBottomWidthM) / 2;
  const cellLeftXBotM   = cellLeftXTopM + inset;
  const cellRightXBotM  = cellRightXTopM - inset;
  const cellTopYM       = cfg.aboveGradeM;
  const cellBotYM       = cfg.aboveGradeM + cfg.cellDepthM;

  // Build polygon path for the cell pit (used for clipping fills)
  const cellPolygon = [
    `${X(cellLeftXTopM)},${Y(cellTopYM)}`,
    `${X(cellRightXTopM)},${Y(cellTopYM)}`,
    `${X(cellRightXBotM)},${Y(cellBotYM)}`,
    `${X(cellLeftXBotM)},${Y(cellBotYM)}`,
  ].join(" ");

  // Linearly interpolate cell width at a given depth-into-cell (0..cellDepthM)
  const widthAtDepth = (mDepth: number): { leftXM: number; rightXM: number } => {
    const t = mDepth / cfg.cellDepthM;
    const w = cfg.cellTopWidthM * (1 - t) + cfg.cellBottomWidthM * t;
    const cx = cfg.nativeFlankWidthM + cfg.cellTopWidthM / 2;
    return { leftXM: cx - w / 2, rightXM: cx + w / 2 };
  };

  // SVG body assembly
  const parts: string[] = [];

  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vbW} ${vbH}" preserveAspectRatio="xMidYMid meet" class="cross-section">`);
  parts.push(svgStyle());

  // ── Sky / above-grade background ──
  parts.push(`<rect class="sky" x="0" y="0" width="${vbW}" height="${Y(cfg.aboveGradeM)}" />`);

  // ── Native soil on either side of the cell, from grade down to bottom of view ──
  parts.push(`<rect class="native" x="0" y="${Y(cfg.aboveGradeM)}" width="${vbW}" height="${vbH - Y(cfg.aboveGradeM)}" />`);

  // ── Cell pit (clipped by the trapezoid from here on) ──
  parts.push(`<defs>`);
  parts.push(`  <clipPath id="cellClip"><polygon points="${cellPolygon}" /></clipPath>`);
  parts.push(`</defs>`);
  parts.push(`<g clip-path="url(#cellClip)">`);

  // Inside the cell: stack layers top-down
  let cursorMDepth = 0;

  // Upper engineered layers (cap + gas collection)
  for (const layer of cfg.upperLayers) {
    const yTop = cellTopYM + cursorMDepth;
    const yBot = yTop + layer.thicknessM;
    parts.push(`<rect class="${layer.cls}" x="${X(cellLeftXTopM - 2)}" y="${Y(yTop)}" width="${(cfg.cellTopWidthM + 4) * PX_PER_M}" height="${layer.thicknessM * PX_PER_M}" />`);
    cursorMDepth += layer.thicknessM;
  }

  // Waste lifts (the bulk of the cell)
  const upperLayersM = cfg.upperLayers.reduce((s, l) => s + l.thicknessM, 0);
  const lowerLayersM = cfg.lowerLayers.reduce((s, l) => s + l.thicknessM, 0);
  const liftBandTopM = upperLayersM;
  const liftBandBotM = cfg.cellDepthM - lowerLayersM;
  const liftBandHeightM = liftBandBotM - liftBandTopM;
  const perLiftM = liftBandHeightM / cfg.lifts.length;

  for (let i = 0; i < cfg.lifts.length; i++) {
    const lift = cfg.lifts[i];
    const yTop = cellTopYM + liftBandTopM + i * perLiftM;
    const yBot = yTop + perLiftM;
    parts.push(`<rect class="${lift.cls}" x="${X(cellLeftXTopM - 2)}" y="${Y(yTop)}" width="${(cfg.cellTopWidthM + 4) * PX_PER_M}" height="${perLiftM * PX_PER_M}" />`);
    // Daily cover stripe (thin pale line) above each lift except the first
    if (i > 0) {
      parts.push(`<line class="daily-cover" x1="${X(cellLeftXTopM - 2)}" y1="${Y(yTop)}" x2="${X(cellRightXTopM + 2)}" y2="${Y(yTop)}" />`);
    }
  }

  // Lower engineered layers (leachate collection + composite liner)
  cursorMDepth = liftBandBotM;
  for (const layer of cfg.lowerLayers) {
    const yTop = cellTopYM + cursorMDepth;
    parts.push(`<rect class="${layer.cls}" x="${X(cellLeftXTopM - 2)}" y="${Y(yTop)}" width="${(cfg.cellTopWidthM + 4) * PX_PER_M}" height="${layer.thicknessM * PX_PER_M}" />`);
    cursorMDepth += layer.thicknessM;
  }

  // ── Chemistry-zone overlay ──
  // Composes over the lift bands and engineered layers within the trapezoid.
  // The waste body sits between liftBandTopM and liftBandBotM; depth fractions
  // in the zone spec are normalized against the FULL cellDepthM (engineered
  // layers included), matching the boss's mental model where the trapezoid
  // is the cell, top to floor. Zones are drawn IN ORDER as supplied — earlier
  // zones can be overdrawn by later ones (wall_band intentionally overdraws
  // the depth_band methanogenic_core along the slanted walls).
  if (zoneSpec) {
    parts.push(`<g class="zone-overlay">`);
    for (const id of Object.keys(zoneSpec)) {
      // Per-scenario filtering: skip zones not in active_zones when a scenario
      // is selected. OVERVIEW mode (no scenario) renders all zones.
      if (activeZoneIds && !activeZoneIds.has(id)) continue;
      const z = zoneSpec[id];
      const cls = `zone-${z.color_visual}`;
      const stroke = z.boundary_style === "solid" ? "zone-boundary-solid" : (z.boundary_style === "none" ? "" : "zone-boundary-dashed");
      if (z.position_class === "depth_band") {
        // Polygon: 4 vertices (top-left, top-right, bottom-right, bottom-left)
        // at the requested depth fractions, restricted to the radial extent.
        const yTopM = cellTopYM + z.geometry.depth_frac_top * cfg.cellDepthM;
        const yBotM = cellTopYM + z.geometry.depth_frac_bottom * cfg.cellDepthM;
        const wTop = widthAtDepth(z.geometry.depth_frac_top * cfg.cellDepthM);
        const wBot = widthAtDepth(z.geometry.depth_frac_bottom * cfg.cellDepthM);
        const cxM = cfg.nativeFlankWidthM + cfg.cellTopWidthM / 2;
        const halfTop = (wTop.rightXM - wTop.leftXM) * z.geometry.radial_extent_frac / 2;
        const halfBot = (wBot.rightXM - wBot.leftXM) * z.geometry.radial_extent_frac / 2;
        const poly = [
          `${X(cxM - halfTop)},${Y(yTopM)}`,
          `${X(cxM + halfTop)},${Y(yTopM)}`,
          `${X(cxM + halfBot)},${Y(yBotM)}`,
          `${X(cxM - halfBot)},${Y(yBotM)}`,
        ].join(" ");
        parts.push(`<polygon class="${cls} ${stroke}" points="${poly}" />`);
      } else if (z.position_class === "wall_band") {
        // Two slanted bands, one per wall. At each depth, the band hugs the
        // wall on its outer edge and inset_m to the interior on its inner edge.
        // Approximation: horizontal offset by inset_m (not strictly perpendicular
        // to the slanted wall — close enough for a 12 m / 30 m slope).
        const inset = z.geometry.inset_m;
        // Left wall: from (cellLeftXTopM, cellTopYM) to (cellLeftXBotM, cellBotYM)
        const leftPoly = [
          `${X(cellLeftXTopM)},${Y(cellTopYM)}`,
          `${X(cellLeftXTopM + inset)},${Y(cellTopYM)}`,
          `${X(cellLeftXBotM + inset)},${Y(cellBotYM)}`,
          `${X(cellLeftXBotM)},${Y(cellBotYM)}`,
        ].join(" ");
        const rightPoly = [
          `${X(cellRightXTopM - inset)},${Y(cellTopYM)}`,
          `${X(cellRightXTopM)},${Y(cellTopYM)}`,
          `${X(cellRightXBotM)},${Y(cellBotYM)}`,
          `${X(cellRightXBotM - inset)},${Y(cellBotYM)}`,
        ].join(" ");
        parts.push(`<polygon class="${cls} ${stroke}" points="${leftPoly}" />`);
        parts.push(`<polygon class="${cls} ${stroke}" points="${rightPoly}" />`);
      } else if (z.position_class === "bottom_strip") {
        // Re-tints the existing engineered LCS layer with the zone's chemistry.
        // The LCS sits at cellBotYM - lowerLayersM, thicknessM = lowerLayers[0].thicknessM.
        const yTopM = cellBotYM - cfg.lowerLayers.reduce((s, l) => s + l.thicknessM, 0);
        const tM = cfg.lowerLayers[0].thicknessM;
        const wTop = widthAtDepth(yTopM - cellTopYM);
        const wBot = widthAtDepth(yTopM - cellTopYM + tM);
        const poly = [
          `${X(wTop.leftXM)},${Y(yTopM)}`,
          `${X(wTop.rightXM)},${Y(yTopM)}`,
          `${X(wBot.rightXM)},${Y(yTopM + tM)}`,
          `${X(wBot.leftXM)},${Y(yTopM + tM)}`,
        ].join(" ");
        parts.push(`<polygon class="${cls} ${stroke}" points="${poly}" />`);
      }
    }

    // Zone labels — second pass, drawn after polygons so they sit on top.
    // Placement strategy: depth_band → centered horizontally on the zone, just
    // below the zone's top edge; wall_band → left wall flank, at the band's
    // mid-depth, sized to fit the narrow band; bottom_strip → skipped (relies
    // on the existing right-side LCS layer-label).
    for (const id of Object.keys(zoneSpec)) {
      if (activeZoneIds && !activeZoneIds.has(id)) continue;
      const z = zoneSpec[id];
      const cls = `zone-label zone-label-${z.color_visual}`;
      if (z.position_class === "depth_band") {
        const yTopM = cellTopYM + z.geometry.depth_frac_top * cfg.cellDepthM;
        const cxM = cfg.nativeFlankWidthM + cfg.cellTopWidthM / 2;
        // Label sits just below the zone's top edge, centered horizontally.
        parts.push(`<text class="${cls}" x="${X(cxM)}" y="${Y(yTopM) + 12}" text-anchor="middle">${z.label}</text>`);
      } else if (z.position_class === "wall_band") {
        // Left flank only — right side is reserved for the layer-fan labels.
        // The flank is only inset_m (~3m → 30 px) wide, narrower than the
        // label text. text-anchor="start" with x at the flank's INNER edge
        // (wall + inset + small pad) lets the label extend rightward into
        // the methanogenic_core for readability while still reading as the
        // flank's label because its starting edge sits at the flank boundary.
        const inset = z.geometry.inset_m;
        const yMidM = cellTopYM + cfg.cellDepthM * 0.5;
        const wallXMidM = cellLeftXTopM + (cellLeftXBotM - cellLeftXTopM) * 0.5; // x at half-depth
        const labelXM = wallXMidM + inset + 0.5;
        parts.push(`<text class="${cls}" x="${X(labelXM)}" y="${Y(yMidM)}" text-anchor="start">${z.label}</text>`);
      }
      // bottom_strip: skipped intentionally (LCS layer-label on the right covers it)
    }
    parts.push(`</g>`); // end zone-overlay group
  }

  // ── Crystal-dot overlay ──
  // Placeholder for the future per-cell crystal-growth output. Generates
  // deterministic dots from scenario.expected_species × zones.json
  // expected_mineral_clusters (see 03-crystal-positions.ts). Dots use the
  // FULL zoneSpec for placement (not active_zones) — relict crystals
  // remain visible at their historical zones even after that zone has
  // waned at the scenario's snapshot.
  if (scenario && zoneSpec && typeof generateCrystalDots === "function") {
    const upperLayersMTotal = cfg.upperLayers.reduce((s, l) => s + l.thicknessM, 0);
    const lowerLayersMTotal = cfg.lowerLayers.reduce((s, l) => s + l.thicknessM, 0);
    const geom = {
      cellTopWidthM: cfg.cellTopWidthM,
      cellBottomWidthM: cfg.cellBottomWidthM,
      cellDepthM: cfg.cellDepthM,
      nativeFlankWidthM: cfg.nativeFlankWidthM,
      upperLayersM: upperLayersMTotal,
      lowerLayersM: lowerLayersMTotal,
      cellTopYM: cellTopYM,
      lcsThicknessM: cfg.lowerLayers[0].thicknessM,
    };
    const dots = generateCrystalDots(scenario, zoneSpec, null, geom);
    parts.push(`<g class="crystal-dots">`);
    for (const d of dots) {
      const fill = mineralDotColor(d.mineral_id);
      // Radius scales lightly with evidence_role: directly_observed dots
      // sit a hair larger so the catalog's strongest pedigree reads first.
      const r = d.evidence_role === "directly_observed" ? 2.6
              : d.evidence_role === "implied_by_substrate_chemistry" ? 2.0
              : 1.6;
      // data-* attributes drive the examination panel's click delegation
      // (boot harness reads them from the click target). cursor: pointer is
      // applied via CSS so dots indicate they're interactive.
      parts.push(`<circle class="dot dot-${d.mineral_id} dot-${d.evidence_role}" cx="${X(d.x_m)}" cy="${Y(d.y_m)}" r="${r}" fill="${fill}" data-mineral-id="${d.mineral_id}" data-zone-id="${d.zone_id}" data-evidence-role="${d.evidence_role}" />`);
    }
    parts.push(`</g>`); // end crystal-dots group
  }

  parts.push(`</g>`); // end cellClip group

  // Cell pit outline (the engineered boundary)
  parts.push(`<polygon class="pit-outline" points="${cellPolygon}" />`);

  // ── Side annotations (NOT clipped to the pit) ──

  // Gas extraction wells (vertical from cap surface down ~80% of cell)
  for (const xf of cfg.gasVentXFractions) {
    const xWell = cellLeftXTopM + xf * cfg.cellTopWidthM;
    const yTopWell = cellTopYM - 1; // sticks up above cap
    const yBotWell = cellTopYM + cfg.cellDepthM * 0.8;
    parts.push(`<line class="gas-well" x1="${X(xWell)}" y1="${Y(yTopWell)}" x2="${X(xWell)}" y2="${Y(yBotWell)}" />`);
    // Wellhead box at top
    parts.push(`<rect class="well-head" x="${X(xWell) - 6}" y="${Y(yTopWell) - 6}" width="12" height="6" />`);
    parts.push(`<text class="annot-label" x="${X(xWell)}" y="${Y(yTopWell) - 9}" text-anchor="middle">GAS</text>`);
  }

  // Monitoring wells (in native flank, both sides)
  const mw1xM = cellLeftXTopM - cfg.monitoringWellXOffsetsM[0];
  const mw2xM = cellRightXTopM + cfg.monitoringWellXOffsetsM[1];
  for (const mxM of [mw1xM, mw2xM]) {
    parts.push(`<line class="monitoring-well" x1="${X(mxM)}" y1="${Y(cfg.aboveGradeM - 1)}" x2="${X(mxM)}" y2="${Y(cfg.waterTableDepthM)}" />`);
    parts.push(`<circle class="well-screen" cx="${X(mxM)}" cy="${Y(cfg.waterTableDepthM - 0.5)}" r="3" />`);
    parts.push(`<rect class="well-head" x="${X(mxM) - 6}" y="${Y(cfg.aboveGradeM - 2)}" width="12" height="6" />`);
    parts.push(`<text class="annot-label" x="${X(mxM)}" y="${Y(cfg.aboveGradeM - 4)}" text-anchor="middle">MW</text>`);
  }

  // Leachate sump (small box at bottom-center of cell, just above lower layers)
  const sumpCxM = cfg.nativeFlankWidthM + cfg.cellTopWidthM / 2;
  const sumpCyM = cellBotYM - lowerLayersM - 0.3;
  parts.push(`<rect class="sump" x="${X(sumpCxM) - 8}" y="${Y(sumpCyM) - 5}" width="16" height="6" />`);
  parts.push(`<line class="sump-pipe" x1="${X(sumpCxM)}" y1="${Y(sumpCyM)}" x2="${X(sumpCxM)}" y2="${Y(cfg.aboveGradeM - 1)}" />`);
  parts.push(`<text class="annot-label" x="${X(sumpCxM)}" y="${Y(cfg.aboveGradeM - 4)}" text-anchor="middle">LEACHATE PUMP</text>`);

  // Perforated leachate collection pipe (horizontal dashed line through LCS layer)
  const lcsYM = cellBotYM - lowerLayersM + cfg.lowerLayers[0].thicknessM / 2;
  parts.push(`<line class="lcs-pipe" x1="${X(cellLeftXBotM + 2)}" y1="${Y(lcsYM)}" x2="${X(cellRightXBotM - 2)}" y2="${Y(lcsYM)}" />`);

  // Water table (wavy-ish line, here represented as a dashed horizontal)
  parts.push(`<line class="water-table" x1="0" y1="${Y(cfg.waterTableDepthM)}" x2="${vbW}" y2="${Y(cfg.waterTableDepthM)}" />`);
  parts.push(`<text class="wt-label" x="${X(0.5)}" y="${Y(cfg.waterTableDepthM - 0.4)}">WATER TABLE</text>`);

  // ── Depth scale on the left ──
  for (let d = 0; d <= cfg.cellDepthM; d += 5) {
    const tickXM = padLeftM - 9 + 0; // sit just outside the world origin
    const tickYM = cfg.aboveGradeM + d;
    parts.push(`<line class="scale-tick" x1="${X(-padLeftM + 2)}" y1="${Y(tickYM)}" x2="${X(-padLeftM + 5)}" y2="${Y(tickYM)}" />`);
    parts.push(`<text class="scale-label" x="${X(-padLeftM + 0)}" y="${Y(tickYM) + 3}">${d}m</text>`);
  }

  // ── Layer labels on the right with bent-leader lines ──
  // Cap and base-liner layers are 0.4–0.6 m thick (4–6 px in viewBox) — narrower
  // than the label's own line height (~12 px). Anchoring each label at its layer
  // mid stacks them on top of each other. Mining-report drafting practice handles
  // this with a fan: labels spread vertically with constant line-height, leaders
  // bend from layer-mid to label-mid. Group is recentered on the natural centroid
  // so the fan reads as a balanced annotation rather than a downward spill.
  const labelXM = cellRightXTopM + 1;
  const stubXM = labelXM + 0.5;
  const labelStartXM = labelXM + 2;
  const LABEL_LINE_PX = 12;

  type LabelItem = { yMidM: number; yLabelPx: number; name: string; sublabel?: string };

  const fanLabels = (items: LabelItem[]): LabelItem[] => {
    if (items.length === 0) return items;
    // Forward pass: enforce min vertical separation (push down on collision).
    for (let i = 1; i < items.length; i++) {
      const minY = items[i - 1].yLabelPx + LABEL_LINE_PX;
      if (items[i].yLabelPx < minY) items[i].yLabelPx = minY;
    }
    // Recenter: if the forward pass shifted the group's centroid downward,
    // shift the whole fan back up by that drift so it brackets the natural
    // centroid (cleaner read than a one-sided downward cascade).
    const naturalCentroid = items.reduce((s, it) => s + Y(it.yMidM), 0) / items.length;
    const newCentroid = items.reduce((s, it) => s + it.yLabelPx, 0) / items.length;
    const shift = newCentroid - naturalCentroid;
    if (shift > 0) for (const it of items) it.yLabelPx -= shift;
    return items;
  };

  const renderFan = (items: LabelItem[]): void => {
    for (const it of items) {
      const yMidPx = Y(it.yMidM);
      // 4-segment bent leader: rim → stub → vertical bend → label-base
      parts.push(`<polyline class="leader" points="${X(cellRightXTopM)},${yMidPx} ${X(stubXM)},${yMidPx} ${X(stubXM)},${it.yLabelPx} ${X(labelStartXM)},${it.yLabelPx}" />`);
      parts.push(`<text class="layer-label" x="${X(labelStartXM + 0.5)}" y="${it.yLabelPx + 3}">${it.name}</text>`);
      if (it.sublabel) {
        parts.push(`<text class="layer-sublabel" x="${X(labelStartXM + 0.5)}" y="${it.yLabelPx + 14}">${it.sublabel}</text>`);
      }
    }
  };

  // Upper-layer fan
  const upperFan: LabelItem[] = [];
  {
    let c = 0;
    for (const layer of cfg.upperLayers) {
      if (layer.showLabel) {
        const yMidM = cellTopYM + c + layer.thicknessM / 2;
        upperFan.push({ yMidM, yLabelPx: Y(yMidM), name: layer.name });
      }
      c += layer.thicknessM;
    }
  }
  renderFan(fanLabels(upperFan));

  // Lift band label (single, never collides with anything)
  {
    const yMidM = cellTopYM + liftBandTopM + liftBandHeightM / 2;
    renderFan([{ yMidM, yLabelPx: Y(yMidM), name: "WASTE BODY", sublabel: `${cfg.lifts.length} LIFTS, ${perLiftM.toFixed(1)} M EACH` }]);
  }

  // Lower-layer fan
  const lowerFan: LabelItem[] = [];
  {
    let c = liftBandBotM;
    for (const layer of cfg.lowerLayers) {
      if (layer.showLabel) {
        const yMidM = cellTopYM + c + layer.thicknessM / 2;
        lowerFan.push({ yMidM, yLabelPx: Y(yMidM), name: layer.name });
      }
      c += layer.thicknessM;
    }
  }
  renderFan(fanLabels(lowerFan));

  // ── Title block in upper-left ──
  parts.push(`<g class="title-block" transform="translate(${X(-padLeftM + 2)}, ${Y(-padTopM + 1)})">`);
  parts.push(`  <text class="title">WASTELAND CRYSTALS</text>`);
  parts.push(`  <text class="subtitle" y="14">SECURE LANDFILL CELL — TYPICAL CROSS-SECTION</text>`);
  parts.push(`  <text class="subtitle" y="26">CELL: ${cfg.cellTopWidthM}M × ${cfg.cellDepthM}M / SLOPE 4H:1V / SCHEMATIC</text>`);
  parts.push(`</g>`);

  parts.push(`</svg>`);
  return parts.join("\n");
}

function svgStyle(): string {
  // Note on opacity strategy: when the host container carries a background
  // image (the cyberpunk-blueprint reference), grey rect fills are toned down
  // so the underlying blueprint terrain reads through. Amber-gold lines and
  // labels stay at full opacity — the engineer-overlay must remain crisp.
  return `<style>
    .cross-section { background: transparent; width: 100%; height: auto; display: block; }
    .sky    { fill: #0a0e15; fill-opacity: 0.18; }
    .native { fill: #1f1810; fill-opacity: 0.45; }

    .pit-outline { fill: none; stroke: #d4af37; stroke-width: 1.2; }

    /* Cap layers — engineered, kept readable */
    .layer-veg     { fill: #3a4225; fill-opacity: 0.85; }
    .layer-barrier { fill: #1f1f1f; fill-opacity: 0.85; }
    .layer-gas     { fill: #4a3e30; fill-opacity: 0.85; }

    /* Waste lifts — graduated greys top→bottom, semi-transparent so the
       blueprint hints through but the lift stack reads as a coherent stratum */
    .lift-recent   { fill: #4a4a48; fill-opacity: 0.6; }
    .lift-acid     { fill: #3d3a32; fill-opacity: 0.6; }
    .lift-meth     { fill: #2e2c25; fill-opacity: 0.6; }
    .lift-meth-deep{ fill: #25241e; fill-opacity: 0.6; }
    .lift-stable   { fill: #1f1d18; fill-opacity: 0.6; }
    .lift-legacy   { fill: #16140f; fill-opacity: 0.6; }

    .daily-cover { stroke: #6a5a3a; stroke-width: 0.6; opacity: 0.7; }

    /* Lower engineered layers — leachate collection + composite liner */
    .layer-lcs   { fill: #2a241e; fill-opacity: 0.85; }
    .layer-hdpe  { fill: #0a0a0a; fill-opacity: 0.9; }
    .layer-clay  { fill: #2a201a; fill-opacity: 0.85; }

    /* Annotations: gas wells, monitoring wells, sump, pipes */
    .gas-well, .monitoring-well, .sump-pipe { stroke: #d4af37; stroke-width: 1.3; fill: none; }
    .lcs-pipe { stroke: #d4af37; stroke-width: 0.9; stroke-dasharray: 4 3; fill: none; }
    .well-head, .sump { fill: #d4af37; stroke: none; }
    .well-screen { fill: none; stroke: #d4af37; stroke-width: 1; stroke-dasharray: 2 2; }

    .water-table { stroke: #2c5868; stroke-width: 1.4; stroke-dasharray: 8 4; opacity: 0.85; }
    .wt-label    { fill: #2c5868; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; letter-spacing: 0.06em; }

    /* Depth scale */
    .scale-tick  { stroke: #5c4a1a; stroke-width: 1; }
    .scale-label { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; }

    /* Layer leader labels */
    .leader        { stroke: #8a6f24; stroke-width: 0.8; fill: none; }
    .layer-label   { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 10px; letter-spacing: 0.08em; }
    .layer-sublabel{ fill: #b48a2c; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 8px; letter-spacing: 0.05em; }

    /* Annotation labels above wells/sump */
    .annot-label { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 8px; letter-spacing: 0.08em; }

    /* Title block */
    .title    { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 14px; letter-spacing: 0.15em; font-weight: normal; }
    .subtitle { fill: #b48a2c; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; letter-spacing: 0.08em; }

    /* ── Chemistry-zone overlay palette ──
       Tints sit at low opacity over the lift bands so the blueprint backdrop
       and the lift-stack greyscale both read through. Boundary strokes are
       higher-opacity so the zone borders stay legible.
       Color logic: warm rust = oxidizing top, sulfur yellow = acidic mid,
       slate blue = methanogenic core, drainage teal = wall flank,
       deep purple = stable basal, biofilm green = LCS scaling. */
    .zone-rust_oxidizing_warm  { fill: #b25028; fill-opacity: 0.18; }
    .zone-sulfur_yellow_acid   { fill: #b49628; fill-opacity: 0.16; }
    .zone-slate_blue_reducing  { fill: #3c5a82; fill-opacity: 0.22; }
    .zone-drainage_pale_teal   { fill: #408282; fill-opacity: 0.20; }
    .zone-deep_purple_stable   { fill: #643c82; fill-opacity: 0.22; }
    /* Biofilm green sits at higher opacity because it overlays the existing
       engineered layer-lcs (fill-opacity 0.85), and at 0.30 the green tint
       washed out under the brown LCS fill. 0.50 lands the LCS as a clearly
       biofilm-tinted strip distinct from the surrounding geomembrane / clay. */
    .zone-biofilm_pale_green   { fill: #508c64; fill-opacity: 0.50; }

    .zone-boundary-dashed { stroke: #d4af37; stroke-width: 0.6; stroke-dasharray: 3 2; stroke-opacity: 0.55; }
    .zone-boundary-solid  { stroke: #d4af37; stroke-width: 0.6; stroke-opacity: 0.65; }

    /* Zone labels — small, in-zone, color-tinted to match the zone palette
       so each label reads as belonging to its tint. */
    .zone-label { font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 8px; letter-spacing: 0.10em; }
    .zone-label-rust_oxidizing_warm { fill: #d8804a; }
    .zone-label-sulfur_yellow_acid  { fill: #e0c050; }
    .zone-label-slate_blue_reducing { fill: #80a8d8; }
    .zone-label-drainage_pale_teal  { fill: #6cb0b0; }
    .zone-label-deep_purple_stable  { fill: #b078d8; }
    .zone-label-biofilm_pale_green  { fill: #80c898; }

    /* Crystal-dot overlay — placeholder for the future per-cell crystal-
       growth model output. Stroke is a thin dark outline so each dot pops
       against whatever zone tint or lift band sits behind it; fill is set
       inline per-dot from the mineral's color. directly_observed dots get
       a subtle white halo to signal the strongest evidence pedigree;
       implied / predicted are unhaloed so the tier difference reads at
       a glance. */
    .dot { stroke: #0a0a0a; stroke-width: 0.4; stroke-opacity: 0.9; cursor: pointer; }
    .dot-directly_observed              { stroke: #ffffff; stroke-width: 0.45; stroke-opacity: 0.55; }
    .dot-implied_by_substrate_chemistry { /* default outline only */ }
    .dot-predicted_from_program_synthesis { stroke-opacity: 0.5; }
    /* Selected dot — a brighter halo so the examined crystal reads at a
       glance against the cell's other paragenesis. */
    .dot.selected { stroke: #ffd76a; stroke-width: 1.2; stroke-opacity: 1.0; }
  </style>`;
}
