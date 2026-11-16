// Journey view: plays the simulated walk back along the engine's timeline, instruments over a ground scene.
import { KM_PER_X, KM_PER_Y } from "./terrain/places.js";
import { badge, clock, esc, f, mapFrame, routeBox } from "./views.js?v=rover-1";

const BELVA = { x: 40.15, y: 46.73 };
const PX_PER_DEG = 4;
const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function journeyWarningView(plan) {
  const noGo = plan.outcome === "NO-GO";
  const checks = plan.checks.filter(check => check.status === (noGo ? "fail" : "undetermined"));
  const title = noGo ? "You shouldn’t be here…" : "One or more safety checks are unresolved. Are you willing to continue without knowing the risks?";
  return `<section class="replay-warning" role="alertdialog" aria-labelledby="replay-warning-title" aria-describedby="replay-warning-note">
    <div class="replay-warning-copy">
      <p class="atlas-kicker">${noGo ? "No-go · Required check failed" : "Caution · Undetermined assessment"}</p>
      <h1 id="replay-warning-title">${title}</h1>
      <p id="replay-warning-note">The replay is for simulation and review only. It provides no operational approval.</p>
      <div class="replay-warning-details">
        ${noGo ? "<p>One or more safety checks have failed, are you certain what you're thinking is worth your life?</p>" : ""}
        <ul>${checks.map(check => `<li><strong>${esc(check.name)}</strong> · ${esc(check.detail)}</li>`).join("")}</ul>
      </div>
      <div class="replay-warning-actions">
        <a class="btn pri" href="#/map">Return to mission map</a>
        ${plan.result.timeline.length ? '<button class="btn replay-continue" type="button" data-act="acknowledge-replay">Continue to illustrative replay</button>' : ""}
      </div>
    </div>
  </section>`;
}

export function journeyView(P) {
  const scene = `<div class="scene traverse-terrain" aria-hidden="true">
      <div class="ground"><img src="img/jezero-terrain.webp" alt="Orbital terrain used for the illustrative traverse"></div>
      <div class="haze"></div>
      <video id="j-walk-video" muted playsinline loop preload="none" poster="img/curiosity-walk-poster.webp" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 40%">
        <source src="img/curiosity-walk-loop.mp4" type="video/mp4">
      </video>
      <div class="vig"></div></div>`;
  const caption = "Illustrative Mars walk · Curiosity imagery, Gale Crater";
  const ticks = [];
  for (let d = -360; d <= 720; d += 15) {
    const deg = ((d % 360) + 360) % 360, major = deg % 45 === 0;
    ticks.push(`<span class="${major ? "" : "minor"}" style="left: ${d * PX_PER_DEG}px">${major ? POINTS[deg / 45] : ""}</span>`);
  }
  const people = P.plan.result.people;
  const crewSeg = people.length > 1 ? `<div class="seg" style="width: ${Math.min(4, people.length) * 66}px">${people.map((m, i) => `<button data-act="j-crew" data-i="${i}" aria-pressed="${i === 0}" style="min-height: 26px; line-height: 26px; font-size: 11px">${esc(m.id)}</button>`).join("")}</div>` : "";
  const r = (P.route.craters[0]?.crater.diameterM ?? 900) / 1000 * 1.3;
  const c0 = P.route.craters[0]?.crater ?? BELVA;
  return `<div class="journey">
    ${scene}
    <div class="layout journey-viewport">
      <div style="display: flex; align-items: center; gap: 12px">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="10.5" stroke="#E8793F" stroke-width="1.6"/><path d="M5.5 15.5c3.2-4.4 9.6-5.6 15-2.2" stroke="#E4ECF7" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="8.6" r="1.7" fill="#3FB6F2"/></svg>
        <span style="font-size: 15px; font-weight: 600">Lycoris<br><span style="font: 400 10px/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: #A3B4CD">Simulation playback</span></span>
        <button class="btn sm" data-act="j-play" aria-label="Pause or resume simulation" style="margin-left: auto; color: #E4ECF7" id="j-play-top">Pause</button>
        <a class="btn sm" href="#/map" style="color: #E4ECF7; background: rgba(9,15,27,.86)">Exit journey</a>
      </div>
      <div class="top-mid" style="justify-self: center; width: min(100%, 520px)">
        <div class="compass" role="img" aria-label="Compass" id="j-compass-wrap"><div class="strip" id="j-compass">${ticks.join("")}</div></div>
        <div class="num" style="text-align: center; font-size: 12px; margin-top: 2px" id="j-heading">—</div>
      </div>
      <div class="hud-card" style="display: grid; grid-template-columns: repeat(3, auto); justify-content: space-between; gap: 14px; padding: 9px 12px">
        <div><div class="lbl" style="color: #A3B4CD">Mission time</div><div class="num" style="margin-top: 3px; font-size: 14px" id="j-time">T+00:00:00</div></div>
        <div><div class="lbl" style="color: #A3B4CD">Sunset in</div><div class="num" style="margin-top: 3px; font-size: 14px" id="j-sunset">—</div></div>
        <div><div class="lbl" style="color: #A3B4CD">Air temp</div><div class="num" style="margin-top: 3px; font-size: 14px" id="j-temp">—</div></div>
      </div>

      <div class="journey-bank journey-bank-left">
        <details class="hud-card atlas-companion">
          <summary class="hh"><span>Atlas · companion</span><span class="pv as">Local guidance</span></summary>
          <div class="hb"><p id="j-atlas">Preparing traverse context…</p><div class="atlas-actions" role="group" aria-label="Ask Atlas"><button data-act="j-atlas-mode" data-mode="route" aria-pressed="true">Route</button><button data-act="j-atlas-mode" data-mode="science">Science</button><button data-act="j-atlas-mode" data-mode="safety">Safety</button></div><div class="atlas-ask"><input id="j-atlas-q" maxlength="180" placeholder="Ask about this waypoint"><button data-act="j-atlas-ask">Ask</button></div><p class="sub">Worker-side Atlas uses route context. Ground-to-Mars messaging is not instant: one-way light time varies roughly 4–24 min.</p></div>
        </details>
        <section class="hud-card" aria-label="Oxygen">
          <div class="hh"><span>Oxygen</span>${crewSeg}</div>
          <div class="hb" style="display: flex; align-items: center; gap: 14px">
            <div class="ring" id="j-ring" style="--p: 100" role="img" aria-label="Oxygen remaining"><span id="j-ring-t">—</span></div>
            <div style="flex: 1; min-width: 0">
              <div><span class="num" style="font-size: 18px" id="j-o2-left">—</span><span class="unit" id="j-o2-of"></span></div>
              <div class="kv" style="margin-top: 6px; padding: 4px 0"><span style="color: #A3B4CD">Reserve</span><span class="num" id="j-o2-res">—</span></div>
              <div class="kv" style="padding: 4px 0"><span style="color: #A3B4CD">Used so far</span><span class="num" id="j-o2-used">—</span></div>
              <div class="kv" style="padding: 4px 0"><span style="color: #A3B4CD">Fatigue</span><span class="num" id="j-fat">—</span></div>
            </div>
          </div>
          <div style="padding: 0 12px 6px; display: flex; justify-content: space-between; align-items: center"><a class="more" id="j-o2-record" href="#/calc/o2-0">View calculation</a>${badge("model", "Model")}</div>
        </section>
        <section class="hud-card" aria-label="Crew vitals model">
          <div class="hh"><span>Crew vitals</span>${badge("model", "Not telemetry")}</div>
          <div class="hb"><div class="kv" style="padding-top: 0"><span>Heart-rate estimate</span><span class="num" id="j-hr">—</span></div><div class="kv"><span>Exertion</span><span class="num" id="j-exertion">—</span></div><div class="kv" style="padding-bottom: 0"><span>External pressure</span><span class="num" id="j-pressure">—</span></div><p class="sub" style="margin-bottom: 0">Suit internal pressure is not entered; no physiological pressure response is inferred.</p></div>
        </section>
        <details class="hud-card science-objective">
          <summary class="hh"><span>Science objective</span><span class="pv as">Mission purpose</span></summary>
          <div class="hb"><div id="j-science-site" class="num">—</div><p id="j-science" style="margin: 8px 0 0">—</p><p class="sub" id="j-science-data">—</p><a class="more" href="#/data">View evidence layers</a></div>
        </details>
      </div>
      <div class="crosshair" aria-hidden="true" style="align-self: center; justify-self: center">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="#E4ECF7" stroke-width="1" opacity=".75"><circle cx="60" cy="60" r="34"/><path d="M60 14v22M60 84v22M14 60h22M84 60h22M60 54v12M54 60h12"/></svg>
      </div>
      <div class="journey-bank journey-bank-right">
        <section class="hud-card" aria-label="Crater ahead">
          <div class="hh" style="color: #E8793F"><span id="j-cr">Crater ahead</span><span class="num" style="letter-spacing: 0; text-transform: none; color: #A3B4CD" id="j-cr-d"></span></div>
          <div class="hb" style="display: flex; flex-direction: column; gap: 8px">
            ${mapFrame(P, { box: [c0.x - r / KM_PER_X, c0.y - r / KM_PER_Y, c0.x + r / KM_PER_X, c0.y + r / KM_PER_Y], height: 132, label: "Your position near the crater", pins: false,
              extra: `<span id="j-me" data-journey-marker style="position: absolute; transform: translate(-50%, -50%); width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid #070C17"></span>` }).replace('class="mapbtns"', 'class="mapbtns" hidden')}
            <p class="sub" style="color: #A3B4CD" id="j-cr-note">—</p>
          </div>
          <div style="padding: 0 12px 6px"><a class="more" href="#/craters">Inspect crater</a></div>
        </section>
        <section class="hud-card" aria-label="Radiation">
          <div class="hh"><span>Radiation</span>${badge("model", "Model")}</div>
          <div class="hb">
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px">
              <div><div class="lbl" style="color: #A3B4CD">Dose so far</div><div style="margin-top: 4px"><span class="num" style="font-size: 18px" id="j-dose">—</span><span class="unit">mSv</span></div></div>
              <div><div class="lbl" style="color: #A3B4CD">Rate</div><div style="margin-top: 4px"><span class="num" style="font-size: 18px" id="j-rate">—</span><span class="unit">mSv/h</span></div></div>
            </div>
            <div style="margin-top: 8px" id="j-solar">${badge("not modelled", "Solar events · training feed")}</div>
          </div>
          <div style="padding: 0 12px 6px"><a class="more" href="#/calc/dose">View calculation</a></div>
        </section>
        <section class="hud-card" aria-label="Next waypoint">
          <div class="hh"><span>Next waypoint</span><span class="num" style="letter-spacing: 0; text-transform: none" id="j-wp-n"></span></div>
          <div class="hb">
            <div style="font-size: 15px; font-weight: 500" id="j-wp">—</div>
            <div class="kv" style="padding: 5px 0; margin-top: 6px"><span style="color: #A3B4CD">Distance</span><span class="num" id="j-wp-d">—</span></div>
            <div class="kv" style="padding: 5px 0"><span style="color: #A3B4CD">Arrive in</span><span class="num" id="j-wp-t">—</span></div>
            <div class="kv" style="padding: 5px 0"><span style="color: #A3B4CD">Doing now</span><span id="j-now">—</span></div>
          </div>
        </section>
      </div>

      <div class="journey-playback">
        <div class="hud-card" style="display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 10px 14px">
          <button class="btn" data-act="j-play" aria-label="Play or pause" style="width: 44px; padding: 0; color: #E4ECF7" id="j-play">▶</button>
          <span class="num" style="font-size: 12px"><span id="j-elapsed">00:00</span> <span style="color: #A3B4CD">/ ${clockDur(P.plan.result.hours)}</span></span>
          <div class="scrub">
            <div style="position: absolute; left: 0; right: 0; top: 14px; height: 6px; border-radius: 3px; background: #24344F"></div>
            ${markers(P)}
            <div id="j-bar" style="position: absolute; left: 0; width: 0; top: 14px; height: 6px; border-radius: 3px; background: #3FB6F2"></div>
            <span id="j-knob" style="position: absolute; left: 0; top: 8px; width: 4px; height: 18px; margin-left: -2px; background: #fff; border-radius: 2px"></span>
            <input type="range" min="0" max="1000" value="0" id="j-scrub" aria-label="Journey position">
          </div>
          <div class="seg" style="flex: 0 0 168px">${[10, 60, 300].map((s) => `<button data-act="j-speed" data-v="${s}" aria-pressed="${s === 60}">×${s}</button>`).join("")}</div>
          <div style="flex: 0 0 auto; padding: 6px 12px; border: 1px solid var(--line-2); border-radius: 6px"><span class="st ${({ "WITHIN ENTERED LIMITS": "pass", "NO-GO": "fail", UNDETERMINED: "und" })[P.plan.outcome]}">${esc(P.plan.outcome.toLowerCase().replace(/^\w/, (c) => c.toUpperCase()))}</span><div class="sub" style="margin-top: 3px; color: #A3B4CD">Not a statement that the journey is safe</div></div>
        </div>
        <p style="font: 400 10.5px/1.3 var(--mono); color: #A3B4CD; text-align: center">${caption}</p>
      </div>
    </div>
    <div class="journey-map-modal" id="j-map-modal" role="dialog" aria-modal="true" aria-label="Expanded mission map" hidden>
      <div class="journey-map-sheet"><div class="journey-map-head"><div><span class="atlas-kicker">LIVE ROUTE / LOCAL MAP</span><b>Jezero traverse</b></div><button class="btn sm" data-act="j-map-close" aria-label="Close expanded map">× Close</button></div>
      ${mapFrame(P, { box: routeBox(P, 4), height: 620, label: "Expanded interactive route map", layers: true, extra: `<span id="j-me-full" data-journey-marker style="position: absolute; transform: translate(-50%, -50%); width: 13px; height: 13px; border-radius: 50%; background: #fff; border: 3px solid #3FB6F2; box-shadow: 0 0 0 5px #3fb6f244"></span>` })}
      <p class="sub">Drag to pan · use + / − to zoom · Escape or Close returns to the journey HUD.</p></div>
    </div>
    <div class="journey-map-modal" id="j-report-modal" role="dialog" aria-modal="true" aria-label="Hypothetical expedition report" hidden><div class="journey-map-sheet report-sheet"><div class="journey-map-head"><div><span class="atlas-kicker">HYPOTHETICAL EXPEDITION REPORT</span><b>Jezero traverse summary</b></div><button class="btn sm" data-act="j-report-close">× Close</button></div><div class="report-grid"><article><span class="lbl">Science target</span><b id="j-report-site">—</b><p id="j-report-science">—</p></article><article><span class="lbl">Modelled traverse</span><b id="j-report-route">—</b><p id="j-report-resources">—</p></article><article><span class="lbl">Hypothetical finding</span><b>Observation plan complete</b><p>Record layer geometry, image context and route conditions for later comparison. This simulation produces no new Mars measurement.</p></article></div><p class="sub">Generated from this model run; not a field report, crew record, or mission-authorized science product.</p></div></div>
  </div>`;
}
const clockDur = (h) => { const m = Math.round(h * 60); return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
function markers(P) {
  const tl = P.plan.result.timeline, T = P.plan.result.hours;
  const out = [];
  let inZone = null;
  tl.forEach((p, i) => {
    if (p.crater && inZone == null) inZone = i;
    if ((!p.crater || i === tl.length - 1) && inZone != null) {
      const a = (tl[inZone].tH / T) * 100, b = (p.tH / T) * 100;
      out.push(`<div style="position: absolute; left: ${a}%; width: ${Math.max(0.6, b - a)}%; top: 14px; height: 6px; background: rgba(232,121,63,.6)"></div>`);
      inZone = null;
    }
    if (!p.moving && (i === 0 || tl[i - 1].moving)) out.push(`<span style="position: absolute; left: ${(p.tH / T) * 100}%; top: 24px; color: #A3B4CD; font: 400 10px/1 var(--mono)">${/science/.test(p.label) ? "stop" : "rest"}</span>`);
  });
  return out.join("");
}

// Live playback. Returns a stop function.
export function startJourney(P, root) {
  const rover = P.plan.result.travelMode === "rover";
  const tl = P.plan.result.timeline, T = P.plan.result.hours, segs = P.segs, places = P.places;
  const $ = (id) => root.querySelector(`#${id}`);
  const st = { t: 0, playing: true, speed: 60, crew: 0, last: 0, raf: 0, atlasKey: "", atlasMode: "route", atlasQuestion: "" };
  const video = $("j-walk-video");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const syncVideo = () => {
    if (st.playing && !reducedMotion.matches) video.play().catch(() => {});
    else video.pause();
  };
  reducedMotion.addEventListener("change", syncVideo);
  const params = P.plan.result.params;
  const cumM = []; let acc = 0; for (const g of segs) { acc += g.horizontalM; cumM.push(acc); }

  async function askAtlas(facts, key) {
    if (st.atlasKey === key) return;
    st.atlasKey = key;
    const target = $("j-atlas"); if (target) target.textContent = "Atlas is reviewing route, terrain and science context…";
    try {
      const res = await fetch("/api/atlas", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ facts }) });
      const data = await res.json();
      if (!res.ok || !data.reply) throw new Error("Atlas unavailable");
      if (target) target.textContent = data.reply;
    } catch {
      if (target) target.textContent = `${facts.action} This local fallback cannot assess live solar weather; consult an approved mission operations source.`;
    }
  }

  function moveMiniMap(pos) {
    const mini = root.querySelector('[aria-label="Your position near the crater"]');
    root.querySelectorAll("[data-journey-marker]").forEach((me) => { me.style.left = `${pos.x}%`; me.style.top = `${pos.y}%`; });
    if (!mini?._v) return;
    const image = mini.querySelector(".img"), width = mini._v.imgW, height = width / (4096 / 3879);
    image.style.left = `${mini.clientWidth / 2 - (pos.x / 100) * width}px`;
    image.style.top = `${mini.clientHeight / 2 - (pos.y / 100) * height}px`;
  }

  function at(t) { let lo = 0, hi = tl.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tl[m].tH < t) lo = m + 1; else hi = m; } return lo; }
  function draw() {
    const i = at(st.t), p = tl[i], m = p.people[st.crew], seg = segs[p.segment ?? 0] ?? segs[0];
    const h = Math.max(0, st.t) * 3600;
    $("j-time").textContent = `T+${String(Math.floor(h / 3600)).padStart(2, "0")}:${String(Math.floor((h % 3600) / 60)).padStart(2, "0")}:${String(Math.floor(h % 60)).padStart(2, "0")}`;
    $("j-elapsed").textContent = clockDur(st.t);
    const sunsetIn = P.env(p.hour).sunset - p.hour;
    $("j-sunset").textContent = sunsetIn > 0 ? `${Math.floor(sunsetIn)} h ${String(Math.round((sunsetIn % 1) * 60)).padStart(2, "0")} min` : "after sunset";
    $("j-temp").textContent = `${f(p.airTempC, 0)} °C`;
    const heading = (Math.atan2((seg.to.x - seg.from.x) * KM_PER_X, -(seg.to.y - seg.from.y) * KM_PER_Y) * 180 / Math.PI + 360) % 360;
    $("j-compass").style.transform = `translateX(${-heading * PX_PER_DEG}px)`;
    $("j-heading").textContent = `${Math.round(heading)}° ${POINTS[Math.round(heading / 45) % 8]}`;
    $("j-o2-record").href = `#/calc/o2-${st.crew}`;
    const carried = m.o2Left == null ? null : m.o2Left + m.o2Used;
    if (carried) {
      const pct = Math.max(0, (m.o2Left / carried) * 100);
      $("j-ring").style.setProperty("--p", pct.toFixed(1)); $("j-ring-t").textContent = `${Math.round(pct)}%`;
      $("j-o2-left").textContent = f(m.o2Left, 0); $("j-o2-of").textContent = ` of ${f(carried, 0)} L`;
      $("j-o2-res").textContent = `${f(carried * params.o2ReserveFraction, 0)} L`;
    } else { $("j-ring-t").textContent = "—"; $("j-o2-left").textContent = "not entered"; $("j-o2-of").textContent = ""; $("j-o2-res").textContent = "—"; }
    $("j-o2-used").textContent = `${f(m.o2Used, 0)} L`; $("j-fat").textContent = f(m.F, 2);
    const exertion = Math.max(0, Math.min(1, (p.vKmh ?? 0) / 3.54 + m.F * .35));
    $("j-hr").textContent = rover ? "Not modeled" : `${Math.round(66 + exertion * 74)} bpm`;
    $("j-exertion").textContent = rover ? "Not modeled" : `${Math.round(exertion * 100)}% model load`;
    $("j-pressure").textContent = `${f(p.pressurePa, 0)} Pa`;
    // Next waypoint and distance to it along the route.
    const k = p.segment ?? 0, back = !!seg.back;
    const target = back ? places[0] : places[seg.leg + 1];
    let endIdx = k; while (endIdx + 1 < segs.length && !!segs[endIdx + 1].back === back && (back || segs[endIdx + 1].leg === seg.leg)) endIdx++;
    const leftM = Math.max(0, cumM[endIdx] - (p.moving ? cumM[k] : cumM[k]));
    $("j-wp").textContent = target?.name ?? "—";
    $("j-wp-n").textContent = back ? "return" : `${seg.leg + 1} of ${places.length - 1}`;
    $("j-wp-d").textContent = `${f(leftM / 1000, 2)} km`;
    $("j-wp-t").textContent = `about ${Math.max(1, Math.round((leftM / 1000) / Math.max(0.5, p.vKmh || (rover ? params.roverV : params.v0)) * 60))} min`;
    $("j-now").textContent = p.moving ? `${rover ? "driving" : "walking"}, ${f(p.vKmh, 1)} km/h, ${f(p.slopeDeg, 0)}°` : p.label;
    const next = tl[Math.min(tl.length - 1, i + 1)], span = Math.max(.0001, next.tH - p.tH);
    const u = next.segment === p.segment ? Math.max(0, Math.min(1, (st.t - p.tH) / span)) : 0;
    const pos = { x: seg.from.x + (seg.to.x - seg.from.x) * u, y: seg.from.y + (seg.to.y - seg.from.y) * u };
    moveMiniMap(pos);
    const frac = Math.min(1, st.t / T), solarDrill = frac >= .52 && frac <= .62;
    $("j-solar").innerHTML = badge(solarDrill ? "model" : "not modelled", solarDrill ? "Solar-event drill active" : "Solar events · training feed");
    const action = solarDrill ? "Training solar-event drill: stop travel and route toward the planned shelter. This is simulated, not a live alert." : (p.moving ? `Maintain ${f(p.vKmh, 1)} km/h. ${f(leftM / 1000, 2)} km remains to ${target?.name ?? "the waypoint"}; monitor terrain and reserve.` : `Hold position: ${p.label}. Resources and route state are updating in the local model.`);
    const science = target?.science ?? target?.description ?? "Document terrain observations along this training leg.";
    $("j-science-site").textContent = target?.name ?? "Traverse context";
    $("j-science").textContent = science;
    $("j-science-data").textContent = "Context: HRSC regional imagery + CTX DEM terrain layer; route outcome remains a simulation.";
    askAtlas({ action, mode: st.atlasMode, question: st.atlasQuestion, waypoint: target?.name ?? "waypoint", distanceKm: +f(leftM / 1000, 2), temperatureC: +f(p.airTempC, 0), doseMsv: +f(p.hMsv, 3), solarState: solarDrill ? "simulated drill" : "no live feed", scienceContext: science }, `${Math.floor(frac * 4)}:${solarDrill}:${st.atlasMode}:${st.atlasQuestion}`);
    // Crater ahead within 1.5 km.
    let ahead = null, dM = 0;
    for (let j = k; j < segs.length && dM < 1500; j++) { if (segs[j].crater && j >= k) { ahead = segs[j]; break; } dM += segs[j].horizontalM; }
    $("j-cr").textContent = ahead ? `Crater ahead · ${ahead.crater}` : "No crater zone ahead";
    $("j-cr-d").textContent = ahead ? (dM < 1 ? "you are in its zone" : `${f(dM / 1000, 2)} km`) : "next 1.5 km";
    $("j-cr-note").textContent = ahead ? "The route follows the terrain around steep walls. Open the crater to compare across and around." : "Clear ground on the planned route.";
    $("j-dose").textContent = f(p.hMsv, 3); $("j-rate").textContent = f(p.doseRateMGyPerH * params.qGCR, 4);
    $("j-bar").style.width = `${frac * 100}%`; $("j-knob").style.left = `${frac * 100}%`; $("j-scrub").value = Math.round(frac * 1000);
    root.querySelector(".traverse-terrain")?.classList.toggle("is-paused", !st.playing);
    if (st.t >= T) { $("j-report-site").textContent = target?.name ?? "Traverse endpoint"; $("j-report-science").textContent = science; $("j-report-route").textContent = `${f(P.plan.result.distanceKm, 1)} km · ${clockDur(T)} model duration`; $("j-report-resources").textContent = `${f(m.o2Used, 0)} L oxygen used by Crew ${st.crew + 1}; ${f(p.hMsv, 3)} mSv modelled dose.`; $("j-report-modal").hidden = false; }
  }
  function frame(now) {
    if (!st.playing) { st.raf = 0; return; }
    st.t = Math.min(T, st.t + ((now - st.last) / 1000) * (st.speed / 3600));
    if (st.t >= T) { st.playing = false; $("j-play").textContent = "▶"; $("j-play-top").textContent = "Resume"; syncVideo(); }
    draw();
    st.last = now; st.raf = requestAnimationFrame(frame);
  }
  root.addEventListener("click", onClick);
  const scrub = $("j-scrub");
  scrub.addEventListener("input", () => { st.t = (scrub.value / 1000) * T; draw(); });
  function onClick(e) {
    const mini = e.target.closest('[aria-label="Your position near the crater"]');
    if (mini && !e.target.closest("button, a")) { const modal = $("j-map-modal"); modal.hidden = false; setTimeout(() => dispatchEvent(new Event("resize")), 0); return; }
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "j-map-close") { $("j-map-modal").hidden = true; return; }
    if (b.dataset.act === "j-report-close") { $("j-report-modal").hidden = true; return; }
    if (b.dataset.act === "j-atlas-mode") { st.atlasMode = b.dataset.mode; st.atlasQuestion = ""; root.querySelectorAll('[data-act="j-atlas-mode"]').forEach((x) => x.setAttribute("aria-pressed", String(x === b))); st.atlasKey = ""; draw(); return; }
    if (b.dataset.act === "j-atlas-ask") { st.atlasQuestion = $("j-atlas-q").value.trim(); st.atlasKey = ""; draw(); return; }
    if (b.dataset.act === "j-play") {
      if (st.t >= T) st.t = 0;
      st.playing = !st.playing;
      syncVideo();
      root.querySelectorAll('[data-act="j-play"]').forEach((x) => { x.textContent = st.playing ? (x.id === "j-play-top" ? "Pause" : "❚❚") : (x.id === "j-play-top" ? "Resume" : "▶"); });
      if (st.playing && !st.raf) { st.last = performance.now(); st.raf = requestAnimationFrame(frame); }
      draw();
    }
    if (b.dataset.act === "j-speed") { st.speed = +b.dataset.v; root.querySelectorAll('[data-act="j-speed"]').forEach((x) => x.setAttribute("aria-pressed", x === b)); }
    if (b.dataset.act === "j-crew") { st.crew = +b.dataset.i; root.querySelectorAll('[data-act="j-crew"]').forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }
  }
  const key = (e) => { if (e.key === "Escape") { if (!$("j-map-modal").hidden) { $("j-map-modal").hidden = true; return; } if (!$("j-report-modal").hidden) { $("j-report-modal").hidden = true; return; } location.hash = "#/map"; return; } if (e.target.closest("input, select, textarea")) return; if (e.code === "Space") { e.preventDefault(); $("j-play").click(); } };
  document.addEventListener("keydown", key);
  $("j-play").textContent = "❚❚"; $("j-play-top").textContent = "Pause";
  draw();
  st.last = performance.now(); st.raf = requestAnimationFrame(frame);
  syncVideo();
  return () => {
    video.pause();
    reducedMotion.removeEventListener("change", syncVideo);
    cancelAnimationFrame(st.raf); root.removeEventListener("click", onClick); document.removeEventListener("keydown", key); };
}
