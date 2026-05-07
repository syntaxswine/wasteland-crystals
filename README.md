# Wasteland Crystals

A vugg-simulator sibling. Man-made crystals growing on the corpse of
human garbage. Cyberpunk grounded in real anthropogenic-mineral
chemistry.

A landfill, scrapyard, or e-waste pile is the cavity. Galvanized steel,
copper wire, lead-acid batteries, drywall, concrete, glass, plastic —
these are the host "rocks." Leachate is the fluid. The crystals that
nucleate are real anthropogenic minerals: goslarite on rusted
galvanizing, malachite on copper wire, anglesite on battery posts,
ettringite needles in collapsed concrete, struvite on organic-rich
slurry. The post-2000 explosion of new minerals in industrial-waste
sites is real, documented, and beautiful in a cyberpunk way that no
fantasy-mineralogy game has touched.

The Anthropocene has a real mineralogy. This game makes it visible.

---

## Status

🚧 **Empty repo, ready for the receiving agent.** The canonical
proposal lives at [`proposals/PROPOSAL-WASTELAND-CRYSTALS.md`](proposals/PROPOSAL-WASTELAND-CRYSTALS.md).

That document is the handoff: it's a self-contained brief for the
agent (or human) starting this project. It covers the concept, the
real anthropogenic mineralogy with citations, the vugg → wasteland
translation table, what to fork from vugg-simulator and what to
build fresh, the bootstrap sequence, the cross-section map view
design, the cyberpunk aesthetic direction, and a priority-ordered
reading list.

---

## Reference: vugg-simulator

This project is a fork-and-modify derivative of
[vugg-simulator](https://github.com/Syntaxswine/vugg-simulator).
The vugg-simulator codebase has 60+ SIM_VERSION iterations of
crystal-growth chemistry, a per-cell shader-clipped Three.js
renderer, host-rock architecture (Mechanic 5), a deterministic
test/baseline pattern, and a TS-to-single-HTML build pipeline.
Most of it ports directly; see the proposal for the full reuse plan.

The vugg-simulator canonical fork is at
[StonePhilosopher/vugg-simulator](https://github.com/StonePhilosopher/vugg-simulator).
This Wasteland Crystals repo follows the same workflow: development
on Syntaxswine, the boss promotes to StonePhilosopher when canonical.

---

## Concept in three sentences

Modern landfills are reactors: rainwater + soil CO₂ + organic
decomposition produces leachate, leachate reacts with consumer
civilization's discarded contents, and what crystallizes back out is
a small zoo of post-natural minerals. The game models this as a
chemistry-true crystal-growth simulator (engine ported from
vugg-simulator) with a cross-section schematic for the map view (cap
→ sealing layer → waste cell → liner → leachate detection → water
table, like a textbook secure-landfill diagram). The player loads a
locality (Fresh Kills 1995-2001, Agbogbloshie 2018, etc.), sets the
contents and the leachate, and watches the Anthropocene crystallize.

---

## Reading order for the receiving agent

1. [`proposals/PROPOSAL-WASTELAND-CRYSTALS.md`](proposals/PROPOSAL-WASTELAND-CRYSTALS.md) — this repo's design brief
2. [vugg-simulator/ARCHITECTURE.md](https://github.com/Syntaxswine/vugg-simulator/blob/main/ARCHITECTURE.md) — overall structure pointer
3. [vugg-simulator/js/README.md](https://github.com/Syntaxswine/vugg-simulator/blob/main/js/README.md) — module index
4. [vugg-simulator/js/15-version.ts](https://github.com/Syntaxswine/vugg-simulator/blob/main/js/15-version.ts) — last 15 SIM_VERSION entries (read these to understand the engine's accumulated learning)
5. [vugg-simulator/proposals/PROPOSAL-HOST-ROCK.md](https://github.com/Syntaxswine/vugg-simulator/blob/main/proposals/PROPOSAL-HOST-ROCK.md) — Mechanic 5, the parent design

The proposal in this repo lays out the full bootstrap sequence after
that.

---

## License

TBD — same as vugg-simulator (which is currently unlicensed; the boss
will set this for both projects).
