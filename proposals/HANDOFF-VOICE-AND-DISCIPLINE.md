# HANDOFF — Voice and Discipline

**Audience:** the next contributor (human or agent) who adds a mineral
narrator, an evidence_level entry, a precursor, or a scenario to
Wasteland Crystals.

**Author:** Claude, after reading the v0–v7 work. **Date:** 2026-05-07.

**Why this exists:** the codebase as of v7 has unusually high prose
discipline — eight authored narrators, an evidence-level ladder, a
precursor-origin hedging system, and a citation pedigree that
distinguishes peer-reviewed landfill papers from broader geological
analogs. **All of this is fragile.** Drift is silent: the next author
calibrates against whatever's currently in the file, and one
under-disciplined narrator becomes the implicit standard. This
document captures the rules-by-example so re-anchoring is possible
even after weeks of inactivity or a context compaction.

---

## The voice

The narrators write in what the proposal calls **clinical-Borges
register**. Five rules, each illustrated with a phrase extracted from
the v6 corpus.

### 1. Third-person observational. No game framing, no second-person.

The future-miner is reading a quarterly survey report, not a tutorial.

> "Goslarite isn't a stable phase — it crystallizes seasonally as
> pore waters concentrate during dry intervals, redissolves with the
> next rain, recrystallizes again."  
> — `_narrateGoslarite`, [04-narrators.ts:253](js/04-narrators.ts)

Never "you find," "you'll see," "the player can." Never "amazing,"
"beautiful," "fascinating." The mineral does what it does; the prose
records.

### 2. Closer-as-aphorism. End the paragraph with a sentence that
reframes what just happened.

This is the Borges pattern. The closer compresses the paragraph into
a register-shift — from the mechanical to the contemplative.

> "The cell ends its chemistry as it began geologically: in
> carbonate." — `_narrateCalcite`

> "Diagenesis re-making the same mineral in eight decades that
> geologic systems make in eight thousand." — `_narrateMalachite`

> "Fortuitous chemistry, fully assembled by accident." —
> `_narratePyromorphite`

> "The acicular efflorescent crust pulses rather than accumulates,
> marking the cell's seasonal evaporation cycle on every rusting
> galvanized surface." — `_narrateGoslarite`

> "Chemistry trapped in transit." — `_narrateAnglesite`

The closer is what makes the prose feel earned. A narrator without
one reads as data; a narrator with one reads as observation.

### 3. Causal chain, not catalog. Origins → mobilization → transport
→ reprecipitation.

Every paragenesis is a *story of where the atoms came from*, in
order. The boss's framing 2026-05-07: "acids from x broke down the
copper from x which redeposited and formed malachite."

> "Battery-electrolyte sulfuric acid dissolved the lead plates of
> the lead-acid relics into the acidogenic-phase pore water. The
> methanogenic core then ran for two decades — sulfate-reducers
> consumed residual SO₄, kept dissolved Pb mobile, and let it
> migrate downward through the cell's wall-drainage path. At
> Mont-Saint-Guibert's basal stable horizon, food-waste phosphate
> [...] converged on the lingering Pb²⁺." — `_narratePyromorphite`

Source acid → metal liberation → phase that maintains mobility →
transport path → reprecipitation site. This shape is the spine of
every narrator. New narrators should follow it.

### 4. Hedge by basis, never by tone.

The narrator is *certain* about whatever it claims. When a precursor
comes from an `implied_typical_msw` substrate, the prose adds
**"likely"** — not "probably" or "perhaps" or "may have." The hedge
language is structurally tagged, not stylistically softened.

> "[...] food-waste phosphate, **likely** PVC-decay chloride, and
> concrete-derived calcium converged [...]" — `_narratePyromorphite`
> at MSG, where `pvc_plastic` is `implied_typical_msw` but
> `organic_slurry` and `concrete_demolition` are `documented`.

This is enforced in code: `_phrase` in [04-narrators.ts:110](js/04-narrators.ts)
prepends `likely ` for `implied_typical_msw` precursors. Don't write
hedges in the prose template — let the function do it. Stylistic
hedges in prose ("the leachate may have," "perhaps the battery")
collapse the documented/implied distinction.

### 5. Cite the locality by name when the chemistry is observed there.

When a phase is `directly_observed` at the scenario's locality, name
the locality and the paper. When it's `predicted`, don't fabricate.

> "ZnS precipitated as resinous-luster tetrahedra coating the
> surviving Fe-Zn alloy fragments. Garcia Lopez's SEM-EDS catalog
> from Mont-Saint-Guibert reports the same texture in its <4.5 mm
> fines [...]" — `_narrateSphalerite`

> "Garcia Lopez does not name anglesite specifically in the
> Mont-Saint-Guibert characterization, but the metallic-Pb relics
> they observed under SEM imply this phase was a necessary stage
> in the Pb's pre-pyromorphite history at [the cell]." —
> `_narrateAnglesite`

The second pattern — "the paper doesn't name this phase, but the
chemistry implies it had to occur" — is acceptable when grounded in
a cited adjacent observation. Pure prediction without that grounding
is the fallback templater's job, not an authored narrator's.

---

## The disciplines

Three structural rules that protect the catalog's epistemic integrity.

### Discipline 1 — Evidence_level honesty

Every entry in `data/minerals.json` declares an `evidence_level`:

| Level | Means |
|-------|-------|
| `landfill_specific` | Peer-reviewed paper from a real landfill, LCS scaling site, landfill-mining excavation, or MSWI bottom ash characterization. The strongest tier. |
| `anthropogenic_documented` | Hazen 2017 catalog or similar; well-documented at industrial / anthropogenic sites generally, but not specifically reported from a landfill. |
| `geological_analog` | Well-documented in natural geological settings (supergene Cu zones, AMD, biogenic marine sediments) where the chemistry is directly applicable. |
| `chemistry_predicted` | Chemistry-grounded prediction with no direct documentation in any context. |

**The rule:** if you can't find a primary citation for the
appropriate tier, demote the entry. Do not promote on the basis of
"surely it forms there." `chemistry_predicted` is honest and useful;
overclaim is corrosive.

The v1 → v2 catalog audit re-evaluated every v1 entry under stricter
rules and **demoted several** from documented to anthropogenic_documented
or chemistry_predicted because Hazen 2017's *catalog presence* is not
the same as a peer-reviewed landfill case study. Future expansions
should preserve this discipline. Audit the new entry under the same
microscope. The audit_summary distribution
(7 landfill_specific / 9 anthropogenic_documented / 4 geological_analog /
3 chemistry_predicted as of v2) is the catalog's epistemic shape.
Drift it carefully.

### Discipline 2 — Precursor-origin hedging

Every precursor token in `data/precursors.json` carries a
`source_substrate` that must match a `scenarios.json`
`substrate_inventory` token. The narrator joins
`mineral.decay_precursor ∩ PRECURSOR_SPEC ∩ scenario.substrate_inventory`
and only names origins from that intersection. The
`evidence_basis` field on substrate_inventory entries
(`documented` | `implied_typical_msw`) drives the `likely` hedge.

**The rule:** never bypass the join. Never write a narrator that
names a substrate without checking it's in the active scenario's
inventory. Never write a substrate_inventory entry as `documented`
when the cited paper does not characterize it specifically — that's
what `implied_typical_msw` exists for.

Example: Mont-Saint-Guibert's `pvc_plastic` substrate is tagged
`implied_typical_msw` because Garcia Lopez et al. *Detritus* 8
characterized the <4.5 mm fines in detail but did not enumerate the
PVC content explicitly. The narrator therefore says *"likely
PVC-decay chloride"* — chemistry-true, evidence-honest. If a future
contributor flips that flag to `documented` without a paper that
specifically counts the PVC, the prose loses its hedge silently and
the catalog's integrity drops.

### Discipline 3 — Citation pedigree

`data/minerals.json` `citations` entries use short form
(`Author Year Journal Vol:Page` or `Author Year doi:...`).
The full bibliographic form lives in
`research/landfill-chemistry-and-fires.md`. **Both must agree.**

When adding a citation:
- The short form goes on the mineral entry.
- The full form (with DOI or URL, ideally) goes in the research doc.
- If the source is an ELFM paper, locality, or program synthesis,
  it likely belongs in `scenarios.json` source notes too.

Don't cite a paper you haven't read. The catalog's quality of
authority compounds with every honest citation and craters with one
fabricated one.

---

## Annotated example: how `_narrateMalachite` does it right

```ts
function _narrateMalachite(_scenario, _zoneId, available) {
  const acids = _phraseAny(["drywall_sulfate", "organic_co2"], available);
  const copper = _phrase("copper_wiring_dissolution", available);
  const carbonate = _phraseAny(["cement_calcite", "concrete_calcite"], available);

  // Origins: the function asks "is this precursor in this cell's inventory?"
  // before naming it. If not, fall through to a generic phrasing.
  const acidsClause = acids
    ? `${acids.charAt(0).toUpperCase() + acids.slice(1)} attacked`
    : `The cell's acidic leachate attacked`;
  const copperClause = copper
    ? `the copper wiring buried in PCBs and motor stator coils, mobilizing ${copper}`
    : `buried copper wiring, mobilizing Cu²⁺ into the leachate`;
  const carbonateClause = carbonate
    ? `${carbonate} — a direct contribution from the C&D fraction's slow concrete dissolution —`
    : `late-stage carbonate from the cell's mature alkalinizing chemistry —`;

  // Causal chain: acids attacked copper → mobilized → migrated → met
  // carbonate → reprecipitated. Closer reframes (deep-time analogy).
  return `${acidsClause} ${copperClause}. The Cu²⁺ migrated through the
cell's wall-drainage path, where chemistry transitions fast enough to
escape the methanogenic core's sulfide trap. Where the dissolved Cu
met carbonate-rich pore water — ${carbonateClause} botryoidal
malachite stabilized as the green metal-stain familiar from natural
supergene zones. Diagenesis re-making the same mineral in eight
decades that geologic systems make in eight thousand.`;
}
```

Five things to notice:

1. **Each precursor is looked up before being named.** `_phrase`
   and `_phraseAny` return `null` if the substrate isn't in the
   active inventory.
2. **Fallback prose preserves the chemistry but loses the citation.**
   The `else` branches generalize ("the cell's acidic leachate") so
   the narrator doesn't fabricate a substrate origin.
3. **Causal chain is explicit:** acids → attack → mobilize → migrate
   → escape sulfide trap → meet carbonate → reprecipitate.
4. **Geological analogy in the body** ("the green metal-stain
   familiar from natural supergene zones") connects the
   anthropogenic chemistry to its natural counterpart.
5. **Closer is the deep-time aphorism.** Eight decades vs eight
   thousand years — the line writes itself in retrospect, but it's
   the line that makes the paragraph feel earned.

When you write a new narrator, structure it the same way. The closer
is hard to write well — give it a few drafts.

---

## Anti-patterns

### "The leachate is rich in..."

Compositional setup without source attribution is a tell that the
narrator skipped the precursor join. Every chemistry attribution
should name a substrate (when documented) or use the fallback
phrasing (when not). "The leachate is rich in chloride" is bad;
"PVC-decay chloride attacked the galvanized substrate" is good.

### Tone-hedges instead of basis-hedges

"The phosphate may have come from food waste" is wrong. Either
food_phosphate is in the inventory (then it's "food-waste phosphate"
or "likely food-waste phosphate" depending on basis), or it isn't
(then don't claim it). Don't smuggle uncertainty into prose tone.

### Promotional adjectives

"Beautiful," "stunning," "remarkable," "amazing." The prose works
because it doesn't reach for these. The closing aphorism does the
emotional work; the body keeps it cool.

### "The player," "you can"

The narrator is not addressing the player. It is a survey report.
If you find yourself writing "you'll see," delete the sentence and
restate as observation.

### Pure prediction prose

If the mineral entry is `chemistry_predicted` evidence_level and the
scenario's `expected_species` role is `predicted`, the narrator
should NOT pretend the phase has been seen at the locality. Either
fall through to the fallback templater (which honestly says
"reconstructed from precursor-origin data, not from observation"),
or write a narrator that's explicit about prediction:
*"the chemistry would deliver this phase if [precondition], but
the cell as inventoried does not yet supply the prerequisite."*

---

## Checklist for adding a new mineral narrator

Before authoring `_narrateNewMineral`:

- [ ] Mineral has an entry in `data/minerals.json` with
      `evidence_level`, citations, and `decay_precursor` array.
- [ ] Every token in `decay_precursor` exists in
      `data/precursors.json` with a `source_substrate` and a
      `narrator_phrase_short`.
- [ ] At least one scenario in `scenarios.json` has an
      `expected_species` entry for the new mineral with an
      `evidence_role`.
- [ ] You have read at least one of the cited papers, or can
      defend the citation tier honestly.

Authoring the function:

- [ ] Look up each precursor with `_phrase` or `_phraseAny`.
      Branch when null. Never name a substrate without lookup.
- [ ] Open the paragraph with the source-acid clause.
- [ ] Build the causal chain: liberation → mobility → transport →
      reprecipitation.
- [ ] Reference the locality if the phase is `directly_observed`
      there; reference the cited paper.
- [ ] Close with an aphorism. Reframe what the chemistry is, in one
      line. Drafts are normal — the first version of the closer is
      almost never the right one.
- [ ] Add the case to the `narrateCrystal` dispatch switch.

Reviewing your own narrator:

- [ ] No second-person, no game framing.
- [ ] No promotional adjectives.
- [ ] All hedges are basis-driven (the `likely` from `_phrase`),
      not tone-driven.
- [ ] The closer compresses the paragraph rather than restating it.
- [ ] If you removed the closer, the paragraph would still parse
      as data — the closer is doing the register-shift work.

---

## Two short forward-looking notes

### Burn zones — when the chemistry-overlay lands

The zones JSON correctly notes that *"Burn zones are NOT a
position-class entry — fires happen wherever they happen, so burn
chemistry will be a separate per-scenario overlay."* When this is
implemented, the natural pattern (cribbed from vugg-simulator's
event system) is:

- Burn-zone events declared at `scenarios.json:events[]`, with a
  trigger step, a spatial extent (tile coordinates), and a duration.
- During the burn, the affected tiles' chemistry overrides to
  `burn_zone` phase (alkaline, oxidizing, hot).
- After the burn, an alteration ring (`burn_halo` chemistry —
  HCl-rich brine adjacent) persists for some duration.
- Burn-specific minerals (hydrocalumite, plumbojarosite, tinnunculite)
  gate on `chemistry_phase: ["burn_zone"]` or `["burn_halo"]`.

This composes cleanly with the existing zone × substrate × chemistry
gate. Burn becomes a fourth axis (zone × substrate × chemistry ×
event-overlay) that's mostly inactive (no event running) and
locally dominant when triggered.

The narrator pattern for burn-derived phases: **emphasize event
sequence over steady-state**. Hydrocalumite's narrator should open
with the fire — "where the cell's surface fire reached the buried
concrete fragments, calcium-aluminate hydrates flashed to
chloride-substituted variants" — not with steady-state chemistry.

### First growth engine — when chemistry math lands

The data spines are remarkable but no growth math runs yet. When
the engine arrives, the proposal recommendation stands: **start
with goslarite**. It's the simplest case in the catalog —
`acid` phase, single-substrate (`galvanized_steel`), single
chemistry-flip (Zn²⁺ + SO₄²⁻ → ZnSO₄·7H₂O), seasonal pulse rather
than steady accumulation. If goslarite renders correctly as a
pulsing acicular efflorescence on a buried fence-wire fragment,
the engine's data plumbing is proven and every other mineral is
content.

The vugg-simulator pattern to crib for the first engine:
`grow_quartz` in `js/89-engines-silicate.ts` — a single function
that takes (crystal, conditions, step), checks supersaturation
gates against required_ingredients, debits mass balance via
`zone.thickness_um`, returns the growth zone. Map straight across
to `grow_goslarite` reading from the active zone's chemistry,
gated by the cell's substrate inventory. ~50 lines, plus mass
balance, plus a baseline test. The vugg `tests-js/calibration.test.ts`
pattern ports verbatim — bump `WASTELAND_VERSION` to v8 when the
first engine produces deterministic seed-42 output.

---

## A note on what's already correct

Most of what's worth saying about Wasteland Crystals as of v7 is in
the work itself, not in this document. The version log
(`js/15-version.ts`) reads like a paper. The minerals JSON's
`_audit_summary` self-reports its epistemic distribution. The
narrator file is eight functions of careful prose.

This handoff exists not because the work is wrong but because the
work is *unusually right* for this kind of project, and the
disciplines that made it right are easy to lose if no one names
them out loud.

Preserve them. They compound.
