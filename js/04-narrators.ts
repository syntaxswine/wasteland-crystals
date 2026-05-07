// ============================================================
// js/04-narrators.ts — per-mineral paragenesis narrators
// ============================================================
//
// Per the proposal §"Per-mineral narrators": one function per mineral that
// describes how a specific crystal got there. The boss's framing 2026-05-07:
// 'when examining the crystal you get the paragenesis. something like
// "acids from x broke down the copper from x which redeposited and formed
// malachite"'. That's a causal chain: source acid → source metal →
// mobilization → transport → reprecipitation.
//
// Boss follow-up 2026-05-07: 'i think the units of precursor chemicals will
// have to have origins attached to them to get an accurate paragenesis.'
// This file now composes paragenesis from the data spine — for each
// precursor named in mineral.decay_precursor, look up its source_substrate
// in PRECURSOR_SPEC, check whether that substrate is in the active
// scenario's substrate_inventory, and only name confirmed origins. Implied-
// typical-MSW substrates get hedged language ("likely") so prose stays
// honest about the evidence pedigree.
//
// Register: the surveyor's voice. Third-person, no game framing, no
// second-person addresses. Dense observational prose; commit-messages-as-
// field-notes style applied to mineralogy. The future-miner is reading a
// quarterly report, not a tutorial.
//
// Composition: per-mineral narrators are case branches; minerals not yet
// authored fall through to a templated narrative built from their catalog
// entry. The fallback acknowledges itself as not-yet-fully-authored so
// future passes can target the gaps.

interface AvailablePrecursor {
  precursor: any;       // PrecursorEntry from 05-precursor-spec
  basis: "documented" | "implied_typical_msw" | "unknown";
  source_substrate: string;
}

interface CrystalNarrative {
  mineralId: string;
  mineralName: string;
  formula: string;
  habit: string;
  zoneLabel: string;
  evidenceRole: string;
  evidenceNote?: string;
  paragenesis: string;
  citations: string[];
  authored: boolean;
  available_precursors: AvailablePrecursor[];   // precursors whose source_substrate IS in the cell's inventory
  absent_precursors: string[];                   // precursor IDs named in mineral.decay_precursor whose source_substrate is NOT in inventory (so the narrative omitted them)
  host_item_label: string | null;                // human-readable host item line ("lead-acid battery #3 at tile (col 22, row 18)") or null when the dot fell back to zone-uniform placement
  host_item_class: string | null;
  host_item_id: string | null;
}

function _displayMineralName(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1).replace(/_/g, " ");
}

function _displayHabit(habit: string): string {
  return habit.replace(/_/g, " ");
}

function _scenarioCellName(scenario: any): string {
  return scenario && scenario.location ? scenario.location.locality : "the cell";
}

// ── Precursor composition ──
// Builds the (mineral.decay_precursor) ∩ (PRECURSOR_SPEC) ∩
// (scenario.substrate_inventory) join. Returns lists of available + absent.

function _composeAvailablePrecursors(
  mineral: any,
  scenario: any,
  precursorSpec: { [id: string]: any } | null,
): { available: AvailablePrecursor[]; absent: string[] } {
  const available: AvailablePrecursor[] = [];
  const absent: string[] = [];
  if (!mineral || !scenario || !precursorSpec) return { available, absent };

  const inventoryByToken: { [token: string]: any } = {};
  for (const item of (scenario.substrate_inventory ?? [])) {
    inventoryByToken[item.token] = item;
  }

  for (const precursorId of (mineral.decay_precursor ?? [])) {
    const precursor = precursorSpec[precursorId];
    if (!precursor) {
      // Precursor token referenced in minerals.json but not in precursors.json.
      // Treat as absent so future precursors.json passes can fill the gap.
      absent.push(precursorId);
      continue;
    }
    const inv = inventoryByToken[precursor.source_substrate];
    if (!inv) {
      absent.push(precursorId);
      continue;
    }
    const basis = (inv.evidence_basis as ("documented" | "implied_typical_msw" | undefined)) ?? "unknown";
    available.push({ precursor, basis, source_substrate: precursor.source_substrate });
  }
  return { available, absent };
}

// ── Narrator helpers ──

function _findPrecursor(id: string, available: AvailablePrecursor[]): AvailablePrecursor | null {
  return available.find((a) => a.precursor.id === id) ?? null;
}

// Returns the precursor's narrator phrase, hedged with "likely" when the
// source substrate is implied_typical_msw rather than documented. Returns
// null when the precursor is not available.
function _phrase(id: string, available: AvailablePrecursor[]): string | null {
  const p = _findPrecursor(id, available);
  if (!p) return null;
  return p.basis === "implied_typical_msw" ? `likely ${p.precursor.narrator_phrase_short}` : p.precursor.narrator_phrase_short;
}

// Same as _phrase but joins multiple alternatives with " plus " — useful
// when several precursors deliver the same species (e.g., SO4 from drywall
// + battery acid).
function _phraseAny(ids: string[], available: AvailablePrecursor[]): string | null {
  const found = ids.map((id) => _phrase(id, available)).filter((s): s is string => !!s);
  if (found.length === 0) return null;
  if (found.length === 1) return found[0];
  return found.slice(0, -1).join(", ") + " plus " + found[found.length - 1];
}

function _capitalize(s: string): string {
  return s.length === 0 ? s : s.charAt(0).toUpperCase() + s.slice(1);
}

// ── Per-mineral narrators ──
// Each takes (scenario, zoneId, available) where `available` is the
// pre-computed list of precursors whose source substrate IS in the cell's
// inventory. Narrators name only confirmed origins; missing precursors
// produce hedged or shortened prose rather than fabricated claims.

function _narratePyromorphite(scenario: any, zoneId: string, available: AvailablePrecursor[]): string {
  const cell = _scenarioCellName(scenario);
  const isSeed = zoneId === "methanogenic_core" && scenario.dominant_phase !== "stable";

  const acid = _phraseAny(["battery_h2so4", "drywall_sulfate"], available);
  const phosphate = _phrase("food_phosphate", available);
  const chloride = _phrase("pvc_hcl", available);
  const calcium = _phraseAny(["concrete_calcite", "cement_calcite"], available);

  const acidClause = acid
    ? `${acid} dissolved the lead plates of the lead-acid relics`
    : `the cell's acidic-phase leachate dissolved the lead plates of the lead-acid relics`;
  const convergenceItems: string[] = [];
  if (phosphate) convergenceItems.push(phosphate);
  if (chloride) convergenceItems.push(chloride);
  if (calcium) convergenceItems.push(calcium);
  const convergence = convergenceItems.length >= 2
    ? convergenceItems.slice(0, -1).join(", ") + ", and " + convergenceItems[convergenceItems.length - 1]
    : (convergenceItems[0] ?? "the late-phase Pb-PO4-Cl-Ca pool");

  const closing = isSeed
    ? `At ${cell}'s 25-year horizon the convergence is in progress — Pb²⁺ is mobile, the supply lines are open, but the prisms have not yet reached the millimeter scale Mont-Saint-Guibert's stable phase produced. Seed-stage paragenesis.`
    : `At ${cell}'s basal stable horizon, ${convergence} converged on the lingering Pb²⁺. The four-way Pb-PO₄-Cl-Ca composition crystallized as the olive-green hexagonal prisms Garcia Lopez identified in the <4.5 mm fines fraction. Fortuitous chemistry, fully assembled by accident.`;

  return `${acidClause.charAt(0).toUpperCase() + acidClause.slice(1)} into the acidogenic-phase pore water. The methanogenic core then ran for two decades — sulfate-reducers consumed residual SO₄, kept dissolved Pb mobile, and let it migrate downward through the cell's wall-drainage path. ${closing}`;
}

function _narrateSphalerite(scenario: any, _zoneId: string, available: AvailablePrecursor[]): string {
  const cell = _scenarioCellName(scenario);
  const zincSource = _phrase("galvanized_zinc_dissolution", available) ?? "Zn²⁺ from corroding galvanized substrate";
  const sulfideSource = _phraseAny(
    ["drywall_sulfate_to_biogenic_h2s", "battery_sulfate_to_biogenic_h2s"],
    available,
  ) ?? "biogenic H₂S from sulfate-reducer activity on residual SO4";

  return `Galvanized steel — fence wire, ductwork, appliance shells — corroded under early acidic leachate, dropping ${zincSource} into solution. Drywall- and battery-derived sulfate, processed by anaerobic sulfate-reducers in the methanogenic phase, became ${sulfideSource}. Where dissolved Zn met dissolved sulfide the reaction was nearly diffusion-limited: ZnS precipitated as resinous-luster tetrahedra coating the surviving Fe-Zn alloy fragments. Garcia Lopez's SEM-EDS catalog from Mont-Saint-Guibert reports the same texture in its <4.5 mm fines, honey-amber to dark brown depending on residual iron content; ${cell} runs the same chemistry on the same substrate.`;
}

function _narrateAnglesite(scenario: any, _zoneId: string, available: AvailablePrecursor[]): string {
  const cell = _scenarioCellName(scenario);
  const acid = _phrase("battery_h2so4", available);
  const additionalSO4 = _phrase("drywall_sulfate", available);
  const acidPart = acid && additionalSO4
    ? `${acid}, supplemented by ${additionalSO4},`
    : (acid ?? additionalSO4 ?? "the cell's acidic-phase sulfate-bearing leachate");

  return `Lead-acid battery cases, breached by their own sulfuric-acid electrolyte after the polypropylene casings split, exposed Pb plates to the cell's acidogenic-phase leachate. ${acidPart} drove the chemistry: where Pb²⁺ met SO4²⁻ at low pH, anglesite crystallized as tabular white crystals directly on the corroded plate surfaces. Garcia Lopez does not name anglesite specifically in the Mont-Saint-Guibert characterization, but the metallic-Pb relics they observed under SEM imply this phase was a necessary stage in the Pb's pre-pyromorphite history at ${cell}. Chemistry trapped in transit.`;
}

function _narrateCalcite(_scenario: any, zoneId: string, available: AvailablePrecursor[]): string {
  const calciumSource = _phraseAny(["concrete_calcite", "cement_calcite"], available);
  const bicarbonateSource = _phraseAny(["organic_co2", "biogenic_carbonate"], available);

  const sourcesClause = _capitalize(calciumSource && bicarbonateSource
    ? `${calciumSource} dissolves slowly and meets ${bicarbonateSource}`
    : (calciumSource
        ? `${calciumSource} dissolves slowly into the cell's mature alkaline pore water`
        : (bicarbonateSource
            ? `${bicarbonateSource} accumulates in the cell's alkalinizing leachate`
            : "concrete and drywall fragments dissolve under the cell's mature alkaline conditions")));

  const venue = zoneId === "lcs_biofilm"
    ? "the leachate-collection pipework, where bicarbonate-supersaturated brine evaporates against the air gap"
    : "stable-basal pore space, where it cements earlier paragenetic phases";

  return `${sourcesClause}. Once acidogenic-phase organic acids are exhausted by methanogenesis, residual VFAs convert to bicarbonate and the leachate alkalinizes. Calcite precipitates wherever Ca²⁺ meets HCO₃⁻ at near-neutral-to-alkaline pH — most visibly on ${venue}. The cell ends its chemistry as it began geologically: in carbonate.`;
}

function _narrateVivianite(_scenario: any, zoneId: string, available: AvailablePrecursor[]): string {
  const ironSource = _phrase("rebar_iron", available);
  const phosphateSource = _phraseAny(["food_phosphate", "manure_phosphate"], available);

  const sourcesClause = _capitalize(ironSource && phosphateSource
    ? `${ironSource} dissolves under the methanogenic phase's reducing chemistry as Fe²⁺. ${_capitalize(phosphateSource)} is abundant in the same leachate.`
    : (ironSource
        ? `${ironSource} dissolves under reducing chemistry as Fe²⁺; phosphate sources in the cell are diffuse but sufficient.`
        : (phosphateSource
            ? `${phosphateSource} is abundant under reducing chemistry, and ferrous iron is supplied diffusely from steel scrap and rebar fines.`
            : "Iron and phosphate sources, both diffuse in the cell, deliver Fe²⁺ and PO4³⁻ under the methanogenic phase's reducing chemistry.")));

  const venue = zoneId === "lcs_biofilm"
    ? "Wilfert 2021 documents vivianite scaling on LCS pipework as a known clogging assemblage; the biofilm-mediated Fe²⁺-PO₄ pairing on this site is the same chemistry, on the same substrate."
    : "The phases stable in this pH-redox window are mature vivianite or amorphous Fe-phosphate gel; what reads as a discrete dot is, in practice, a colony of acicular blades.";

  return `${sourcesClause} Fe²⁺ + PO₄³⁻ has nowhere to escape — and so vivianite forms. ${venue}`;
}

function _narrateMalachite(_scenario: any, _zoneId: string, available: AvailablePrecursor[]): string {
  const acids = _phraseAny(["drywall_sulfate", "organic_co2"], available);
  const copper = _phrase("copper_wiring_dissolution", available);
  const carbonate = _phraseAny(["cement_calcite", "concrete_calcite"], available);

  const acidsClause = acids
    ? `${acids.charAt(0).toUpperCase() + acids.slice(1)} attacked`
    : `The cell's acidic leachate attacked`;
  const copperClause = copper
    ? `the copper wiring buried in PCBs and motor stator coils, mobilizing ${copper}`
    : `buried copper wiring, mobilizing Cu²⁺ into the leachate`;
  const carbonateClause = carbonate
    ? `${carbonate} — a direct contribution from the C&D fraction's slow concrete dissolution —`
    : `late-stage carbonate from the cell's mature alkalinizing chemistry —`;

  return `${acidsClause} ${copperClause}. The Cu²⁺ migrated through the cell's wall-drainage path, where chemistry transitions fast enough to escape the methanogenic core's sulfide trap. Where the dissolved Cu met carbonate-rich pore water — ${carbonateClause} botryoidal malachite stabilized as the green metal-stain familiar from natural supergene zones. Diagenesis re-making the same mineral in eight decades that geologic systems make in eight thousand.`;
}

function _narrateGoslarite(_scenario: any, _zoneId: string, available: AvailablePrecursor[]): string {
  const chloride = _phrase("pvc_hcl_attack_on_zn", available);
  const sulfate = _phrase("drywall_sulfate", available);

  const sourcesClause = chloride && sulfate
    ? `${chloride} drops Zn²⁺ into solution wherever ${sulfate} is also present`
    : (chloride
        ? `${chloride} mobilizes Zn²⁺ into the leachate, where any available SO4 source pairs with it`
        : (sulfate
            ? `galvanized corrosion under acidic leachate releases Zn²⁺, which pairs with ${sulfate}`
            : "galvanized corrosion under acidic leachate releases Zn²⁺; Zn²⁺ + SO4²⁻ pairing is the dominant initial fate"));

  return `Galvanized steel under acidic leachate corrodes at predictable rate: ${sourcesClause}. Goslarite isn't a stable phase — it crystallizes seasonally as pore waters concentrate during dry intervals, redissolves with the next rain, recrystallizes again. The acicular efflorescent crust pulses rather than accumulates, marking the cell's seasonal evaporation cycle on every rusting galvanized surface.`;
}

function _narrateStruvite(_scenario: any, _zoneId: string, available: AvailablePrecursor[]): string {
  const ammonium = _phrase("protein_nh4", available);
  const phosphate = _phraseAny(["food_phosphate", "manure_phosphate"], available);
  const magnesium = _phrase("drywall_mg", available);

  const sourcesClause: string[] = [];
  if (ammonium) sourcesClause.push(ammonium);
  if (phosphate) sourcesClause.push(phosphate);
  if (magnesium) sourcesClause.push(magnesium);
  const sourcesText = sourcesClause.length > 0
    ? sourcesClause.slice(0, -1).join(", ") + (sourcesClause.length > 1 ? ", and " : "") + sourcesClause[sourcesClause.length - 1]
    : "ammonium, phosphate, and magnesium from the cell's organic and calcareous fractions";

  return `Sewage sludge, food waste, and animal-product fines deliver ${sourcesText} to the LCS biofilm at pulse rates set by the cell's hydraulic load. Where the NH₄ + PO₄ + Mg pool meets neutral-to-mildly-alkaline pH at the LCS pipework, struvite precipitates as orthorhombic prisms. The same biomineralization runs in wastewater treatment plants by design; in landfills it runs by accident, clogging leachate-collection systems within 5–15 years of cell closure (Bennett/Fleming biogeochemical-clogging review).`;
}

// ── Fallback templater ──

function _fallbackNarrative(mineral: any, available: AvailablePrecursor[], _zoneId: string): string {
  const intro = `Detailed paragenesis for ${_displayMineralName(mineral._id ?? "this mineral")} is not yet authored — the surveyor's notebook records only a catalog signature. Prose below is reconstructed from precursor-origin data, not from observation.`;
  if (available.length === 0) {
    const phaseToken = (mineral.chemistry_phase ?? [])[0] ?? "unrecorded-phase";
    const description = mineral.description ?? "";
    return `${intro}\n\nNone of this mineral's documented decay precursors map to substrates currently in this cell's inventory. Catalog-described chemistry: ${description} The ${phaseToken}-phase chemistry would deliver this phase if the substrate prerequisites resolved, but the cell as inventoried does not supply them.`;
  }
  const namedSources = available.map((a) => a.precursor.narrator_phrase_short).join(", ");
  const phaseToken = (mineral.chemistry_phase ?? [])[0] ?? "the mineral's preferred phase";
  return `${intro}\n\nFrom this cell's confirmed substrate origins: ${namedSources}. These precursors, under ${phaseToken}-phase chemistry, deliver the ingredients ${mineral.formula} requires. ${mineral.description ?? ""}`;
}

// ── Dispatcher ──

function narrateCrystal(
  mineralId: string,
  scenario: any,
  zoneId: string,
  mineralEntry: any,
  zoneEntry: any,
  precursorSpec: { [id: string]: any } | null,
  hostItem?: any | null,
): CrystalNarrative {
  const m = { ...(mineralEntry ?? {}), _id: mineralId };
  const { available, absent } = _composeAvailablePrecursors(m, scenario, precursorSpec);

  let paragenesis = "";
  let authored = true;

  switch (mineralId) {
    case "pyromorphite": paragenesis = _narratePyromorphite(scenario, zoneId, available); break;
    case "sphalerite":   paragenesis = _narrateSphalerite(scenario, zoneId, available);   break;
    case "anglesite":    paragenesis = _narrateAnglesite(scenario, zoneId, available);    break;
    case "calcite":      paragenesis = _narrateCalcite(scenario, zoneId, available);      break;
    case "vivianite":    paragenesis = _narrateVivianite(scenario, zoneId, available);    break;
    case "malachite":    paragenesis = _narrateMalachite(scenario, zoneId, available);    break;
    case "goslarite":    paragenesis = _narrateGoslarite(scenario, zoneId, available);    break;
    case "struvite":     paragenesis = _narrateStruvite(scenario, zoneId, available);     break;
    default:
      paragenesis = _fallbackNarrative(m, available, zoneId);
      authored = false;
  }

  const speciesEntry = scenario && scenario.expected_species ? scenario.expected_species[mineralId] : null;
  const evidenceRole = speciesEntry ? speciesEntry.evidence_role : "(not in this scenario's expected species)";
  const evidenceNote = speciesEntry ? speciesEntry.note : undefined;

  // Host-item metadata: appended to the narrative when a specific item
  // anchors the crystal (v8). Nullable when the dot fell back to zone-uniform
  // placement (no host substrate matched in this zone).
  let hostLabel: string | null = null;
  let hostClass: string | null = null;
  let hostId: string | null = null;
  if (hostItem) {
    hostClass = hostItem.class_id ?? null;
    hostId = hostItem.id ?? null;
    // Pull the instance suffix off the id ("lead_acid_battery_3" → "#3").
    let suffix = "";
    if (hostId) {
      const lastUnderscore = hostId.lastIndexOf("_");
      if (lastUnderscore >= 0) suffix = " #" + hostId.slice(lastUnderscore + 1);
    }
    const tilePart = (typeof hostItem.tile_col === "number" && typeof hostItem.tile_row === "number")
      ? ` at tile (col ${hostItem.tile_col}, row ${hostItem.tile_row})`
      : "";
    const niceName = hostItem.display_name ?? (hostClass ? hostClass.replace(/_/g, " ") : "host item");
    hostLabel = `${niceName}${suffix}${tilePart}`;
    // Append a host clause to the paragenesis so the prose reads "this
    // crystal grew on a specific item" rather than abstractly. Only
    // append when authored — fallback narratives stay catalog-shaped.
    if (authored) {
      paragenesis += `\n\nHost surface: ${hostLabel}. The crystal nucleated on this object's substrate (${(hostItem.substrate_tokens ?? []).join(", ")}) where the local chemistry met the mineral's stability window.`;
    }
  }

  return {
    mineralId,
    mineralName: _displayMineralName(mineralId),
    formula: m.formula ?? "",
    habit: _displayHabit(m.habit ?? ""),
    zoneLabel: zoneEntry ? zoneEntry.label : zoneId,
    evidenceRole,
    evidenceNote,
    paragenesis,
    citations: m.citations ?? [],
    authored,
    available_precursors: available,
    absent_precursors: absent,
    host_item_label: hostLabel,
    host_item_class: hostClass,
    host_item_id: hostId,
  };
}
