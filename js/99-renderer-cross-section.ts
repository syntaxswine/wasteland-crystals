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

function renderCrossSectionInto(container: HTMLElement): void {
  if (!container) return;
  const cfg = DEFAULT_SCHEMATIC;
  container.innerHTML = buildSchematicSVG(cfg);
}

function buildSchematicSVG(cfg: SchematicConfig): string {
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

  // ── Layer labels on the right with leader lines ──
  let cursor2 = 0;
  for (const layer of cfg.upperLayers) {
    if (layer.showLabel) {
      const yMid = cellTopYM + cursor2 + layer.thicknessM / 2;
      const labelXM = cellRightXTopM + 1;
      parts.push(`<line class="leader" x1="${X(labelXM)}" y1="${Y(yMid)}" x2="${X(labelXM + 2)}" y2="${Y(yMid)}" />`);
      parts.push(`<text class="layer-label" x="${X(labelXM + 2.5)}" y="${Y(yMid) + 3}">${layer.name}</text>`);
    }
    cursor2 += layer.thicknessM;
  }
  // Lift band label
  {
    const yMid = cellTopYM + liftBandTopM + liftBandHeightM / 2;
    const labelXM = cellRightXTopM + 1;
    parts.push(`<line class="leader" x1="${X(labelXM)}" y1="${Y(yMid)}" x2="${X(labelXM + 2)}" y2="${Y(yMid)}" />`);
    parts.push(`<text class="layer-label" x="${X(labelXM + 2.5)}" y="${Y(yMid) + 3}">WASTE BODY</text>`);
    parts.push(`<text class="layer-sublabel" x="${X(labelXM + 2.5)}" y="${Y(yMid) + 14}">${cfg.lifts.length} LIFTS, ${perLiftM.toFixed(1)} M EACH</text>`);
  }
  // Lower layers
  cursor2 = liftBandBotM;
  for (const layer of cfg.lowerLayers) {
    if (layer.showLabel) {
      const yMid = cellTopYM + cursor2 + layer.thicknessM / 2;
      const labelXM = cellRightXTopM + 1;
      parts.push(`<line class="leader" x1="${X(labelXM)}" y1="${Y(yMid)}" x2="${X(labelXM + 2)}" y2="${Y(yMid)}" />`);
      parts.push(`<text class="layer-label" x="${X(labelXM + 2.5)}" y="${Y(yMid) + 3}">${layer.name}</text>`);
    }
    cursor2 += layer.thicknessM;
  }

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
  return `<style>
    .cross-section { background: #050505; width: 100%; height: auto; display: block; }
    .sky    { fill: #0a0e15; }
    .native { fill: #1f1810; }

    .pit-outline { fill: none; stroke: #d4af37; stroke-width: 1.2; }

    /* Cap layers */
    .layer-veg     { fill: #3a4225; }
    .layer-barrier { fill: #1f1f1f; }
    .layer-gas     { fill: #4a3e30; }

    /* Waste lifts — graduated greys, top (recent) lighter, bottom (legacy) darker */
    .lift-recent   { fill: #4a4a48; }
    .lift-acid     { fill: #3d3a32; }
    .lift-meth     { fill: #2e2c25; }
    .lift-meth-deep{ fill: #25241e; }
    .lift-stable   { fill: #1f1d18; }
    .lift-legacy   { fill: #16140f; }

    .daily-cover { stroke: #6a5a3a; stroke-width: 0.6; opacity: 0.55; }

    /* Lower engineered layers */
    .layer-lcs   { fill: #2a241e; }
    .layer-hdpe  { fill: #0a0a0a; }
    .layer-clay  { fill: #2a201a; }

    /* Annotations: gas wells, monitoring wells, sump, pipes */
    .gas-well, .monitoring-well, .sump-pipe { stroke: #d4af37; stroke-width: 1.3; fill: none; }
    .lcs-pipe { stroke: #d4af37; stroke-width: 0.9; stroke-dasharray: 4 3; fill: none; }
    .well-head, .sump { fill: #d4af37; stroke: none; }
    .well-screen { fill: none; stroke: #d4af37; stroke-width: 1; stroke-dasharray: 2 2; }

    .water-table { stroke: #2c5868; stroke-width: 1.4; stroke-dasharray: 8 4; }
    .wt-label    { fill: #2c5868; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; letter-spacing: 0.06em; }

    /* Depth scale */
    .scale-tick  { stroke: #5c4a1a; stroke-width: 1; }
    .scale-label { fill: #b48a2c; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; }

    /* Layer leader labels */
    .leader        { stroke: #5c4a1a; stroke-width: 0.8; }
    .layer-label   { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 10px; letter-spacing: 0.08em; }
    .layer-sublabel{ fill: #8a6f24; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 8px; letter-spacing: 0.05em; }

    /* Annotation labels above wells/sump */
    .annot-label { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 8px; letter-spacing: 0.08em; }

    /* Title block */
    .title    { fill: #d4af37; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 14px; letter-spacing: 0.15em; font-weight: normal; }
    .subtitle { fill: #8a6f24; font-family: ui-monospace, "Cascadia Mono", monospace; font-size: 9px; letter-spacing: 0.08em; }
  </style>`;
}
