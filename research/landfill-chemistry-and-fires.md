# Landfill Chemistry, Stratification, Drainage, and Fires

**Research compiled 2026-05-06 for the Wasteland Crystals project.**

This document collects primary-source-grounded research on the real chemistry, physical structure, and combustion behavior of municipal solid waste landfills. It exists to ground the game's mineralogy and spatial design in documented science rather than invented chemistry.

**How to read this document:**

- **Section 1 (Synthesis)** is the cross-cutting frame: what the four research threads jointly say about how to design a landfill-as-playfield. Game-design-relevant findings, summarized.
- **Appendices A–D** are the full primary-source reports, with citations preserved. Read these when a design decision needs an evidentiary anchor — the citations are what justify "we model it this way because that's what the literature says."

The four research threads were run in parallel against academic literature, EPA documentation, and case-study sources. Each appendix retains its citations inline so a later design choice can be traced back to its source.

---

## Section 1: Synthesis (cross-cutting findings)

### 1.1 The cross-section is already striped — landfill engineering hands you the playfield geometry

Daily cover (15 cm soil) is deposited every operating shift. Intermediate cover (≥30 cm) goes on any surface idle >180 days. Lifts are 2.5–6 m thick. Total mound heights commonly reach 30–60 m; the largest US landfill (Puente Hills, CA) hit 150 m over 56 years.

Visible pale soil bands every few meters in cross-section. **Below the waste body:** leachate collection layer (30 cm sand + perforated HDPE pipes on 1–2% slope feeding sumps), composite base liner (60-mil HDPE geomembrane + 60 cm compacted clay at k ≤ 1×10⁻⁷ cm/s). **Above:** cap with barrier layer (≥45 cm) + topsoil (≥15 cm), often with geomembrane and gas collection layer in between.

Modern Subtitle D cells read as **orderly horizontal strata bracketed by thin engineered membranes**. Pre-1980 unlined dumps are **chaotic, pocketed, ash-streaked rubble** with sporadic irregular soil interbeds and channelized leachate stains.

**The legacy-unlined-fill-beneath-newer-engineered-cap configuration is real** (older dumps were re-permitted and capped under RCRA without remediating the underlying fill). This gives both visual modes coexisting in one cross-section — a major art-direction lever for the game.

### 1.2 Leachate has two reservoir states, not a continuum — and the transition IS the dramatic mineralogical event

The phase model (Christensen & Kjeldsen 1989, Kjeldsen et al. 2002) is well-established:

- **Aerobic** (weeks–months): trapped O₂ consumed.
- **Acidogenic / acetogenic** (~yrs 1–10): pH 4.5–6.5, BOD 4,000–80,000 mg/L, dissolved metals high (Fe up to 2,100; Zn up to 120; Cu up to 10 mg/L).
- **Methanogenic** (~decades+): pH 7.0–8.5, BOD <500, sulfate collapses to sulfide, dissolved metals crash 1–3 orders of magnitude as sulfides precipitate (Kjeldsen et al. 2002; Baun & Christensen 2004).
- **Stabilized / humic** (centuries): pH 7.5–9, residual recalcitrant DOM, persistent NH₄⁺ and Cl⁻.

The acid-to-methanogenic flip IS the chemistry event: a generation of metal-sulfide species (covellite, sphalerite-analog, galena-analog, pyrite) gives way to carbonates/phosphates as the reservoir converts. **Ammonia (30–3,000 mg/L) and chloride (100–5,000 mg/L) persist forever** — they buffer activity, complex Cu/Cd/Zn (chloro-complexes mobilize metals at high Cl⁻), and seed late-stage exotics: **struvite (NH₄-Mg-phosphate), salammoniac (NH₄Cl), nitratine, halite efflorescences**. That long tail is what distinguishes anthropogenic from natural diagenesis.

### 1.3 Channel flow not bath flow

MSW field capacity is 30–56% volumetric (newer waste 43–56%, old/compacted 30–44%). Fluid only drains above that threshold.

Real flow is two-domain (Fellner & Brunner 2010): **channels** (Ks ≈ 300 m/d, ~zero retention) embedded in **matrix** (Ks ≈ 0.1 m/d, high retention). Bag plastics, daily cover layers, and density gradients make wetting patchy. Large waste volumes never reach field capacity; channels see flushing rates orders of magnitude higher than mean infiltration.

**Crystal nucleation should concentrate at channel walls and channel-matrix interfaces** — direct analog of fracture-controlled mineralization in real rocks — with dry matrix pockets staying barren. Built-in spatial heterogeneity, no procedural noise needed.

### 1.4 Physical sorting, fabric, and literal vugs

(Design framing layered on top of the research threads, contributed 2026-05-07. Grounded in sedimentary-petrology principles applied to MSW geomechanics — Sowers 1973 settlement model, Sharma & Reddy *Geoenvironmental Engineering*, Bareither et al. on waste mechanics — but the synthesis here is design framing, not direct literature finding.)

Garbage doesn't pile uniformly. Compactor wheels + differential settlement act like fluvial sorting:

- **Dense items** (batteries, concrete chunks, metal) sink within each lift during compaction; fluffy material fills voids around them.
- **Coarse rigid clasts** (appliances, tires, C&D rubble) form a **clast-supported framework** with high inter-clast permeability. These define where the channels (§1.3) physically come from.
- **Fine matrix** (food pulp, soil cover, soggy paper, plastic film) is **matrix-supported fabric** with low permeability, holding liquid against gravity.

This is the same clast-supported / matrix-supported distinction from sedimentary petrology, applied to MSW.

**Drainage falls out of fabric.** Coarse zones flush fast → channel-wall mineralization. Fine matrix zones have long residence time → diffusion-dominated, evolved-leachate chemistry, evaporite-style efflorescences when they dry. The spatial chemistry zoning isn't a separate axis from physical sorting — it's a direct consequence of it.

**Rigid items make literal vugs.** Refrigerators, washing machines, car bodies, computer chassis, TV cabinets, water heaters — anything with rigid walls and internal volume — don't compact. They create permanent interior voids that survive burial. **A buried refrigerator IS a vug in the strict mineralogical sense:** an open cavity in surrounding "rock," with internal surfaces available for free-faced crystal growth.

This is the engine port at its most direct: vugg-simulator's geological vug → wasteland's appliance interior. Same crystal-growth-into-open-space mechanic, same competing-nucleation-and-habit logic, just with a sheet-metal substrate instead of host limestone. The game's name becomes literally accurate, not metaphorical.

**Implementation implication:** the very first proof-of-concept zone should be crystals nucleating into the interior of a single buried appliance. That exercises the engine port in its most direct form before any of the more exotic chemistry layers are added.

**Specific item behaviors:**

| Item type | Mechanical behavior | Chemistry/spatial role |
|---|---|---|
| Appliances (rigid hollow chassis) | Don't compact; create permanent interior voids | **Literal vugs** — primary crystal-growth space |
| Tires | Springy clast network, predictable void structure | Channels + ZnS source if burned |
| C&D rubble (concrete, brick) | Rigid coarse clasts | Coarse permeable drainage; alkaline substrate |
| Paper/cardboard | Soggy matrix wet, fragile dry | Matrix-supported low-flow zones |
| Food waste | Decays in ~5–30 yr | **Generates new voids over time** as it disappears |
| Mattresses | Compress then partially recover | Lenticular springy zones |
| Metal cans | Crush laminar | Flat-fabric layers |
| Plastic film | Ductile, fills voids | Matrix component AND in-place polymer-decay precursor |
| Batteries, dense electronics | Sink in compaction | Point-source chemistry hotspots |

**Void evolution over time.** Food waste decay (5–30 yr) is geologically analogous to evaporite/limestone dissolution leaving karst cavities — but on a decadal not millennial timescale. The playfield isn't static; it actively **develops new crystal-growth real estate as organics decompose**. By the methanogenic phase, the cell has substantially more void space than at burial.

### 1.5 Composition: invert pixel-weighting from mass-weighting

C&D debris is 600 Mt/yr in the US (2× MSW), and **73% of it is concrete + asphalt** — that's the dominant Ca/Si/Al/S substrate hosting the entire alkaline-sulfate-iron paragenesis (portlandite Ca(OH)₂ → ettringite → C-S-H, plus gypsum from drywall, Fe oxides from rebar). MSW chemistry is driven by 63% organics (food/yard/paper/wood) producing the anoxic methanogenic fatty-acid leachate that mobilizes everything else.

But **e-waste + household hazardous waste — <5% by mass — are the only sources of the visually interesting secondary mineralogy**: Cu/Au/Ag/Pd from PCBs (90–350 g Au/tonne PCB), Pb/H₂SO₄ from lead-acid, Co/Ni/Li from batteries, Hg from fluorescents, Br flame retardants.

**Design implication:** lots of pixels per gram of e-waste, very few per ton of drywall. The inventory system should weight visual/gameplay presence inversely to mass abundance.

### 1.6 Burn zones invert the chemistry — same element, different mineral

Subsurface smoldering is well-documented and persistent. **Bridgeton landfill (Missouri) has been smoldering since 2010** at >150°C through 22 Mt of waste at >150 ft depth, near radioactive material at the adjacent West Lake site.

**Mechanism:** aerobic biodegradation drives cores to 60–80°C; O₂ ingress through cap cracks or gas wells pushes to 150–600°C smoldering combustion (Rein 2009; Stark et al. 2012). Flaming combustion (>600°C) is rare subsurface — only at vents/exposed faces.

**Trigger candidates:**
- **Aluminum dross + alkaline leachate** (suspected Bridgeton cause): exotherm + H₂/CH₄/NH₃ release.
- **Lithium-ion batteries**: rising trend, NA recycling-facility fires up 187% from 2020 to 2024.
- **Tire piles**: arson or wildfire ignition (Hagersville ON 1990, 14M tires; Tracy CA 1998, 7M tires, 26-month burn).

**Burn-vs-unburned zone deltas:**

| Property | Unburned zone | Burn zone |
|---|---|---|
| pH | 5.5–8 (phase-dependent) | **10–12** (ettringite/oxide-buffered) |
| Redox | reducing (methanogenic) | oxidized |
| Cu mineralogy | covellite, digenite | tenorite, malachite, atacamite |
| Element menu | full suite | **enriched** Pb/Zn/Cu/Fe/Cr/Ni; **depleted** Hg/Cd/As (volatilized off) |
| Visual | grey-brown organic ooze | red-orange Fe-oxide rinds, white salt blooms, **black glassy clinker** (gehlenite, åkermanite, anorthite — full melilite assemblage from MSWI bottom-ash mineralogy) |

**Tire pyrolysis specifically** yields **ZnS-rich, S-rich oily char with PAHs** at 400–700°C — sphalerite-analog crystal pockets are plausible in old tire-pile burn zones.

**Design implication:** the burn-zone mechanic doesn't change *which* elements are present, it changes *which crystals grow from them*. Same input, different output, gated by local thermal history. This is a clean structural mechanic.

### 1.7 Polymer-decay-cascade additions

Original cascade (sketched in proposal): PVC → HCl → chloride seconds; celluloid/acrylic → nitric/organic acids; PE/PP slow oxidation → wider metal mobilization; cement → late-stage carbonate cap.

Additions from this research:

- **Aluminum dross + alkaline leachate**: reactive-metal exotherm, H₂ release, real Bridgeton-style fire trigger.
- **Tires**: chemically distinctive S/Zn fraction, capable of producing synthetic-sphalerite zones if burned, oily-char zones if not.
- **Bioreactor mode**: leachate recirculation compresses the acid→methanogenic transition from ~10 yr to ~2–4 yr. Candidate for a "fast time" cell archetype in-game.

### 1.8 Three-paper foundation for further reading

The receiving agent should anchor on:

- **Hazen et al. 2017** — anthropogenic mineral catalog (~208 species), the canonical taxonomy of human-caused minerals.
- **Kjeldsen et al. 2002** (*Crit Rev Env Sci Tech*) — leachate phase chemistry, the canonical leachate review. [doi:10.1080/10643380290813462](https://doi.org/10.1080/10643380290813462)
- **ITRC subsurface smoldering events guidance** + **Stark et al. 2012** (*Waste Management*) — landfill fire mechanism and detection.

Plus **Baldé et al. 2024 Global E-waste Monitor** for e-waste composition.

### 1.9 Open gaps (not researched in this pass)

- **Geomechanics**: how differential settlement over decades creates new cracks that redistribute flow paths. Could become a dynamic mechanic where the playfield's plumbing reorganizes over time.
- **Microbial vertical zonation**: the leachate report covered sulfate-reducer sulfide precipitation, but didn't enumerate the full redox stack (aerobes near surface → denitrifiers → Fe/Mn reducers → sulfate reducers → methanogens, vertically zoned by O₂ availability) that should structure crystal-growth zones in a more mechanistic way.
- **Deep-time projection past ~100 yr into Myr-scale tectonic burial**: probably out of scope for the cyberpunk-near-future framing, but worth confirming the timescale is locked.

---

## Appendix A: Landfill Cross-Section Anatomy

Source: parallel research thread on stratification and engineering. Reproduced with citations intact.

### A.1 Modern engineered cell (RCRA Subtitle D / 40 CFR 258), top-to-bottom

**Final cover (cap) — required minimums under 40 CFR 258.60:**

- **Erosion / vegetative layer:** 6 in (150 mm) of topsoil capable of sustaining native plants ([eCFR 40 CFR 258 Subpart F](https://www.ecfr.gov/current/title-40/chapter-I/subchapter-I/part-258/subpart-F)).
- **Infiltration / barrier layer:** 18 in (450 mm) minimum, permeability ≤ 1×10⁻⁵ cm/s and no greater than the bottom liner ([NYSDEC liner & cover guidance](https://dec.ny.gov/environmental-protection/waste-management/solid-waste-management-facilities/municipal-solid-waste-landfills/liner-and-cover-systems)).
- **Geomembrane component (typical engineered cap):** 40-mil LLDPE or 60-mil HDPE ([AGRU America cap design](https://agruamerica.com/stability-landfill-cap-design/)). Composite caps add a GCL plus a drainage geocomposite above the geomembrane.
- An "alternative" multilayer cap example: 12 in intermediate soil + 24 in silty-clay till + 12 in topsoil (~4 ft total).

**Gas collection layer:** Vertical extraction wells (typically 24–36 in diameter, drilled on a ~200–400 ft grid) penetrate into the waste mass; horizontal collectors are often laid between lifts. They tie to a header running along the cap perimeter ([SCS Engineers landfill gas systems](https://www.scsengineers.com/wp-content/uploads/2017/04/Selecting-the-Right-Closure-Cap-Option-for-Your-Surface-Impoundment-or-CCR-Landfill.pdf)).

**Waste body — emplaced as "lifts":**

- A **daily cell** is one day's working face, compacted and topped with **6 in (150 mm) of soil daily cover** (40 CFR 258.21).
- A **lift** is the lateral assembly of daily cells forming one horizontal layer. Typical lift thicknesses: **8–20 ft (≈2.5–6 m)**; smaller MSW operations use 8–10 ft ([Waste360, Lesson 7](https://www.waste360.com/design-construction/lesson-7-preparing-landfill-designs-specifications)).
- **Intermediate cover:** ≥12 in (300 mm) compacted soil placed on any surface idle >180 days ([CalRecycle daily/intermediate cover guidance](https://calrecycle.ca.gov/swfacilities/permitting/guidance/dailyintcovr/)). These appear as visible pale bands every several meters in cross-section.
- Compacted MSW density: ~600–900 kg/m³.

**Leachate collection layer (above the liner):**

- **12 in (300 mm)** of sand or coarse aggregate (or a geocomposite drainage net).
- Perforated 4–8 in HDPE collection pipes on a 1–2% slope, feeding a low-point **sump** with a submersible pump in a riser. Regulation caps leachate head on the liner at **≤12 in (300 mm)** ([SPSA regional landfill](https://www.spsava.gov/169/Regional-Landfill-How-Its-Made), [WM leachate system](https://americanlandfill.wm.com/landfill-design-construction/leachate-collection-and-management-system.jsp)).

**Composite base liner (40 CFR 258.40):**

- **60-mil (1.5 mm) HDPE geomembrane** (the federal floor; many states require 60-mil),
- in direct contact with **2 ft (600 mm) of compacted clay** at k ≤ 1×10⁻⁷ cm/s (or a GCL + 2 ft soil) ([EPA MSW landfill page](https://www.epa.gov/landfills/municipal-solid-waste-landfills); [Geosynthetics Magazine 101](https://geosyntheticsmagazine.com/2015/06/01/geosynthetics-landfills-101/)). Hazardous-waste cells (Subtitle C) use double composite liners with a leak-detection geonet between.

### A.2 Cell sequencing and overall geometry

Cells are excavated as **basins with bermed perimeters**, typically 5–20 acres in plan and 20–60 ft deep into native ground. Filling is **lateral-then-vertical**: one cell's daily cells progress across the working face, lifts stack until permitted height, and the next cell is constructed adjacent, sharing a "tie-in" liner seam ([BTL Liners cell design](https://www.btlliners.com/the-basics-of-landfill-cell-design)). A single cell typically takes **6 months–2 years** to fill. Side slopes are 3H:1V to 4H:1V. Total mound heights commonly reach **30–60 m**; the largest U.S. example, **Puente Hills (CA), reached ~500 ft (150 m)** above original grade over 56 years ([Puente Hills, Wikipedia](https://en.wikipedia.org/wiki/Puente_Hills_Landfill)).

### A.3 Pre-RCRA open dumps (≤1979)

RCRA (1976) and EPA's 1979 criteria banned open dumping ([EPA tribal dump-closure guide](https://19january2017snapshot.epa.gov/www3/region9/waste/tribal/pdf/small-dump-landfill-closure-guidance.pdf)). Pre-1980 dumps have **no liner, no leachate collection, no engineered cap**. Cross-section is a chaotic stack of waste with **sporadic, irregular soil interbeds** where operators happened to push fill or burn refuse. Burn ash lenses, glass-rich horizons, and channelized leachate stains are typical; archaeological literature treats them as disordered stratigraphy ([SHPO "Down in the Dumps"](https://d2umhuunwbec1r.cloudfront.net/gallery/asp-archive/SHPO/downloads/SHPO_Down_in_Dumps.pdf)).

### A.4 Bioreactor variant

Same composite liner, but liquid is intentionally added: leachate (plus stormwater/sludge) is recirculated via **horizontal injection trenches** or vertical wells distributed throughout the waste mass ([EPA bioreactor landfills](https://www.epa.gov/landfills/bioreactor-landfills)). Moisture is held at ~35–65% field capacity, accelerating settlement and stabilization to **years rather than decades**. Visually, the waste body is laced with a denser network of pipework and shows pronounced differential settlement.

### A.5 Implications for the cross-section playfield

- **The cap and base liner are visually distinct, thin, "engineered" sandwiches**; the bulk middle is a coarse banded mass — striped every 2–6 m by daily/intermediate cover. That banding is the natural grid for a 2D playfield and a believable substrate for crystal nucleation along reactive interfaces.
- **Liquids and gases have geometry the player can exploit:** leachate pools downslope toward sumps at the lowest corner (1–2% gradient, 12 in head cap); landfill gas migrates upward along well risers and laterally beneath the cap. Think geothermal-style fluid plumbing — wet basal zone, gas-rich upper zone.
- **Old vs. new is a strong art-direction lever:** modern cells read as orderly horizontal strata bracketed by HDPE lines; legacy unlined zones (cyberpunk-plausible legacy fill beneath a newer engineered cap) can be drawn as chaotic, pocketed, ash-streaked rubble — a great source of unusual crystal-growth chemistry where pre-RCRA toxics meet engineered leachate.

---

## Appendix B: Leachate Chemistry and Drainage

Source: parallel research thread on leachate. Reproduced with citations intact.

### B.1 Composition by Life-Stage

MSW landfill leachate evolves through a well-established phase sequence (Christensen & Kjeldsen 1989; Kjeldsen et al. 2002): **aerobic** (weeks–months, O₂ in trapped air consumed) → **acidogenic/acetogenic** (~1–10 yr, hydrolysis + VFA accumulation) → **methanogenic** (~decades, VFAs consumed by methanogens, pH rises) → **humic/stabilized** (centuries, residual recalcitrant DOM, persistent NH₄⁺ and Cl⁻).

The acid phase is where the action is for a crystal-growth simulator: low pH liberates a heavy-metal soup. The methanogenic phase is the long, near-neutral, NH₄⁺/Cl⁻-dominated tail. Heavy metals are sequestered in the waste body by sulfide precipitation (sulfate-reducers generate S²⁻) and by sorption to humified organics and Fe/Mn oxyhydroxides (Kjeldsen et al. 2002, sec. on metals; Baun & Christensen 2004).

**Table B.1. Typical leachate composition ranges, MSW landfills.** Compiled from Kjeldsen et al. 2002 (ranges shown are the broad cross-site spread the review tabulates), Baun & Christensen 2004 (heavy metals), and Renou et al. 2008.

| Parameter (mg/L unless noted) | Acid phase | Methanogenic phase | Stabilized/humic |
|---|---|---|---|
| pH | 4.5 – 6.5 | 7.0 – 8.5 | 7.5 – 9 |
| BOD5 | 4,000 – 40,000 (up to 80,000) | 20 – 550 | <100 |
| COD | 6,000 – 60,000 (up to 150,000) | 500 – 4,500 | <1,000 |
| BOD/COD | 0.4 – 0.8 | 0.05 – 0.2 | <0.1 |
| NH4+-N | 50 – 2,200 | 30 – 3,000 (does not decline) | 30 – 3,000 |
| Cl- | 100 – 5,000 | 100 – 5,000 (conservative) | 100 – 5,000 |
| SO4 2- | 70 – 1,750 | 10 – 420 (reduced to S2-) | <50 |
| Alkalinity (as CaCO3) | 1,000 – 10,000 | 3,000 – 15,000 | 1,000 – 5,000 |
| Fe | 20 – 2,100 | 3 – 280 | <10 |
| Mn | 0.3 – 65 | 0.03 – 45 | <1 |
| Zn | 0.1 – 120 | 0.03 – 4 | <0.5 |
| Pb | 0.001 – 1.5 | 0.001 – 0.4 | <0.05 |
| Cu | 0.005 – 10 | 0.005 – 0.6 | <0.1 |
| Cd | 0.0001 – 0.4 | 0.0001 – 0.05 | <0.01 |
| Cr | 0.02 – 1.5 | 0.005 – 1.0 | <0.1 |
| Ni | 0.02 – 13 | 0.02 – 1.0 | <0.2 |

Sources: Kjeldsen et al. 2002, [doi:10.1080/10643380290813462](https://doi.org/10.1080/10643380290813462); Baun & Christensen, *Waste Manag Res* 22:3–23 (2004), [doi:10.1177/0734242X04042146](https://doi.org/10.1177/0734242X04042146); Renou et al., *J Hazard Mater* 150:468–493 (2008).

### B.2 Generation Rate by Climate

The **HELP** model (Schroeder et al., USEPA EPA/600/R-94/168b) routes precipitation through cover → runoff, ET, lateral drainage, percolation. Typical outputs:

- **Humid temperate** (P ≈ 800–1200 mm/yr): leachate = 150–350 mm/yr equivalent depth; ~20–40% of precipitation becomes leachate during the open/operational phase, dropping to <10% under a final cap.
- **Semi-arid/arid** (P < 400 mm/yr): ET dominates (e.g., 77% of P at Sousse, Tunisia; Frikha et al. 2017, [doi:10.1177/0734242X17715102](https://doi.org/10.1177/0734242X17715102)). Field measurements: 0.148 m³/ton-yr humid vs. 0.079 m³/ton-yr semi-arid (Frikha & Zairi 2021, [doi:10.1504/IJEWM.2021.111906](https://doi.org/10.1504/IJEWM.2021.111906)). In true arid sites the only fluid is waste-intrinsic moisture — small volume, very concentrated.

### B.3 Water Movement Through Waste

Waste must reach **field capacity** before drainage starts. Reported volumetric field capacity: 30–56% (new waste 43–56%, old/compacted 30–44%; Zornberg et al. 1999; Stoltz et al. 2010). Below θk, infiltrating water is held; above it, gravity drains the excess.

Flow is strongly **non-Fickian and channelized**. Two-domain models (Fellner & Brunner 2010, [doi:10.1016/j.wasman.2010.03.025](https://doi.org/10.1016/j.wasman.2010.03.025)) treat MSW as a fast **channel domain** (Ks ≈ 300 m/d, ~zero retention) embedded in a slow **matrix domain** (Ks ≈ 0.1 m/d, high retention). Bag plastics, daily cover layers, and density gradients make wetting patchy: large waste volumes never reach θk, while channels see flushing rates orders of magnitude higher than mean infiltration. This is why aged landfills still contain dry pockets and why leachate composition shows pulsing rather than smooth dilution.

### B.4 Bioreactor Operation

Leachate recirculation (USEPA bioreactor program) raises moisture toward θk uniformly, accelerates hydrolysis/acidogenesis, and compresses the acid-to-methanogenic transition from ~10 yr to ~2–4 yr (Reinhart & Townsend 1998; Benson et al. 2007). Side effects: VFA overshoot can stall methanogens (recirculating already-acidic liquor); operators often **alkalinize recirculated leachate** (NaOH/lime) to push pH ~7–8. Net effect: faster metal sequestration, faster NH₄⁺ buildup, earlier arrival at the methanogenic plateau — but ammonia accumulates rather than being stripped, often becoming the operational bottleneck.

### B.5 Implications for game chemistry

- **Two reservoirs, not a continuum.** Model the fluid as Phase A (acid, pH ~5, metal-rich, high VFA, high Fe/Mn/Zn) and Phase B (methanogenic, pH ~8, NH₄⁺/Cl⁻ dominated, sulfide-buffered, metals scavenged). The transition is the dramatic chemistry event: pH jumps ~2 units, sulfate collapses to sulfide, and dissolved metals crash by 1–3 orders of magnitude as sulfides precipitate. Perfect trigger for a generation of metal-sulfide crystal species giving way to carbonate/phosphate species.
- **Channel flow is the delivery mechanism.** Fluid does not bathe the waste uniformly; it pulses through preferential paths at field capacity. Crystal nucleation should concentrate at channel walls and matrix-channel interfaces (analog of fracture-controlled mineralization), with dry matrix pockets staying barren — a natural reason for spatial variety.
- **Ammonia and chloride are forever.** Even in your stabilized far-future state, NH₄⁺ (30–3000 mg/L) and Cl⁻ (100–5000 mg/L) persist as conservative species. They buffer activity, complex Cu/Cd/Zn (chloro-complexes mobilize metals at high Cl⁻), and seed exotic late-stage phases — struvite (NH₄-Mg-phosphate), salammoniac (NH₄Cl), nitratine, halite efflorescences. These are the long-tail "humic phase" minerals that distinguish anthropogenic from natural systems.

### B.6 Sources

- [Kjeldsen et al. 2002, Crit Rev Env Sci Tech 32:297-336](https://doi.org/10.1080/10643380290813462)
- [Baun & Christensen 2004, Waste Manag Res 22:3-23](https://doi.org/10.1177/0734242X04042146)
- [Frikha et al. 2017, Waste Manag Res 35:940-948](https://doi.org/10.1177/0734242X17715102)
- [Frikha & Zairi 2021, Int J Env Waste Mgmt](https://doi.org/10.1504/IJEWM.2021.111906)
- [Fellner & Brunner 2010, Waste Management](https://doi.org/10.1016/j.wasman.2010.03.025)
- [USEPA Bioreactor Landfills program](https://www.epa.gov/landfills/bioreactor-landfills)
- Schroeder et al. 1994, HELP model documentation, EPA/600/R-94/168b

---

## Appendix C: Material Composition of Garbage Dumps and Landfills

Source: parallel research thread on composition. Reproduced with citations intact.

### C.1 US MSW Composition (EPA 2018, latest published)

Total MSW generated: 292.4 million tons. Total landfilled: 146 million tons.

| Material | % of generation | % of landfilled |
|---|---|---|
| Paper & paperboard | 23.1% | ~12% |
| Food | 21.6% | ~24% |
| Plastics (all resins) | 12.2% | ~18.5% |
| Yard trimmings | 12.1% | ~6% |
| Metals (total) | 8.8% | — |
| — Ferrous | 6.6% | — |
| — Aluminum | 1.3% | — |
| — Other non-ferrous (Cu, Zn, Pb, Sn) | 0.9% | — |
| Wood | 6.2% | ~8% |
| Textiles | 5.8% | ~9% (with rubber/leather ~11%) |
| Glass | 4.2% | ~5% |
| Rubber & leather | ~3% | (in 11% bucket above) |
| Other (misc inorganics, fines) | ~2% | — |

Plastic resins: containers/packaging dominate at 14.5 Mt; PET and HDPE bottles are recovered ~29%, the rest (PVC, LDPE, PP, PS, multilayer film) goes overwhelmingly to landfill. ([EPA National Overview](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials), [2018 Tables and Figures PDF](https://www.epa.gov/sites/default/files/2021-01/documents/2018_tables_and_figures_dec_2020_fnl_508.pdf))

### C.2 Trends 1960 to 2018

| Material | 1960 share | 2018 share | Direction |
|---|---|---|---|
| Total tons | 88.1 Mt | 292.4 Mt | 3.3x |
| Plastics | <0.5% | 12.2% | sharp rise |
| Paper | ~34% | 23.1% | falling (digital + recycling) |
| Food | ~14% | 21.6% | rising in absolute, diverted slowly |
| Yard trimmings | ~22% | 12.1% (35 Mt; was 16.8% in 1990) | falling (composting diversion) |
| Glass | ~7% | 4.2% | falling (Al + plastic substitution) |
| Metals | ~12% | 8.8% | falling (lightweighting) |

([EPA National Overview, time-series table](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials))

### C.3 Construction & Demolition Debris (EPA 2018)

Total: 600 Mt — over 2x MSW. Tracked separately from MSW landfills, but co-located with MSW in many monofills.

| Material | Mt | % |
|---|---|---|
| Concrete | 334 | ~55.7% |
| Asphalt concrete | 102.1 | 17.8% |
| Wood products | 40.8 | 6.8% |
| Drywall / gypsum | 15 | 2.5% |
| Asphalt shingles | 15 | 2.5% |
| Brick & clay tile | 12 | 2.0% |
| Steel | <6 | <1% |
| Soil/dirt + other | balance | ~12% |

([EPA C&D Material-Specific Data](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/construction-and-demolition-debris-material), [C&D Generation Report 2018](https://www.epa.gov/sites/default/files/2018-09/documents/construction_and_demolition_debris_generation_in_the_united_states_2015_final.pdf))

### C.4 E-waste Composition (Global E-waste Monitor 2024, Baldé et al.)

Per tonne of mixed e-waste / WEEE printed circuit boards:

| Fraction | Bulk e-waste | PCB-only |
|---|---|---|
| Iron/steel | ~50% | 8–38% of metal fraction |
| Plastics | ~20% (15+ resin types incl. brominated) | ~30% |
| Glass (CRT, LCD) | ~10% | (fiber 65% of non-metal) |
| Copper | ~7% | 130–200 kg/t |
| Aluminum | ~2% | 2–19% of metal |
| Lead | ~0.3% | 1–3% of metal |
| Silver | — | 0.4–1.4 kg/t |
| Gold | — | 90–350 g/t |
| Palladium | — | ~210 g/t |
| Hazardous: Hg, Cd, Br flame retardants, Be | trace but mandated tracked | — |

([Global E-waste Monitor 2024, ITU/UNITAR/Baldé](https://ewastemonitor.info/the-global-e-waste-monitor-2024/))

### C.5 Household Hazardous Waste in MSW

HHW = 1–4% of MSW by mass: lead-acid + Li-ion + alkaline batteries, latex/oil paint, solvents, pesticides, motor oil, fluorescent tubes (Hg), CFL/LED. Chemically disproportionate — drives leachate redox, mobilizes metals. ([EPA HHW](https://www.epa.gov/hw/household-hazardous-waste-hhw))

### C.6 International Variation (World Bank, *What a Waste 2.0*, 2018)

| Income tier | Food + green | Dry recyclables (paper/plastic/metal/glass) | Other |
|---|---|---|---|
| Low-income | 57% | 20% | 23% |
| Middle-income | 53% | ~30% | ~17% |
| High-income | 32% | 51% | 17% |

Global plastics share: ~12% of all MSW (242 Mt in 2016). ([What a Waste 2.0 PDF](https://documents1.worldbank.org/curated/en/697271544470229584/pdf/What-a-Waste-2-0-A-Global-Snapshot-of-Solid-Waste-Management-to-2050.pdf))

### C.7 Implications for material inventory

- **C&D dwarfs MSW 2:1 and is 73% concrete + asphalt** — that is the dominant Ca/Si/Al/S substrate. Cement clinker hydration products (portlandite Ca(OH)₂, ettringite, C-S-H) plus oxidizing rebar (Fe²⁺/Fe³⁺) and gypsum drywall (CaSO₄·2H₂O) give you the entire alkaline-sulfate-iron parageneses for free — this should be the bedrock layer of any dump biome.
- **MSW chemistry is dominated by organics (food + yard + paper + wood ~63%)** which drive anoxic, methanogenic, fatty-acid leachate at pH 5.5–7.5 and high DOC. That redox/pH window plus chloride from food/PVC is what mobilizes the trace metals; without organics, metals stay locked. Model leachate as the reaction medium, not the substrate.
- **E-waste and HHW are the spice — tiny mass fraction, outsized mineralogy.** PCB Cu/Au/Ag/Pd, lead-acid Pb/H₂SO₄, Ni-Cd and Li-ion Co/Li/Ni, fluorescent Hg, brominated plastics — these are the only sources of the visually interesting secondary minerals (atacamite, anglesite, cerussite, native Cu/Ag/Au, erythrite, Co/Ni efflorescences, mercurous halides). Per-tonne weighting in-game should be inverted from real mass: lots of pixels per gram of e-waste, very few per ton of drywall.

### C.8 Sources

- [EPA National Overview: MSW Facts and Figures](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/national-overview-facts-and-figures-materials)
- [EPA 2018 Fact Sheet PDF](https://www.epa.gov/sites/default/files/2021-01/documents/2018_ff_fact_sheet_dec_2020_fnl_508.pdf)
- [EPA C&D Debris Material-Specific Data](https://www.epa.gov/facts-and-figures-about-materials-waste-and-recycling/construction-and-demolition-debris-material)
- [Global E-waste Monitor 2024 (Baldé / UNITAR / ITU)](https://ewastemonitor.info/the-global-e-waste-monitor-2024/)
- [World Bank What a Waste 2.0](https://datatopics.worldbank.org/what-a-waste/)
- [EPA Household Hazardous Waste](https://www.epa.gov/hw/household-hazardous-waste-hhw)

---

## Appendix D: Subsurface Landfill Fires — Mechanism, Cases, Chemistry

Source: parallel research thread on autoignition and burn chemistry. Reproduced with citations intact.

### D.1 Mechanism: aerobic heat → smoldering → flaming

Fresh MSW self-heats by aerobic biodegradation; pile cores routinely reach **55–70°C**, with regulatory baselines of 55°C/131°F (older) and 145°F/63°C (current US thresholds) ([EPA ETLF factsheet](https://www.epa.gov/system/files/documents/2022-04/elevated-temperature-landfills-factsheet-1.pdf)). Above ~70°C methanogens die off and methane drops below 15% ([Bolyard, NCSWANA](https://ncswana.starchapter.com/images/Elevated_Landfill_Temps-Bolyard.pdf)). With O₂ ingress through a cracked cap or via gas wells acting as conduits, exothermic reactions transition into **smoldering combustion** at ~150–600°C — flameless, oxygen-limited, self-propagating heterogeneous oxidation in porous media ([Rein 2009 review, Edinburgh](https://era.ed.ac.uk/bitstream/handle/1842/2678/Rein_SmoulderingReview_IRECHE09.pdf)). Peak smoldering of organic-rich fuels is 500–520°C; minimum O₂ supply ~0.08 g/m²·s ([Wang et al., Combust Flame 2022](https://www.sciencedirect.com/science/article/abs/pii/S0010218022003959)). Flaming combustion (>600°C) is rare subsurface — only at vents/exposed faces. Diagnostic gas signatures: **CO >1500 ppm, wellhead T >190°F, in-situ T >230°F, low CH₄, elevated H₂/CO/NH₃** ([Stark et al., Waste Mgmt 2012; Bolyard](https://ncswana.starchapter.com/images/Elevated_Landfill_Temps-Bolyard.pdf)).

### D.2 Notable cases

| Site | Mass / scale | Peak T | Duration | Trigger |
|---|---|---|---|---|
| Bridgeton/West Lake, MO | 22 Mt MSW, 184 ft deep, ~20-acre reaction zone at >150 ft depth | >300°F (>149°C) waste; 230°F gas | 2010–present (still monitored 2025) | Aluminum dross + leachate recirculation suspected; adjacent to radioactively contaminated OU-1 ([MO DNR SSE summary](https://dnrservices.mo.gov/bridgeton/docs/subsurfacesmolderingevent091514.pdf); [Missouri Independent Jan 2025](https://missouriindependent.com/2025/01/22/high-likelihood-of-radioactive-waste-in-smoldering-landfill-missouri-officials-say/)) |
| Smokey Mountain, Manila | 2 Mt+ over 50 yr | n/a (chronic surface fires from CH₄ ignition) | Chronic until 1995 closure | Open-dump CH₄ ignition ([Wikipedia/EJAtlas](https://en.wikipedia.org/wiki/Smokey_Mountain)) |
| Hagersville, ON | 12–14 M tires | flaming | 17 days, Feb 1990 | Arson |
| Tracy, CA (Royster) | 7 M tires | flaming | 26 months, 1998–2000 | Grass fire ([Wikipedia tire fire; CARB report L871](https://ww2.arb.ca.gov/sites/default/files/classic/research/apr/reports/l871.pdf)) |
| Li-ion incidents | — | very fast, hot | minutes–hours per event | 448 reported NA fires in 2025; 187% rise 2020–24 ([Resource Recycling/UL Solutions](https://resource-recycling.com/recycling/2025/03/18/recycling-facility-fires-increase-substantially-in-2024/)) |

**Aluminum dross + alkaline leachate (pH ≥9):** vigorous exotherm releasing **H₂, CH₄, NH₃**; can ignite in moist air ([CAMEO Chemicals](https://cameochemicals.noaa.gov/chemical/19097); [Calder & Stark, J Hazard Mater 2010](https://pubmed.ncbi.nlm.nih.gov/22326245/)). Implicated as a Bridgeton trigger.

### D.3 Chemistry of the burn zone

**Plastic pyrolysis:** PVC dehydrochlorinates at **250–350°C**, releasing ~58% of its mass as **HCl** plus benzene; second stage (360–500°C) yields aromatic char ~99% hydrocarbon ([Yu et al., Waste Mgmt 2016](https://www.sciencedirect.com/science/article/abs/pii/S0956053X16304949); [NIST PVC toxicity assessment](https://www.nist.gov/publications/toxicity-pyrolysis-and-combustion-products-polyvinyl-chlorides-literature-assessment)). PE/PP yield char + light hydrocarbons; PS yields styrene monomer.

**Heavy-metal partitioning** ([Mater. Cycles Waste Mgmt 2022 review](https://link.springer.com/article/10.1007/s10163-022-01459-w); [Sci Reports 2024](https://www.nature.com/articles/s41598-024-56551-y)):

- **Concentrated in burn zone (bottom-ash analog):** Co, Cr, Cu, Mn, Ni (~90% retained); Pb, Zn ~50–60% retained.
- **Volatilized out:** Hg ~70%, Cd ~85%, As 40–50%, with chlorides (from PVC HCl) enhancing volatilization.

**Mineralogy of burned waste** mirrors MSWI bottom ash: **glass ~40%, quartz, calcite, magnetite, hematite, gehlenite (Ca₂Al(AlSi)O₇), spinel**; on weathering → **ettringite, gypsum, hydrocalumite, åkermanite, cristobalite** ([Eusden et al. ES&T; Piantone et al.](https://pubs.acs.org/doi/abs/10.1021/es990739c)). Slag/vitrification onset at 1080–1115°C (sintering) and full glass at ~1400°C — only achievable at flaming hotspots.

**Burn-zone vs unburned MSW for years after:** elevated **pH 10–12** (Ca-oxide/carbonate buffering by calcite, then ettringite); oxidized redox; loss of organic matter; mobilization of oxyanions (Cr(VI), Mo, Sb, V); enrichment of refractory metal oxides.

### D.4 Tire pyrolysis specifics

Tires = rubber + ~30% carbon black + **~1.5–2% Zn (as ZnO vulcanization activator)** + **1.5–2% S**. Pyrolysis at 400–700°C yields ~33–38% **pyrolysis oil** (BTEX, limonene), ~30–35% **char (carbon + ZnS/ZnO + S, 1.7–3.3 wt% S)**, and gas (H₂, CH₄, H₂S) ([Polymers 2023 review](https://www.mdpi.com/2073-4360/15/7/1604); [J Air Waste Mgmt 2023](https://www.tandfonline.com/doi/full/10.1080/10962247.2022.2136781)). Result: **oily, ZnS-rich, sulfur-rich char with PAHs**.

### D.5 Landfill gas and fire risk

LFG steady-state: **CH₄ 45–60%, CO₂ 40–60%, N₂ 2–5%, O₂ 0.1–1%, H₂S 0–1%, NMOCs 0.01–0.6%** including BTEX, vinyl chloride, mercaptans ([EPA LMOP FAQ](https://www.epa.gov/lmop/frequent-questions-about-landfill-gas); [ATSDR Landfill Gas Primer Ch. 2](https://www.atsdr.cdc.gov/HAC/landfill/PDFs/Landfill_2001_ch2mod.pdf)). Fire diagnostics flip the signature: **CH₄ collapses, CO/H₂ rise, SO₂ appears**, NMOCs spike with combustion products.

### D.6 Implications for the burn-zone mechanic

- **Distinct host substrate:** burn zone is glassy slag + Fe-oxide ash (hematite/magnetite red-black) + sintered ceramic clinker, vs unburned zone's wet plastic-fiber-paper sludge. Different porosity, different nucleation surfaces.
- **Different element menu:** burn zone is **enriched in Pb, Zn, Cu, Fe, Cr, Ni, Ca**; **depleted in Hg, Cd, As, Sb** (volatilized away). Tire-burn pockets are **Zn-S rich** (ZnS sphalerite-analog crystals plausible). PVC-burn pockets release HCl that drives a chloride brine — chloride-bearing minerals (atacamite, cotunnite, chlorargyrite-analogs) become reasonable.
- **pH/redox flip:** unburned zone is anaerobic, near-neutral, methanogenic; burn zone is alkaline (pH 10–12, ettringite-buffered), oxidized. Same element grows different minerals: Cu in unburned reducing brine → covellite/digenite; Cu in burn zone → tenorite/malachite/atacamite.
- **Hot signature mineralogy:** gehlenite, åkermanite, hematite, magnetite, anorthite, glass — a melilite-clinker assemblage that doesn't appear in cold zones, plus secondary ettringite/gypsum efflorescences as the slag weathers. Visually: red-orange Fe-oxide rinds, white salt blooms, black glassy clinker, vs the unburned zone's grey-brown organic ooze.
