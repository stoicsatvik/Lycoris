// Mars Atlas web app: state, routing between pages, events, map fitting and the guide.
import { CRATERS, DEFAULT_STATE, computePlan, craterComparison, extraRecords, loadTerrain } from "./plan.js";
import { calcView, claireView, craterView, dataView, gateView, mapView } from "./views.js";
import { journeyView, startJourney } from "./journey.js";
import { claireRate, columnMass } from "./engine/index.js";

const GUIDE_API = "https://mars-atlas-backend.vercel.app/api/chat";
const view = document.getElementById("view"), app = document.getElementById("app");
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } } };
const session = { get(k) { try { return sessionStorage.getItem(k); } catch { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch { /* ignore */ } } };

let terrain = null, P = null, error = null, stopJourney = null;
let S = { ...DEFAULT_STATE, ...(store.get("atlas-plan") ?? {}) };
const ui = { dirty: false, tab: "work", ai: {}, craterId: null, gateOk: session.get("claire-ok") === "1", loadedAt: new Date().toISOString().slice(0, 16).replace("T", " ") + " UTC" };

function recompute() {
  try { P = computePlan(terrain, S); error = P.error ?? null; if (P.error) P = null; else P.allCraters = CRATERS; }
  catch (e) { console.error(e); error = `Could not plan this route: ${e.message}`; P = null; }
  ui.dirty = false; ui.ai = {}; store.set("atlas-plan", S);
}

function records() {
  const recs = {}, [d, t] = extraRecords(P);
  recs.distance = d; recs.duration = t;
  const n = P.plan.result.people.length;
  P.plan.records.forEach((r, i) => { recs[i < n ? `o2-${i}` : i === n ? "dose" : "claire"] = r; });
  return recs;
}

function claireRows() {
  const tl = P.plan.result.timeline, R = P.plan.result.params, Xref = columnMass(R.pressureRefPa, R.gMars);
  const pick = [["Start", tl[0]], ["Warmest", tl.reduce((a, b) => (b.airTempC > a.airTempC ? b : a))], ["Coldest", tl.reduce((a, b) => (b.airTempC < a.airTempC ? b : a))], ["End", tl.at(-1)]];
  const seen = new Set();
  return pick.filter(([, p]) => !seen.has(p.tH) && seen.add(p.tH)).map(([label, p]) => {
    const Tref = P.env(p.hour).dailyMeanTempC;
    const cl = claireRate({ doseRef: R.doseRefMGyPerH, X: columnMass(p.pressurePa, R.gMars), Xref, muC: R.claireMu, betaT: R.claireBetaT, T: p.airTempC, Tref }) * R.qGCR;
    return { label, hour: p.hour, T: p.airTempC, dT: p.airTempC - Tref, std: p.doseRateMGyPerH * R.qGCR, cl };
  });
}

function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, "").split("/");
  return { name: name || "map", arg };
}

function render() {
  stopJourney?.(); stopJourney = null;
  const { name, arg } = route();
  const immersive = name === "journey" || name === "claire-gate";
  app.classList.toggle("immersive", immersive);
  document.querySelectorAll("[data-nav]").forEach((a) => a.toggleAttribute("aria-current", a.dataset.nav === name || (a.dataset.nav === "claire" && name.startsWith("claire"))));
  document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("on", a.hasAttribute("aria-current")));
  if (!terrain) return;
  if (name === "claire-gate") { view.innerHTML = gateView(ui.gateOk); return; }
  if (name === "data") { view.innerHTML = dataView(); return; }
  if (!P) { view.innerHTML = `<header class="top"><h1>Mission map</h1></header><div class="body"><div class="err-msg">${error ?? "No route yet."}</div><a class="btn" href="#/map" data-act="reset">Reset to the sample route</a></div>`; return; }
  if (name === "claire" && !ui.gateOk) { location.replace("#/claire-gate"); return; }
  if (name === "craters") {
    const options = P.route.craters;
    const pick = options.find((c) => c.crater.id === ui.craterId) ?? options[0];
    view.innerHTML = craterView(P, pick ? craterComparison(P, pick.crater) : null);
  } else if (name === "journey") {
    view.innerHTML = journeyView(P); stopJourney = startJourney(P, view);
  } else if (name === "calc") {
    const recs = records(), key = recs[arg] ? arg : "dose";
    view.innerHTML = calcView(P, recs, key, ui);
    if (ui.tab === "ai" && ui.ai[key] == null) askGuide(recs[key], key);
  } else if (name === "claire") {
    view.innerHTML = claireView(P, claireRows());
  } else {
    view.innerHTML = mapView(P, S, ui);
  }
  requestAnimationFrame(fitMaps);
}

async function askGuide(rec, key) {
  ui.ai[key] = "Asking the guide…";
  try {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 30000);
    const res = await fetch(GUIDE_API, { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
      body: JSON.stringify({ question: "Explain this calculation in precise detail.", facts: { calculationRecord: rec, rule: "Quote the record's numbers exactly. Do not calculate new numbers." }, history: [] }, (k, v) => (typeof v === "number" ? +v.toPrecision(4) : v)) });
    const data = await res.json();
    clearTimeout(timer);
    if (!res.ok || !data.reply) throw new Error(data.error || `HTTP ${res.status}`);
    ui.ai[key] = data.reply;
  } catch {
    ui.ai[key] = "Explanation unavailable: the guide is offline. The worked calculation tab shows the full saved working.";
  }
  if (route().name === "calc") render();
}

// ---------- map fitting, zoom and drag ----------
const ASPECT = 4096 / 3879;
function fitMaps() {
  view.querySelectorAll(".map[data-fit]").forEach((m) => {
    const [x0, y0, x1, y1] = JSON.parse(m.dataset.fit), w = m.clientWidth, h = m.clientHeight;
    const imgW = Math.min(w / ((x1 - x0) / 100), (h * ASPECT) / ((y1 - y0) / 100));
    m._v = { imgW, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, base: imgW };
    place(m);
    if (!m._drag) bindDrag(m);
  });
}
function place(m) {
  const { imgW, cx, cy } = m._v, imgH = imgW / ASPECT, img = m.querySelector(".img");
  img.style.width = `${imgW}px`; img.style.height = `${imgH}px`;
  img.style.left = `${m.clientWidth / 2 - (cx / 100) * imgW}px`; img.style.top = `${m.clientHeight / 2 - (cy / 100) * imgH}px`;
}
function bindDrag(m) {
  m._drag = true;
  let start = null;
  m.addEventListener("pointerdown", (e) => { if (e.target.closest("button, a")) return; start = { x: e.clientX, y: e.clientY, cx: m._v.cx, cy: m._v.cy }; m.setPointerCapture(e.pointerId); m.classList.add("dragging"); });
  m.addEventListener("pointermove", (e) => { if (!start) return; m._v.cx = start.cx - ((e.clientX - start.x) / m._v.imgW) * 100; m._v.cy = start.cy - ((e.clientY - start.y) / (m._v.imgW / ASPECT)) * 100; place(m); });
  const end = () => { start = null; m.classList.remove("dragging"); };
  m.addEventListener("pointerup", end); m.addEventListener("pointercancel", end);
}
let resizeT; window.addEventListener("resize", () => { clearTimeout(resizeT); resizeT = setTimeout(fitMaps, 120); });

// ---------- events ----------
view.addEventListener("click", (e) => {
  const calcBtn = e.target.closest("button.calc[data-rec]");
  if (calcBtn) { ui.tab = "work"; location.hash = `#/calc/${calcBtn.dataset.rec}`; return; }
  const b = e.target.closest("[data-act]"); if (!b) return;
  const act = b.dataset.act;
  if (act === "zoom") {
    const m = b.closest(".map"); const k = +b.dataset.k;
    m._v.imgW = k ? Math.max(m._v.base * 0.5, Math.min(m._v.base * 8, m._v.imgW * k)) : m._v.base;
    if (!k) { const [x0, y0, x1, y1] = JSON.parse(m.dataset.fit); m._v.cx = (x0 + x1) / 2; m._v.cy = (y0 + y1) / 2; }
    place(m);
  }
  if (act === "add-stop") { S.stops.push({ id: "kodiak", min: 20 }); ui.dirty = true; render(); }
  if (act === "rm-stop") { S.stops.splice(+b.dataset.i, 1); ui.dirty = true; render(); }
  if (act === "ret") { S.ret = b.dataset.v; ui.dirty = true; render(); }
  if (act === "recalc") { e.preventDefault(); recompute(); render(); }
  if (act === "reset") { S = structuredClone(DEFAULT_STATE); recompute(); render(); }
  if (act === "rec") { location.hash = `#/calc/${b.dataset.k}`; }
  if (act === "tab") { ui.tab = b.dataset.v; render(); }
  if (act === "enter-claire") { session.set("claire-ok", "1"); location.hash = "#/claire"; }
});
view.addEventListener("submit", (e) => { e.preventDefault(); recompute(); render(); });
view.addEventListener("change", (e) => {
  const el = e.target;
  if (el.dataset.act === "gate-ok") { ui.gateOk = el.checked; session.set("claire-ok", el.checked ? "1" : "0"); view.querySelector('[data-act="enter-claire"]').disabled = !el.checked; return; }
  if (el.hasAttribute("data-field-crater")) { ui.craterId = el.value; render(); return; }
  if (el.dataset.field) { S[el.dataset.field] = el.value; ui.dirty = true; }
  if (el.dataset.stop != null) { S.stops[+el.dataset.stop][el.dataset.k] = el.dataset.k === "min" ? Math.max(0, +el.value || 0) : el.value; ui.dirty = true; }
  if (ui.dirty && (el.tagName === "SELECT" || el.type === "date" || el.type === "time")) render();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && route().name === "claire-gate") location.hash = "#/map"; });
window.addEventListener("hashchange", () => { render(); view.focus({ preventScroll: true }); window.scrollTo(0, 0); });

(async function boot() {
  try {
    terrain = await loadTerrain();
    recompute();
  } catch (e) { console.error(e); error = `Could not load the terrain data: ${e.message}`; terrain = terrain ?? {}; }
  render();
})();
