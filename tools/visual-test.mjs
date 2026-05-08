#!/usr/bin/env node
// ============================================================
// tools/visual-test.mjs — headless-browser visual + DOM smoke tests
// ============================================================
//
// Drives index.html through a real Chromium engine (via playwright-core
// + the system Chrome install — no ~300 MB Playwright bundle pulled into
// node_modules) and produces (1) a JSON DOM-diagnostic report and
// (2) PNG screenshots per scenario.
//
// Why this exists: the Claude Preview MCP screenshot endpoint times out
// on Wasteland Crystals' SVG schematic intermittently — every session.
// Switching to direct CDP-driven screenshots eliminates that. Side
// benefit: scriptable test scenarios, asserted dot counts, click +
// examination-panel snapshots, all repeatable from CLI.
//
// Usage:
//   npm run test:visual          → runs the full sweep
//   node tools/visual-test.mjs   → same
//
// Output goes to tools/test-output/ (gitignored — see tools/test-output/.gitignore).
// Prints a Markdown-table summary at the end.
//
// Requires: a running static server serving the repo root. Defaults to
// http://localhost:8736 (the preview server name 'wasteland-crystals'
// in .claude/launch.json). Override with --url=...

import { chromium } from "playwright-core";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "tools", "test-output");

// Default Chrome locations on Windows / macOS / Linux. playwright-core
// drives whichever the OS provides.
const CHROME_CANDIDATES = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
];

function findChrome() {
  for (const p of CHROME_CANDIDATES) {
    if (existsSync(p)) return p;
  }
  return null;
}

// ── CLI args ──
const args = process.argv.slice(2);
function arg(name, fallback) {
  const m = args.find((a) => a.startsWith(`--${name}=`));
  return m ? m.slice(name.length + 3) : fallback;
}
const URL_BASE = arg("url", "http://localhost:8736");
const HEADLESS = arg("headless", "true") !== "false";
const ONLY = arg("only", null); // limit to a single scenario id
const SKIP_SHOTS = args.includes("--no-screenshots");

// ── Scenarios to exercise ──
// id = the dataset.scenario-id on the BEGIN button, or "" for OVERVIEW.
const SCENARIOS = [
  { id: "", label: "overview", title: "OVERVIEW (no scenario)" },
  { id: "mont_saint_guibert", label: "mont_saint_guibert", title: "Mont-Saint-Guibert" },
  { id: "halbenrain", label: "halbenrain", title: "Halbenrain" },
  { id: "bridgeton", label: "bridgeton", title: "Bridgeton — SSR scenario" },
];

// Burn-flagged minerals to exercise on Bridgeton — each gets its own
// click + examination-panel screenshot so the burn narrators are
// directly visible.
const BURN_MINERALS = ["hydrocalumite", "anhydrite", "plumbojarosite", "tinnunculite", "jarosite"];

// ── Helpers ──
async function waitForSpecsReady(page, timeoutMs = 8000) {
  // Poll for scenario-selector buttons existing (proves SCENARIO_SPEC
  // resolved). The boot harness builds the buttons inside an IIFE, so
  // checking for window.SCENARIO_SPEC fails — query the DOM instead.
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await page.evaluate(() => {
      const nav = document.getElementById("scenario-selector");
      return !!(nav && nav.dataset.built === "1" && nav.children.length > 0);
    });
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}

async function clickBeginButton(page, scenarioId) {
  await page.evaluate((id) => {
    const buttons = document.querySelectorAll("#scenario-selector button");
    for (const b of buttons) {
      if (b.dataset.scenarioId === id) { b.click(); return true; }
    }
    return false;
  }, scenarioId);
  // Wait for cell view to be active (or for OVERVIEW: wait for SVG to render).
  await page.waitForFunction(() => {
    const svg = document.querySelector("#schematic-container svg");
    return !!svg;
  }, { timeout: 5000 });
  // Small settling pause so the SVG fully renders before screenshot.
  await new Promise((r) => setTimeout(r, 250));
}

async function returnToTitle(page) {
  await page.evaluate(() => {
    const back = document.getElementById("back-btn");
    if (back) back.click();
  });
  await new Promise((r) => setTimeout(r, 150));
}

async function captureSchematicShot(page, outPath) {
  // Screenshot the schematic container only (cleaner than the whole
  // page; avoids the boot log and examination panel cluttering the
  // image when present).
  const elt = await page.$("#schematic-container");
  if (!elt) return false;
  await elt.screenshot({ path: outPath, type: "png" });
  return true;
}

async function captureFullShot(page, outPath) {
  await page.screenshot({ path: outPath, type: "png", fullPage: true });
  return true;
}

async function diagnostics(page) {
  // Pulls counts and a few sample attrs out of the DOM. Returns a JSON
  // -serializable record for the test report.
  return await page.evaluate(() => {
    function safeAttrs(el, names) {
      if (!el) return null;
      const out = {};
      for (const n of names) out[n] = el.getAttribute(n);
      return out;
    }
    const dots = document.querySelectorAll("circle.dot");
    const byMineral = {};
    const byEventState = { burning: 0, halo: 0, frozen_metastable: 0, none: 0 };
    for (const d of dots) {
      const m = d.getAttribute("data-mineral-id") || "?";
      byMineral[m] = (byMineral[m] || 0) + 1;
      const s = d.getAttribute("data-event-state") || "";
      if (s) byEventState[s] = (byEventState[s] || 0) + 1;
      else byEventState.none++;
    }
    return {
      pageTitle: document.getElementById("page-title")?.textContent ?? null,
      bodyClass: document.body.className,
      svgPresent: !!document.querySelector("#schematic-container svg"),
      eventRings: {
        burning: document.querySelectorAll(".event-burning").length,
        halo: document.querySelectorAll(".event-halo").length,
        frozen: document.querySelectorAll(".event-frozen").length,
      },
      dotCount: dots.length,
      dotsByMineral: byMineral,
      dotsByEventState: byEventState,
      itemCount: document.querySelectorAll(".item-layer rect").length,
      sampleHaloDot: safeAttrs(
        document.querySelector("circle.dot[data-event-state='halo']"),
        ["data-mineral-id", "data-event-id", "data-event-state", "data-host-item-class", "cx", "cy"],
      ),
    };
  });
}

async function exerciseBurnNarrators(page, outDir) {
  // For each burn-flagged mineral on the active scenario, click one of
  // its event-bound dots and screenshot the examination panel + extract
  // the rendered narrative text.
  const results = {};
  for (const m of BURN_MINERALS) {
    const sel = `circle.dot[data-mineral-id='${m}'][data-event-state]:not([data-event-state=''])`;
    const found = await page.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return null;
      el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      return true;
    }, sel);
    if (!found) {
      results[m] = { clicked: false };
      continue;
    }
    await new Promise((r) => setTimeout(r, 120));
    const text = await page.evaluate(() => {
      const panel = document.getElementById("examine-panel");
      if (!panel) return null;
      return {
        zoneLabel: panel.querySelector(".meta")?.textContent.split("|")[0].trim() ?? null,
        paragenesis: panel.querySelector(".paragenesis")?.textContent ?? null,
        precursorRows: Array.from(panel.querySelectorAll(".precursor-row .precursor-source")).map((s) => s.textContent),
        omittedPrecursors: panel.querySelector(".precursor-absent .precursor-absent-list")?.textContent ?? null,
        host: panel.querySelector(".meta .host-none") ? "(no specific host)" : (panel.querySelector(".meta")?.textContent.match(/host:[^|]*/)?.[0] ?? null),
      };
    });
    const shotPath = join(outDir, `bridgeton-narrator-${m}.png`);
    if (!SKIP_SHOTS) {
      await page.screenshot({ path: shotPath, type: "png", fullPage: true });
    }
    results[m] = { clicked: true, ...text, shot: SKIP_SHOTS ? null : `tools/test-output/bridgeton-narrator-${m}.png` };
  }
  return results;
}

// Verify the URL is reachable; if the static server isn't running, surface
// a clear error rather than letting Chromium time out cryptically.
async function checkServer(url) {
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok || res.status === 200;
  } catch {
    return false;
  }
}

// Try to start the static server in the background if it's not running.
// Uses Node's built-in HTTP module — no npx hop, no Windows .cmd spawn
// shenanigans. Serves REPO_ROOT on the requested port. Adequate for this
// test harness (static files only, single client).
async function maybeStartServer(url) {
  if (await checkServer(url)) {
    console.log(`[visual-test] reusing existing server at ${url}`);
    return { close: () => {} };
  }
  console.log(`[visual-test] no server at ${url}, starting one in the background…`);
  const port = parseInt(new URL(url).port || "8736", 10);
  const http = await import("node:http");
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const MIME = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".md": "text/markdown; charset=utf-8",
    ".ts": "text/plain; charset=utf-8",
  };
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent((req.url ?? "/").split("?")[0]);
      if (p === "/") p = "/index.html";
      // Block path traversal.
      if (p.includes("..")) { res.writeHead(403); res.end("forbidden"); return; }
      const full = path.join(REPO_ROOT, p);
      const data = await fs.readFile(full);
      const ext = path.extname(full).toLowerCase();
      res.writeHead(200, { "content-type": MIME[ext] || "application/octet-stream", "cache-control": "no-cache" });
      res.end(data);
    } catch {
      res.writeHead(404); res.end("not found");
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  for (let i = 0; i < 30; i++) {
    if (await checkServer(url)) {
      console.log(`[visual-test] server ready at ${url}`);
      return { close: () => new Promise((r) => server.close(() => r())) };
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  server.close();
  throw new Error(`failed to start static server at ${url}`);
}

// ── Main ──
async function main() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.error("[visual-test] could not locate a Chrome install. Tried:");
    for (const p of CHROME_CANDIDATES) console.error("  - " + p);
    process.exit(2);
  }

  // Reset output dir.
  if (existsSync(OUT_DIR)) await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  // .gitignore so accidental commits don't include the PNGs.
  await writeFile(join(OUT_DIR, ".gitignore"), "*\n!.gitignore\n");

  let serverProc = null;
  try {
    serverProc = await maybeStartServer(URL_BASE);
  } catch (e) {
    console.error("[visual-test]", e.message);
    process.exit(3);
  }

  console.log(`[visual-test] launching ${chromePath} (headless=${HEADLESS}) against ${URL_BASE}`);
  const browser = await chromium.launch({ executablePath: chromePath, headless: HEADLESS });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await context.newPage();

  // Capture page console for the report (filter to error/warning).
  const consoleLines = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleLines.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => consoleLines.push(`[pageerror] ${err.message}`));

  await page.goto(URL_BASE + "/index.html", { waitUntil: "domcontentloaded" });
  const ready = await waitForSpecsReady(page);
  if (!ready) {
    console.error("[visual-test] scenario specs did not resolve in time");
    await browser.close();
    if (serverProc && typeof serverProc.close === "function") await serverProc.close();
    process.exit(4);
  }

  const report = {
    timestamp: new Date().toISOString(),
    url: URL_BASE,
    chrome: chromePath,
    scenarios: {},
    consoleLines,
  };

  for (const sc of SCENARIOS) {
    if (ONLY && sc.label !== ONLY) continue;
    console.log(`[visual-test] scenario: ${sc.label}`);
    await clickBeginButton(page, sc.id);
    const diag = await diagnostics(page);
    const shotName = `scenario-${sc.label}.png`;
    if (!SKIP_SHOTS) {
      await captureFullShot(page, join(OUT_DIR, shotName));
      await captureSchematicShot(page, join(OUT_DIR, `schematic-${sc.label}.png`));
    }
    report.scenarios[sc.label] = {
      title: sc.title,
      diagnostics: diag,
      shot: SKIP_SHOTS ? null : `tools/test-output/${shotName}`,
    };

    // Bridgeton-only: walk the burn narrators.
    if (sc.id === "bridgeton") {
      report.scenarios[sc.label].burnNarrators = await exerciseBurnNarrators(page, OUT_DIR);
    }

    // Return to title before next iteration (skip on the last one).
    if (sc !== SCENARIOS[SCENARIOS.length - 1]) {
      await returnToTitle(page);
    }
  }

  await writeFile(join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  await browser.close();
  if (serverProc && typeof serverProc.close === "function") await serverProc.close();

  // Print a Markdown summary to stdout.
  console.log("");
  console.log("## visual-test summary");
  console.log("");
  console.log("| scenario | dots | rings (B/H/F) | items | svg |");
  console.log("|---|---|---|---|---|");
  for (const [label, s] of Object.entries(report.scenarios)) {
    const d = s.diagnostics;
    const rings = `${d.eventRings.burning}/${d.eventRings.halo}/${d.eventRings.frozen}`;
    console.log(`| ${label} | ${d.dotCount} | ${rings} | ${d.itemCount} | ${d.svgPresent ? "✓" : "✗"} |`);
  }
  if (report.scenarios.bridgeton?.burnNarrators) {
    console.log("");
    console.log("### Bridgeton burn-narrator coverage");
    console.log("");
    console.log("| mineral | clicked | zone label |");
    console.log("|---|---|---|");
    for (const [m, r] of Object.entries(report.scenarios.bridgeton.burnNarrators)) {
      const z = r.zoneLabel ? r.zoneLabel.replace(/^zone:\s*/i, "") : "—";
      console.log(`| ${m} | ${r.clicked ? "✓" : "✗"} | ${z} |`);
    }
  }
  if (consoleLines.length) {
    console.log("");
    console.log(`### console (${consoleLines.length} lines, errors/warnings only)`);
    for (const ln of consoleLines.slice(0, 10)) console.log(`- ${ln}`);
    if (consoleLines.length > 10) console.log(`- … (${consoleLines.length - 10} more in report.json)`);
  }
  console.log("");
  console.log(`output: ${OUT_DIR}`);
  console.log(`screenshots: ${SKIP_SHOTS ? "skipped (--no-screenshots)" : Object.keys(report.scenarios).length + " scenarios + " + (report.scenarios.bridgeton?.burnNarrators ? Object.keys(report.scenarios.bridgeton.burnNarrators).length + " narrators" : "0 narrators")}`);
}

main().catch((e) => {
  console.error("[visual-test] fatal:", e);
  process.exit(1);
});
