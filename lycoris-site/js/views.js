// Page templates. Each returns HTML for the main area from the current plan (P) and inputs (S).
import { KM_PER_X, KM_PER_Y, SOURCES } from "./terrain/places.js";
import { DEFAULTS } from "./engine/index.js";
import { LOCAL, placeById } from "./plan.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const f = (x, d = 1) => (x == null || !Number.isFinite(x) ? "—" : Number(x).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d }));
export const fmtH = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")} min`; };
export const clock = (h) => { const m = Math.round((((h % 24) + 24) % 24) * 60); return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
const calc = (rec, text, cls = "") => `<button class="calc ${cls}" data-rec="${rec}" title="Open the calculation">${text}</button>`;
const kindClass = { measured: "me", model: "mo", assumed: "as", entered: "en", "not modelled": "nm" };
export const badge = (kind, label) => `<span class="pv ${kindClass[kind] ?? "mo"}">${esc(label ?? kind)}</span>`;
const STATUS = { pass: ["pass", "Pass"], fail: ["fail", "Fail"], undetermined: ["und", "Undetermined"] };
const status = (s, label) => `<span class="st ${STATUS[s][0]}">${esc(label ?? STATUS[s][1])}</span>`;
const OC = { "WITHIN ENTERED LIMITS": ["ok", "Within entered limits", "Every required check passes under the stated assumptions."],
  "NO-GO": ["nogo", "No-go", "A required check failed."], UNDETERMINED: ["undet", "Undetermined", "A required check lacks information."] };

export function outcomeBlock(outcome, checks, compact = false) {
  const [cls, title, sub] = OC[outcome];
  const reason = outcome === "NO-GO" ? checks.find((c) => c.status === "fail") : outcome === "UNDETERMINED" ? checks.find((c) => c.status === "undetermined" && /Terrain|EVA|Daylight|Oxygen|cosmic/.test(c.name)) : null;
  return `<div class="oc ${cls}"${compact ? ' style="padding: 12px"' : ""}><h3${compact ? ' style="font-size: 16px"' : ""}>${title}</h3>
    <p style="margin-top: 8px; color: var(--text-2)">${sub}</p>
    <p style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); font-size: 12px">${reason ? `${esc(reason.name)}: ${esc(reason.detail)}` : "This model cannot establish that this journey is safe."}</p></div>`;
}

// ---------- map ----------
export function mapFrame(P, { box, height = 640, label, craters = "route", pins = true, route = true, extra = "", layers = false }) {
  const pts = P.route.points;
  const line = pts.map((p) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(" ");
  const ring = (c, strong) => `<ellipse cx="${c.x}" cy="${c.y}" rx="${(c.diameterM / 2000 / KM_PER_X).toFixed(3)}" ry="${(c.diameterM / 2000 / KM_PER_Y).toFixed(3)}" fill="rgba(232,121,63,${strong ? 0.14 : 0.06})" stroke="#E8793F" stroke-width="${strong ? 1.6 : 1}" stroke-dasharray="${strong ? "5 4" : "3 4"}" vector-effect="non-scaling-stroke"/>`;
  const near = new Set(P.route.craters.map((c) => c.crater.id));
  const list = craters === "all" ? P.allCraters : P.route.craters.map((c) => c.crater);
  const ids = [P.places[0].id, ...P.state.stops.map((s) => s.id), P.places.at(-1).id];
  const placePins = pins ? LOCAL.map((p) => {
    const idx = ids.indexOf(p.id), isStart = idx === 0, isDest = idx === ids.length - 1, isStop = idx > 0 && !isDest;
    const cls = isStart || p.type === "base" ? "pin base" : isStop || isDest ? "pin stop" : "pin";
    const style = idx === -1 ? "background: #8296B3;" : "";
    const sub = isStart ? `start · ${clock(P.input.startHour)}` : isStop ? `stop · ${P.state.stops[idx - 1].min} min` : isDest ? "destination" : "";
    return `<span class="${cls}" style="left: ${p.x}%; top: ${p.y}%; ${style}"></span><span class="tag" style="left: ${p.x}%; top: ${p.y}%">${esc(p.name)}${sub ? `<small>${sub}</small>` : ""}</span>`;
  }).join("") : "";
  return `<section class="map" data-fit='${JSON.stringify(box)}' aria-label="${esc(label)}" style="flex: 1 1 auto; width: 100%; min-width: 0; min-height: ${height}px">
    <div class="img">
      <img src="img/jezero-terrain.webp" alt="Orbital image of Jezero Crater (ESA/DLR/FU Berlin, HRSC)">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        ${list.map((c) => ring(c, near.has(c.id))).join("")}
        ${route ? `<polyline points="${line}" fill="none" stroke="#070C17" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" opacity=".55"/><polyline points="${line}" fill="none" stroke="#3FB6F2" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>` : ""}
      </svg>
      ${placePins}
      ${extra}
    </div>
    <div class="shade"></div>
    <div class="mapbtns"><button data-act="zoom" data-k="1.4" aria-label="Zoom in">+</button><button data-act="zoom" data-k="0.714" aria-label="Zoom out">−</button><button data-act="zoom" data-k="0" aria-label="Fit route" style="font-size: 11px">FIT</button></div>
  ${layers ? `<div class="layer-switch" role="group" aria-label="Map layer"><button data-act="layer" data-v="photo" aria-pressed="true">Photo</button><button data-act="layer" data-v="relief" aria-pressed="false">Colour relief</button></div><div class="relief"></div>` : ""}
  </section>`;
}
export function routeBox(P, pad = 2.5) {
  const xs = P.route.points.map((p) => p.x), ys = P.route.points.map((p) => p.y);
  return [Math.min(...xs) - pad, Math.min(...ys) - pad, Math.max(...xs) + pad, Math.max(...ys) + pad];
}

// ---------- 1. mission map ----------
export function mapView(P, S, ui) {
  const r = P.plan.result, u = P.plan.uncertainty?.summary, o2 = r.people.reduce((a, m) => a + m.o2UsedL, 0);
  const decided = P.plan.checks.filter((c) => c.status !== "undetermined").length;
  const opt = (sel) => LOCAL.map((p) => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("");
  const crossing = P.crossing[0]?.crater;
  const t = r.timeline, temps = t.map((x) => x.airTempC);
  const pres = t.map((x) => x.pressurePa).reduce((a, b) => a + b, 0) / t.length;
  const rate = t.map((x) => x.doseRateMGyPerH).reduce((a, b) => a + b, 0) / t.length * r.params.qGCR;
  const missing = (key, label, unit, ph) => {
    const v = S[key]; const has = v !== "" && v != null;
    return `<div class="fld"><div style="display: flex; justify-content: space-between; align-items: center"><label class="lbl" for="f-${key}">${label}</label>${has ? badge("entered", "Entered") : badge("not modelled", "Not entered")}</div>
      <input class="inp num${has ? "" : " miss"}" id="f-${key}" data-field="${key}" inputmode="decimal" value="${esc(v)}" placeholder="${ph}"></div>`;
  };
  return `
  <header class="top"><h1>Mission map</h1><span class="chip sim">Simulation</span>
    <span class="meta"><b>${esc(S.date)}</b> · Ls ${f(P.env(12).ls, 1)}° · ${esc(P.env(12).season)}</span><span class="meta">Jezero <b>18.44° N 77.45° E</b></span><span class="meta">Engine 1.0</span></header>
  <div class="body">
    <div class="grid" style="grid-template-columns: repeat(4, minmax(0, 1fr))">
      ${tile("Distance" + (S.ret === "back" ? ", out and back" : ""), calc("distance", f(r.distanceKm, 1), "big") + '<span class="unit">km</span>', `Steepest ${f(r.maxSlopeDeg, 1)}°${crossing ? ` · near ${esc(crossing.name ?? "a crater")}` : ""}`)}
      ${tile("Duration", calc("duration", fmtH(r.hours), "big"), u ? `5th–95th percentile <span class="num">${fmtH(u.hours.p5)} – ${fmtH(u.hours.p95)}</span>` : "")}
      ${tile("Crew oxygen used", calc("o2-0", f(o2, 0), "big") + '<span class="unit">L</span>', u ? `5th–95th percentile <span class="num">${f(u.o2L.p5, 0)} – ${f(u.o2L.p95, 0)} L</span> · ${r.people.length} crew` : "")}
      ${tile("Dose equivalent", calc("dose", f(r.dose.equivalentMsv, 3), "big") + '<span class="unit">mSv</span>', u ? `5th–95th percentile <span class="num">${f(u.hMsv.p5, 3)} – ${f(u.hMsv.p95, 3)}</span> · cosmic rays only` : "")}
    </div>

    <div class="grid planrow" style="grid-template-columns: 286px minmax(0, 1fr) 336px; align-items: stretch">
      <section class="panel" aria-label="Route planner">
        <div class="ph"><h2>Route planner</h2></div>
        <form class="pb" id="planner" style="display: flex; flex-direction: column; gap: 12px" novalidate>
          <div class="fld"><label class="lbl" for="f-start">Start</label><select class="inp" id="f-start" data-field="start">${opt(S.start)}</select></div>
          <div class="fld"><label class="lbl" for="f-dest">Destination</label><select class="inp" id="f-dest" data-field="dest">${opt(S.dest)}</select></div>
          <div class="fld">
            <span class="lbl">Science stops · ${S.stops.length} of 4</span>
            ${S.stops.map((s, i) => `<div class="stop-row"><select class="inp" aria-label="Stop ${i + 1} place" data-stop="${i}" data-k="id">${opt(s.id)}</select><input class="inp num" aria-label="Stop ${i + 1} minutes" data-stop="${i}" data-k="min" inputmode="numeric" value="${s.min}"><button type="button" class="btn" data-act="rm-stop" data-i="${i}" aria-label="Remove stop ${i + 1}">×</button></div>`).join("")}
            ${S.stops.length < 4 ? '<button type="button" class="btn sm" data-act="add-stop" style="align-self: flex-start">Add a stop</button>' : ""}
          </div>
          <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
            <div class="fld"><label class="lbl" for="f-crew">Crew</label><input class="inp num" id="f-crew" data-field="crew" type="number" min="1" max="4" value="${esc(S.crew)}"></div>
            <div class="fld"><label class="lbl" for="f-time">Start time</label><input class="inp num" id="f-time" data-field="startTime" type="time" value="${esc(S.startTime)}"></div>
          </div>
          <div class="fld"><label class="lbl" for="f-date">Date</label><input class="inp num" id="f-date" data-field="date" type="date" value="${esc(S.date)}"></div>
          <div class="fld"><span class="lbl">Travel mode</span><div class="seg"><button type="button" aria-pressed="true">Walk</button><button type="button" aria-pressed="false" disabled title="Rover physiology is not in the engine yet" style="opacity: .5; cursor: not-allowed">Rover</button></div></div>
          <div class="fld"><span class="lbl">Return</span><div class="seg"><button type="button" data-act="ret" data-v="back" aria-pressed="${S.ret === "back"}">Out and back</button><button type="button" data-act="ret" data-v="one" aria-pressed="${S.ret === "one"}">One way</button></div></div>
          ${missing("o2", "Oxygen carried, each", "L", "Enter litres to assess")}
          <details class="more"><summary>Suit equipment (optional)</summary><div style="display: flex; flex-direction: column; gap: 12px; padding-top: 6px">
            ${missing("batteryWh", "Suit battery", "Wh", "Wh")}${missing("powerW", "Power draw", "W", "W")}${missing("waterL", "Water carried", "L", "L")}${missing("waterUseLph", "Water use", "L/h", "L/h")}${missing("scrubberG", "CO₂ scrubber", "g", "grams of CO₂")}${missing("coolingW", "Cooling", "W", "W")}
          </div></details>
          ${ui.dirty ? '<p class="sub" style="color: var(--und)">Inputs changed. Recalculate to update every number.</p>' : ""}
          <button class="btn${ui.dirty ? " pri" : ""}" data-act="recalc" type="submit">Recalculate route</button>
          <a class="btn${ui.dirty ? "" : " pri"}" href="#/journey">Start journey</a>
        </form>
      </section>

      <div style="position: relative; min-width: 0; display: flex">
        ${mapFrame(P, { box: routeBox(P), label: "Jezero map with planned route", layers: true })}
        <div class="ovl global-inset" style="left: 12px; top: 12px; width: 168px; padding: 8px; z-index: 2">
          <div class="lbl" style="color: #A3B4CD; margin-bottom: 6px">Global view</div>
          <div style="position: relative"><img src="img/mars-global.webp" alt="Global map of Mars with Jezero marked" style="display: block; width: 100%; border-radius: 3px; filter: saturate(.7) brightness(.8)"><span class="pin" style="left: 71.5%; top: 39.8%; width: 9px; height: 9px"></span></div>
        </div>
        ${crossing ? `<a class="ovl crater-alert" href="#/craters" style="left: 192px; right: 60px; top: 12px; display: flex; align-items: center; gap: 12px; padding: 9px 12px; border-color: #E8793F; z-index: 2">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" stroke="#E8793F" stroke-width="1.5" aria-hidden="true"><ellipse cx="8" cy="9" rx="6" ry="3"/><ellipse cx="8" cy="9" rx="3" ry="1.3"/></svg>
          <span><b style="font-weight: 600">Crater ahead: ${esc(crossing.name ?? `crater ${crossing.id}`)}</b><br><span style="font-size: 11.5px; color: #A3B4CD">${f(crossing.diameterM, 0)} m wide${crossing.rimSlopeDeg ? `, ${crossing.rimSlopeDeg}° walls` : ""}. Compare across and around</span></span></a>` : ""}
        <div class="ovl" style="left: 12px; bottom: 12px; padding: 9px 11px; max-width: 320px; font-size: 11.5px; line-height: 1.5; z-index: 2">
          <div><span class="lbl" style="color: #A3B4CD">Last checked</span> <span class="num">${esc(ui.loadedAt)}</span> · bundled copy</div>
          <div><span class="lbl" style="color: #A3B4CD">Imagery</span> HRSC, ESA/DLR/FU Berlin (PIA24096)</div>
        </div>
      </div>

      <section class="panel" aria-label="Route assessment" style="display: flex; flex-direction: column">
        <div class="ph"><h2>Route assessment</h2><span class="sub num">${decided} of ${P.plan.checks.length} checks decided</span></div>
        <div class="pb">${outcomeBlock(P.plan.outcome, P.plan.checks)}</div>
        <div style="border-top: 1px solid var(--line)">
          ${P.plan.checks.map((c) => `<div class="chk"><b>${esc(c.name)}</b>${status(c.status)}<span class="sub">${esc(c.detail)}</span></div>`).join("")}
        </div>
      </section>
    </div>

    <div class="grid inforow" style="grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr) 336px">
      <section class="panel" aria-label="Route profile"><div class="ph"><h2>Route profile${S.ret === "back" ? ", outbound" : ""}</h2>${badge("measured", "Measured · CTX DEM")}</div><div class="pb">${profile(P)}</div></section>
      <section class="panel" aria-label="Crew"><div class="ph"><h2>Crew at end of EVA</h2></div>
        <div class="scroll-x"><table class="tb"><thead><tr><th>Crew</th><th class="r">O₂ used</th><th class="r">O₂ left</th><th class="r">Fatigue</th><th>Battery</th><th>Water</th><th>Scrubber</th></tr></thead><tbody>
        ${r.people.map((m, i) => `<tr><td>${esc(m.id)}</td><td class="r">${calc(`o2-${i}`, `${f(m.o2UsedL, 0)} L`)}</td><td class="r num">${m.o2CarriedL == null ? '<span class="miss">not entered</span>' : `${f(m.o2CarriedL - m.o2UsedL, 0)} L`}</td><td class="r num">${f(m.fatigue, 2)}</td>${["battery", "water", "scrubberG"].map((k) => `<td>${m[k] == null ? '<span class="miss">not entered</span>' : `<span class="num">${f(m[k], 0)}</span>`}</td>`).join("")}</tr>`).join("")}
        </tbody></table></div>
        <div class="pb sub" style="border-top: 1px solid var(--line)">Metabolic oxygen only. Suit leakage is assumed to be zero until a value is entered.</div></section>
      <section class="panel" aria-label="Conditions"><div class="ph"><h2>Conditions on the route</h2>${badge("model", "Model · MCD 6.2")}</div>
        <div class="pb" style="padding-top: 6px; padding-bottom: 6px">
          <div class="kv"><span>Surface pressure, mean</span><span class="num">${f(pres, 0)} Pa</span></div>
          <div class="kv"><span>Air temperature</span><span class="num">${f(Math.min(...temps), 0)} to ${f(Math.max(...temps), 0)} °C</span></div>
          <div class="kv"><span>Dust opacity, typical</span><span class="num">${f(P.env(12).dustTau, 2)}</span></div>
          <div class="kv"><span>Dose rate, mean</span><span>${calc("dose", `${f(rate, 4)} mSv/h`)}</span></div>
          <div class="kv"><span>Solar events</span>${badge("not modelled", "Not modelled")}</div>
        </div></section>
    </div>
  </div>`;
}
function tile(label, value, sub) {
  return `<div class="panel pb" style="display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: center"><span class="lbl">${label}</span>${badge("model", "Model")}</div><div>${value}</div><div class="sub">${sub}</div></div>`;
}
function profile(P) {
  const z = P.route.elevations, n = z.length, km = P.route.km;
  const lo = Math.min(...z), hi = Math.max(...z), span = Math.max(10, hi - lo);
  const X = (i) => 34 + (i / (n - 1)) * 376, Y = (v) => 120 - ((v - lo) / span) * 100;
  const d = z.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`).join(" ");
  return `<svg viewBox="0 0 420 150" role="img" aria-label="Elevation along the outbound route, ${f(lo, 0)} to ${f(hi, 0)} m" style="width: 100%; display: block">
    <path d="M34 120h376M34 70h376M34 20h376" stroke="#1B2A44"/>
    <path d="${d} L410 120 L34 120Z" fill="rgba(63,182,242,.12)"/><path d="${d}" fill="none" stroke="#3FB6F2" stroke-width="1.6"/>
    <text class="axis" x="30" y="123" text-anchor="end">${f(lo, 0)}</text><text class="axis" x="30" y="23" text-anchor="end">${f(lo + span, 0)}</text>
    <text class="axis" x="34" y="140">0 km</text><text class="axis" x="410" y="140" text-anchor="end">${f(km, 1)} km</text></svg>`;
}

// ---------- 2. craters ----------
export function craterView(P, C) {
  if (!C) return `<header class="top"><h1>Craters</h1></header><div class="body"><div class="panel pb">This route stays clear of every catalogued crater zone. ${P.allCraters.length} craters are catalogued around Jezero.</div></div>`;
  const g = C.geometry, a = C.across, o = C.around, d = C.diff, name = C.crater.name ?? `Crater ${C.crater.id}`;
  const p1 = (r) => r.people[0]?.o2UsedL, crew = (r) => r.people.reduce((s, m) => s + m.o2UsedL, 0);
  const sign = (x, dd = 1) => `${x >= 0 ? "+" : "−"}${f(Math.abs(x), dd)}`;
  const options = P.route.craters.map((c) => `<option value="${c.crater.id}"${c.crater.id === C.crater.id ? " selected" : ""}>${esc(c.crater.name ?? `Crater ${c.crater.id}`)} · ${c.crosses ? "crossed" : `${c.edgeM} m from rim`}</option>`).join("");
  const r = (C.crater.diameterM / 2000) * 3.4, box = [C.crater.x - r / KM_PER_X, C.crater.y - r / KM_PER_Y, C.crater.x + r / KM_PER_X, C.crater.y + r / KM_PER_Y];
  const overHazard = (C.c.alphaDeg ?? 0) > 20;
  return `<header class="top"><h1>Craters <span class="dim" style="font-weight: 400">/ ${esc(name)}</span></h1><span class="chip sim">Simulation</span>
    <label class="meta" style="display: flex; align-items: center; gap: 8px">On this route <select class="inp" data-field-crater style="min-height: 32px; width: auto">${options}</select></label></header>
  <div class="body"><div class="grid craterrow" style="grid-template-columns: 500px minmax(0, 1fr); align-items: start">
    <div style="display: flex; flex-direction: column; gap: 16px">
      <div style="position: relative; display: flex">${mapFrame(P, { box, height: 520, label: `${name} with the planned route`, pins: false })}
        <div class="ovl" style="left: 12px; bottom: 12px; padding: 9px 11px; font-size: 11.5px; line-height: 1.7; z-index: 2">
          <div style="display: flex; align-items: center; gap: 8px"><span style="width: 22px; border-top: 3px solid #3FB6F2"></span>Planned route</div>
          <div style="display: flex; align-items: center; gap: 8px"><span style="width: 22px; border-top: 1px dashed #E8793F"></span>Crater rim</div></div></div>
      <section class="panel"><div class="ph"><h2>Crater catalogue</h2>${badge("model", "Derived · CTX DEM")}</div><div class="pb" style="padding-top: 6px; padding-bottom: 6px">
        <div class="kv"><span>Detected around Jezero</span><span class="num">${P.allCraters.length}</span></div>
        <div class="kv"><span>Within 200 m of this route</span><span class="num">${P.route.craters.length}</span></div>
        <div class="kv"><span>Route enters a crater zone</span><span class="num">${P.crossing.length}</span></div></div></section>
    </div>
    <div style="display: flex; flex-direction: column; gap: 16px; min-width: 0">
      <section class="panel"><div class="ph"><h2>${esc(name)}</h2>${badge("model", "Derived · CTX DEM, 20 m per pixel")}</div>
        <div class="pb grid" style="grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px">
          ${[["Diameter", f(C.crater.diameterM, 0), "m"], ["Depth", f(C.crater.depthM, 0), "m"], ["Wall angle", `${f(C.c.alphaDeg, 0)}°`, ""], ["Floor", f(g.floorM, 0), "m"], ["Depth ÷ diameter", f(g.depthToDiameter, 3), ""]]
            .map(([l, v, u]) => `<div><div class="lbl">${l}</div><div style="margin-top: 6px"><span class="big">${v}</span>${u ? `<span class="unit">${u}</span>` : ""}</div></div>`).join("")}
        </div></section>
      <section class="panel"><div class="ph"><h2>Cross-section</h2><span class="sub">Idealised bowl. Vertical scale exaggerated</span></div><div class="pb">${section(C)}</div></section>
      <section class="panel"><div class="ph"><h2>Across compared with around</h2><span class="sub">${a.people.length} crew · ${f(a.params.v0, 1)} km/h baseline · no planned rests</span></div>
        <div class="scroll-x"><table class="tb"><thead><tr><th></th><th class="r">Across</th><th class="r">Around</th><th class="r">Around − across</th></tr></thead><tbody>
          <tr><td>Distance</td><td class="r num">${f(g.acrossM, 0)} m</td><td class="r num">${f(g.aroundM, 0)} m</td><td class="r num">${sign(g.detourM, 0)} m</td></tr>
          <tr><td>Time</td><td class="r num">${f(a.hours * 60, 1)} min</td><td class="r num">${f(o.hours * 60, 1)} min</td><td class="r num">${sign(d.dHours * 60)} min</td></tr>
          <tr><td>Oxygen, per person</td><td class="r num">${f(p1(a), 1)} L</td><td class="r num">${f(p1(o), 1)} L</td><td class="r num">${sign(p1(o) - p1(a))} L</td></tr>
          <tr><td>Oxygen, crew</td><td class="r num">${f(crew(a), 1)} L</td><td class="r num">${f(crew(o), 1)} L</td><td class="r num">${sign(d.dO2L)} L</td></tr>
          <tr><td>Dose equivalent</td><td class="r num">${f(a.dose.equivalentMsv, 4)} mSv</td><td class="r num">${f(o.dose.equivalentMsv, 4)} mSv</td><td class="r num">${sign(d.dHMsv, 4)} mSv</td></tr>
          <tr><td>Climb out</td><td class="r num">${f(C.crater.depthM, 0)} m</td><td class="r num">0 m</td><td class="r num">−${f(C.crater.depthM, 0)} m</td></tr>
          <tr><td>Wall slope check</td><td class="r">${overHazard ? status("undetermined", "Over 20° hazard slope") : status("pass")}</td><td class="r">${status("pass")}</td><td></td></tr>
        </tbody></table></div>
        <p class="pb sub" style="border-top: 1px solid var(--line)">${d.dO2L < 0 ? "Going around is longer but uses less oxygen, because it avoids the climb out." : "Going across uses less oxygen here."} Crater shielding is not modelled, so the dose difference comes from time alone. The idealised bowl is a planning simplification; the route on the map follows the real terrain.</p>
      </section>
    </div></div></div>`;
}
function section(C) {
  const g = C.geometry, d = C.crater.diameterM, h = C.crater.depthM;
  const W = 600, sx = 440 / (d + 100), sz = Math.min(3, 80 / h) * sx, x0 = 80, rim = 70;
  const b = g.wallRunM * sx, top0 = x0 + 50 * sx, fl = rim + h * sz;
  const path = `M20 ${rim} H${top0} L${top0 + b} ${fl} H${top0 + d * sx - b} L${top0 + d * sx} ${rim} H${W - 20}`;
  return `<svg viewBox="0 0 ${W} 200" role="img" aria-label="Cross-section: ${f(d, 0)} m wide, ${f(h, 0)} m deep, ${f(C.c.alphaDeg, 0)} degree walls" style="width: 100%; display: block">
    <path d="${path} V186 H20Z" fill="#121E33"/><path d="${path}" fill="none" stroke="#8296B3" stroke-width="1.5"/>
    <path d="M${top0} 30 H${top0 + d * sx} M${top0} 25 V35 M${top0 + d * sx} 25 V35" stroke="#3FB6F2"/>
    <text class="axis" x="${top0 + (d * sx) / 2}" y="20" text-anchor="middle" style="fill: #E4ECF7">diameter ${f(d, 0)} m</text>
    <text class="axis" x="${top0 + (d * sx) / 2}" y="${fl + 18}" text-anchor="middle" style="fill: #E4ECF7">floor ${f(g.floorM, 0)} m</text>
    <text class="axis" x="${top0 + d * sx + 14}" y="${(rim + fl) / 2}" style="fill: #E8793F">${f(h, 0)} m deep</text>
    <text class="axis" x="${top0 + b / 2 - 4}" y="${(rim + fl) / 2}" text-anchor="end" style="fill: #E4ECF7">${f(C.c.alphaDeg, 0)}° · ${f(g.wallM, 0)} m</text></svg>`;
}

// ---------- 4. calculations ----------
export function calcView(P, recs, key, ui) {
  const rec = recs[key] ?? recs.dose;
  const list = Object.entries(recs).map(([k, r]) => `<button data-act="rec" data-k="${k}" aria-current="${k === key}"><span>${esc(r.name)}${/Claire/.test(r.name) ? '<div class="sub" style="color: var(--claire)">hypothesis scenario</div>' : ""}</span><span class="num">${f(r.output, r.unit === "mSv" ? 4 : r.unit === "L" ? 0 : 2)} ${esc(r.unit)}</span></button>`).join("");
  const rows = Object.entries(rec.inputs ?? {}).map(([k, v]) => { const m = P.plan.result.meta[k] ?? {}; return `<tr><td class="num">${esc(k)}</td><td class="r num">${v == null ? '<span class="miss">no value</span>' : esc(typeof v === "number" ? f(v, Math.abs(v) < 0.1 ? 5 : 2) : v)}${m.unit && v != null ? ` ${esc(m.unit)}` : ""}</td><td>${m.kind ? badge(m.kind, m.kind) : ""}</td><td class="sub">${esc(m.source ?? rec.sources?.[k] ?? "")}</td></tr>`; }).join("");
  const unc = rec.uncertainty && rec.uncertainty.p5 != null ? `${f(rec.uncertainty.p5, 4)} – ${f(rec.uncertainty.p50, 4)} – ${f(rec.uncertainty.p95, 4)}` : rec.uncertainty?.totalCrewO2L ? `${f(rec.uncertainty.totalCrewO2L.p5, 0)} – ${f(rec.uncertainty.totalCrewO2L.p95, 0)} L, whole crew` : "not computed";
  const tab = ui.tab ?? "work";
  return `<header class="top"><h1>Calculations</h1><span class="chip sim">Simulation</span><span class="meta"><b>${Object.keys(recs).length} records</b> saved for this route</span><span class="meta">Model <b>${esc(rec.modelVersion)}</b></span></header>
  <div class="body"><div class="grid" style="grid-template-columns: 300px minmax(0, 1fr); align-items: start">
    <section class="panel rec-list" aria-label="Saved calculation records"><div class="ph"><h2>Records</h2></div>${list}<div class="pb sub">Click any dotted number anywhere in Mars Atlas to open its record here.</div></section>
    <section class="panel" aria-label="${esc(rec.name)}"><div class="ph"><h2>${esc(rec.name)}</h2></div>
      <div class="tabs" role="tablist"><button role="tab" data-act="tab" data-v="ai" aria-selected="${tab === "ai"}">Explanation</button><button role="tab" data-act="tab" data-v="work" aria-selected="${tab === "work"}">Worked calculation</button></div>
      <div class="pb" style="display: flex; flex-direction: column; gap: 14px">
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 10px">
          <div><div class="lbl">Output</div><div style="margin-top: 4px"><span class="big">${f(rec.output, rec.unit === "mSv" ? 4 : 2)}</span><span class="unit">${esc(rec.unit)}</span></div></div>
          <div style="text-align: right"><div class="lbl">Uncertainty, 5th–50th–95th percentile</div><div class="num" style="margin-top: 6px">${unc}</div></div></div>
        ${tab === "ai" ? `<div style="align-self: flex-end; max-width: 86%; padding: 9px 12px; border: 1px solid var(--line-2); border-radius: 8px 8px 2px 8px; background: var(--panel-2)"><div class="lbl" style="margin-bottom: 3px">Sent automatically</div>Explain this calculation in precise detail.</div>
          <div class="chat" aria-live="polite"><div class="lbl" style="margin-bottom: 6px">Atlas guide · reading the saved record</div>${esc(ui.ai?.[key] ?? "Asking the guide…")}</div>
          <p class="sub">The guide reads the saved record. If it is offline, the worked calculation is still here.</p>`
        : `<div><div class="lbl" style="margin-bottom: 6px">Working</div><div class="formula">${(rec.working ?? []).map(esc).join("\n")}</div></div>
          <div><div class="lbl" style="margin-bottom: 2px">Inputs</div><div class="scroll-x"><table class="tb"><thead><tr><th>Input</th><th class="r">Value</th><th>Kind</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div></div>
          ${rec.assumptions?.length ? `<div><div class="lbl" style="margin-bottom: 6px">Assumptions</div><ul style="margin: 0; padding-left: 18px; color: var(--text-2); line-height: 1.6">${rec.assumptions.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}`}
        <div class="sub num" style="padding-top: 10px; border-top: 1px solid var(--line)">${esc(rec.modelVersion)}${rec.createdAt ? ` · saved ${esc(rec.createdAt.slice(0, 16).replace("T", " "))} UTC` : ""}</div>
      </div></section>
  </div></div>`;
}

// ---------- 5. Claire entrance ----------
export function gateView(ok) {
  return `<div class="atlas" style="position: relative; min-height: 100vh; overflow: hidden; background: #030509; display: flex; flex-direction: column">
    <div class="scene photo" aria-hidden="true" style="filter: grayscale(.85) brightness(.42) contrast(1.15)"><img src="img/belva-rim-sol772.jpg" alt=""><div class="vig"></div></div>
    <div aria-hidden="true" style="position: absolute; inset: 0; background: linear-gradient(90deg, rgba(3,5,9,.92) 0, rgba(3,5,9,.74) 55%, rgba(3,5,9,.38) 100%)"></div>
    <div class="hatch" aria-hidden="true" style="position: relative; height: 10px"></div>
    <div style="position: relative; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; padding: 14px 28px; font: 500 11px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--claire)"><span>Experimental zone</span><span>Unvalidated research model</span><span>Claire 0.1</span></div>
    <div style="position: relative; flex: 1; display: flex; align-items: center; padding: 24px clamp(24px, 8vw, 120px)">
      <div role="alertdialog" aria-labelledby="gate-title" aria-describedby="gate-desc" style="width: min(100%, 720px)">
        <div style="font: 500 11px/1 var(--mono); letter-spacing: .12em; text-transform: uppercase; color: var(--text-3)">Before you continue</div>
        <h1 id="gate-title" style="margin-top: 22px; font: 400 clamp(28px, 4vw, 40px)/1.22 var(--sans); letter-spacing: -.01em">You’re entering an experimental zone.</h1>
        <p id="gate-desc" style="margin-top: 16px; font: 400 clamp(28px, 4vw, 40px)/1.22 var(--sans); letter-spacing: -.01em; color: var(--text-2)">The radiation estimates may be wrong. Are you sure what you’re doing is worth it?</p>
        <div class="grid" style="margin-top: 36px; border-top: 1px solid var(--line-2); border-bottom: 1px solid var(--line-2); padding: 16px 0; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">
          <div><div class="lbl">What changes inside</div><p class="sub" style="margin-top: 6px">One thing. The radiation estimate adds an air-temperature term.</p></div>
          <div><div class="lbl">What is known</div><p class="sub" style="margin-top: 6px">Colder hours show lower readings at Gale. The cause is not established.</p></div>
          <div><div class="lbl">What it cannot do</div><p class="sub" style="margin-top: 6px">Claire never changes a route outcome. Only the standard model decides.</p></div></div>
        <label style="margin-top: 22px; display: flex; align-items: center; gap: 10px; min-height: 44px; cursor: pointer"><input type="checkbox" data-act="gate-ok" ${ok ? "checked" : ""} style="width: 18px; height: 18px; accent-color: #B0A0FF"><span>I understand these estimates are experimental and unvalidated.</span></label>
        <div style="margin-top: 14px; display: flex; flex-wrap: wrap; gap: 12px">
          <a class="btn pri" href="#/map" style="min-height: 46px; padding: 0 20px">Go back to Mars Atlas</a>
          <button class="btn" data-act="enter-claire" ${ok ? "" : "disabled"} style="min-height: 46px; padding: 0 20px; border: 1px dashed var(--claire); color: var(--claire)">Enter Experimental Claire</button></div>
        <p class="sub" style="margin-top: 14px">Press Esc to go back.</p>
      </div></div>
    <div class="hatch" aria-hidden="true" style="position: relative; height: 10px"></div></div>`;
}

// ---------- 6. Claire ----------
export function claireView(P, rows) {
  const d = P.plan.result.dose, pct = (d.claireMsv / d.equivalentMsv - 1) * 100;
  const R = P.plan.result.params;
  return `<div class="claire-page">
  <div class="hatch" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 20px; padding: 8px 24px; border-bottom: 1px dashed var(--claire); font: 500 11px/1.3 var(--mono); letter-spacing: .1em; text-transform: uppercase; color: var(--claire)"><span>Experimental / unvalidated</span><span>Radiation estimates here may be wrong</span><a href="#/map" style="text-decoration: underline">Leave Claire</a></div>
  <header class="top"><h1>Experimental Claire</h1><span class="chip exp">Experimental · unvalidated</span><span class="meta"><b>${esc(P.state.date)}</b> · Ls ${f(P.env(12).ls, 1)}°</span><span class="meta">Same route as Mars Atlas</span></header>
  <div class="body">
    <div class="grid" style="grid-template-columns: minmax(0, 1fr) 440px; align-items: stretch">
      <section style="position: relative; min-height: 460px; overflow: hidden; border-radius: 8px; border: 1px dashed rgba(176,160,255,.6)">
        <div class="scene photo" aria-hidden="true"><img src="img/belva-rim-sol772.jpg" alt=""><div class="vig"></div></div>
        <div style="position: relative; min-height: 460px; padding: 14px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: auto 1fr auto; gap: 12px; align-items: start">
          <div class="hud-card" style="grid-column: 2; justify-self: end; width: min(100%, 340px)">
            <div class="hh" style="color: var(--claire)"><span>Temperature term along the route</span></div>
            <div class="scroll-x"><table class="tb" style="font-size: 12px"><thead><tr><th>Moment</th><th class="r">T − Tref</th><th class="r">Standard</th><th class="r">Claire</th></tr></thead><tbody>
              ${rows.map((x) => `<tr><td>${esc(x.label)}<div class="sub" style="color: #A3B4CD">${clock(x.hour)} · ${f(x.T, 0)} °C</div></td><td class="r num">${x.dT >= 0 ? "+" : "−"}${f(Math.abs(x.dT), 0)} K</td><td class="r num">${f(x.std, 4)}</td><td class="r num" style="color: var(--claire)">${f(x.cl, 4)}</td></tr>`).join("")}
            </tbody></table></div>
            <p class="sub" style="padding: 8px 12px; color: #A3B4CD">Rates in mSv/h. Two model outputs. Neither is a measurement.</p></div>
          <div></div><div></div>
          <div class="hud-card" style="grid-column: 1 / -1; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 16px; padding: 9px 12px; font-size: 11.5px">
            <span><span class="lbl" style="color: #A3B4CD">Climate inputs</span> ${badge("model", "Model · MCD 6.2")}</span>
            <span style="font: 400 10.5px/1.3 var(--mono); color: #A3B4CD">Photo: Belva rim, Perseverance Mastcam-Z, sol 772 (NASA/JPL-Caltech/ASU). Not a live view.</span></div>
        </div>
      </section>
      <section class="panel" style="display: flex; flex-direction: column">
        <div class="ph"><h2>Dose estimate · two models</h2></div>
        <div class="grid" style="grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0">
          <div class="pb" style="border-right: 1px solid var(--line)"><div class="lbl">Standard · pressure</div><div style="margin-top: 8px">${calc("dose", f(d.equivalentMsv, 4), "big")}<span class="unit">mSv</span></div><div class="sub" style="margin-top: 6px">μ <span class="num">${f(R.mu, 3)} cm²/g</span></div><div style="margin-top: 8px">${badge("measured", "Measured coefficient")}</div></div>
          <div class="pb hatch"><div class="lbl" style="color: var(--claire)">Claire · pressure + temperature</div><div style="margin-top: 8px">${calc("claire", f(d.claireMsv, 4), "big")}<span class="unit">mSv</span></div><div class="sub" style="margin-top: 6px">βT <span class="num">${f(R.claireBetaT, 4)} /K</span></div><div style="margin-top: 8px"><span class="pv as" style="color: var(--claire); border-color: var(--claire)">Hypothesis scenario</span></div></div>
        </div>
        <div class="pb" style="border-top: 1px solid var(--line)"><div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px"><span class="lbl">Claire − standard</span><span><span class="num" style="font-size: 18px">${d.claireDeltaMsv >= 0 ? "+" : "−"}${f(Math.abs(d.claireDeltaMsv), 4)} mSv</span> <span class="sub num">· ${pct >= 0 ? "+" : "−"}${f(Math.abs(pct), 1)}%</span></span></div><p class="sub" style="margin-top: 6px">Difference between two models, not measured exposure.</p></div>
        <div class="pb" style="border-top: 1px solid var(--line); display: flex; flex-direction: column; gap: 10px; flex: 1"><div class="lbl">Route outcome</div>${outcomeBlock(P.plan.outcome, P.plan.checks, true)}<p class="sub">Decided by the standard model only. Claire is never used for route checks or radiation margins.</p></div>
      </section>
    </div>
    <h2 style="font-size: 16px; font-weight: 600; margin-top: 8px; padding-top: 18px; border-top: 1px dashed rgba(176,160,255,.45)">Calculations</h2>
    <div class="grid" style="grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr) minmax(0, 1fr); align-items: start">
      <section class="panel"><div class="ph"><h2>Hypothesis</h2>${status("undetermined", "Cause not established")}</div><div class="pb" style="display: flex; flex-direction: column; gap: 12px">
        <p style="font-size: 15px; line-height: 1.45">Colder conditions may be associated with lower radiation readings.</p>
        <div class="formula">ln(Ḋc ÷ Ḋref) =\n  −μC (X − Xref)\n  + βT (T − Tref)\n  + βᵀ z</div>
        <div><div class="lbl" style="margin-bottom: 4px">What could explain it</div><div class="kv"><span>Pressure, daily thermal tide</span><span class="sub">must exist</span></div><div class="kv"><span>Detector temperature</span><span class="sub">likely contributes</span></div><div class="kv"><span>Atmosphere expanding when warm</span><span class="sub">probably small</span></div><div class="kv"><span>Water in the soil</span><span class="sub">speculative</span></div></div>
        <p class="sub">Ruled out: air molecules slowing cosmic rays. Thermal energy is about 0.02 eV against billions of eV.</p></div></section>
      <section class="panel"><div class="ph"><h2>Within-sol fits</h2>${badge("measured", "Measured · RAD, REMS")}</div><div class="scroll-x"><table class="tb"><thead><tr><th>Fit</th><th>Detector</th><th class="r">Pressure, %/Pa</th><th class="r">Temperature, %/K</th></tr></thead><tbody>
        <tr><td>Pressure only</td><td>B · silicon</td><td class="r num">−0.024 ± 0.003</td><td class="r dim">not in fit</td></tr><tr><td>Pressure only</td><td>E · plastic</td><td class="r num">−0.045 ± 0.005</td><td class="r dim">not in fit</td></tr>
        <tr><td>Joint</td><td>B · silicon</td><td class="r num">+0.001 ± 0.005</td><td class="r num">+0.040 ± 0.006</td></tr><tr><td>Joint</td><td>E · plastic</td><td class="r num">+0.003 ± 0.008</td><td class="r num">+0.075 ± 0.010</td></tr></tbody></table></div>
        <div class="pb" style="border-top: 1px solid var(--line)"><div class="kv" style="padding-top: 0"><span>Pressure–temperature correlation within a sol</span><span class="num">−0.80</span></div><div class="kv"><span>Daily dose vs daily mean temperature</span><span class="num">r = 0.22</span></div><div class="kv" style="padding-bottom: 0"><span>Readings</span><span class="num">8,172 · 142 sols</span></div>
        <p class="sub" style="margin-top: 10px">With a −0.80 correlation the fit can credit either variable. That is an association, not a cause.</p></div></section>
      <section class="panel"><div class="ph"><h2>Validation</h2>${status("undetermined", "Not yet run")}</div><div class="pb" style="display: flex; flex-direction: column; gap: 12px">
        <div class="formula">ΔMAE = MAE standard − MAE Claire\n<span class="miss">no result yet</span></div>
        <div><div class="lbl" style="margin-bottom: 4px">Calibration range</div><div class="kv"><span>Site, period</span><span class="num">Gale, 2012–14</span></div><div class="kv"><span>Pressure</span><span class="num">700–930 Pa</span></div><div class="kv"><span>Air temperature</span><span class="num">−103 to 0 °C</span></div></div>
        <div><div class="lbl" style="margin-bottom: 4px">Quality</div><div class="kv"><span>Pairing</span><span class="sub">nearest REMS sample, median 9.6 min</span></div><div class="kv"><span>RAD QC flags</span><span class="miss">not applied yet</span></div></div></div></section>
    </div>
  </div></div>`;
}

// ---------- 7. data sources ----------
export function dataView() {
  const params = Object.entries(DEFAULTS).map(([k, d]) => `<tr><td class="num">${esc(k)}</td><td class="r num">${d.value == null ? '<span class="miss">no value</span>' : esc(d.value)} ${esc(d.unit)}</td><td>${badge(d.kind, d.kind)}</td><td class="sub">${esc(d.source)}</td></tr>`).join("");
  return `<header class="top"><h1>Data sources</h1><span class="meta">Every layer and every default, with where it came from</span></header>
  <div class="body">
    <section class="panel"><div class="ph"><h2>Map and model layers</h2></div><div class="scroll-x"><table class="tb"><thead><tr><th>Layer</th><th>Source</th><th>Mission</th><th>Kind</th></tr></thead><tbody>
      ${SOURCES.map((s) => `<tr><td>${esc(s.layer)}</td><td class="sub">${esc(s.source)}</td><td class="sub">${esc(s.mission)}</td><td class="sub">${esc(s.kind)}</td></tr>`).join("")}
      <tr><td>Journey photo</td><td class="sub">Belva crater rim, Mastcam-Z raw image, sol 772</td><td class="sub">NASA Perseverance (NASA/JPL-Caltech/ASU)</td><td class="sub">Measured imagery, illustrative use</td></tr>
    </tbody></table></div></section>
    <section class="panel"><div class="ph"><h2>Engine parameters</h2><span class="sub">mars-atlas-engine 1.0</span></div><div class="scroll-x"><table class="tb"><thead><tr><th>Parameter</th><th class="r">Value</th><th>Kind</th><th>Source</th></tr></thead><tbody>${params}</tbody></table></div></section>
    <p class="sub">Mars Atlas is a planning study for the NASA Space Apps Challenge 2026. It is not flight-certified guidance.</p>
  </div>`;
}
