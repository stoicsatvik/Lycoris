// Journey view: plays the simulated walk back along the engine's timeline, instruments over a ground scene.
import { KM_PER_X, KM_PER_Y } from "./terrain/places.js";
import { badge, clock, esc, f, mapFrame } from "./views.js";

const BELVA = { x: 40.15, y: 46.73 };
const PX_PER_DEG = 4;
const POINTS = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];

export function journeyView(P) {
  const nearBelva = P.route.craters.some((c) => c.crater.id === "belva");
  const scene = nearBelva
    ? `<div class="scene photo" aria-hidden="true"><img src="img/belva-rim-sol772.jpg" alt=""><div class="vig"></div></div>`
    : `<div class="scene" aria-hidden="true"><div class="ground"><img src="img/jezero-terrain.webp" alt="" style="object-position: 50% 50%"></div><div class="haze"></div><div class="vig"></div></div>`;
  const caption = nearBelva
    ? "Photo: Belva crater rim, Perseverance Mastcam-Z, sol 772. Raw image, NASA/JPL-Caltech/ASU. A real view of this crater, not a live view of your position."
    : "Illustrative view built from the orbital image. Not a photograph of this place.";
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
    <div class="layout">
      <div style="display: flex; align-items: center; gap: 12px">
        <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true"><circle cx="13" cy="13" r="10.5" stroke="#E8793F" stroke-width="1.6"/><path d="M5.5 15.5c3.2-4.4 9.6-5.6 15-2.2" stroke="#E4ECF7" stroke-width="1.6" stroke-linecap="round"/><circle cx="18" cy="8.6" r="1.7" fill="#3FB6F2"/></svg>
        <span style="font-size: 15px; font-weight: 600">Mars Atlas<br><span style="font: 400 10px/1.2 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: #A3B4CD">Simulation playback</span></span>
        <a class="btn sm" href="#/map" style="margin-left: auto; color: #E4ECF7; background: rgba(9,15,27,.86)">Exit journey</a>
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

      <div style="display: flex; flex-direction: column; gap: 12px; align-self: center">
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
          <div style="padding: 0 12px 6px; display: flex; justify-content: space-between; align-items: center"><a class="more" href="#/calc/o2-0">View calculation</a>${badge("model", "Model")}</div>
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
      <div class="crosshair" aria-hidden="true" style="align-self: center; justify-self: center">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" stroke="#E4ECF7" stroke-width="1" opacity=".75"><circle cx="60" cy="60" r="34"/><path d="M60 14v22M60 84v22M14 60h22M84 60h22M60 54v12M54 60h12"/></svg>
      </div>
      <div style="display: flex; flex-direction: column; gap: 12px; align-self: center">
        <section class="hud-card" aria-label="Crater ahead">
          <div class="hh" style="color: #E8793F"><span id="j-cr">Crater ahead</span><span class="num" style="letter-spacing: 0; text-transform: none; color: #A3B4CD" id="j-cr-d"></span></div>
          <div class="hb" style="display: flex; flex-direction: column; gap: 8px">
            ${mapFrame(P, { box: [c0.x - r / KM_PER_X, c0.y - r / KM_PER_Y, c0.x + r / KM_PER_X, c0.y + r / KM_PER_Y], height: 132, label: "Your position near the crater", pins: false,
              extra: `<span id="j-me" style="position: absolute; transform: translate(-50%, -50%); width: 10px; height: 10px; border-radius: 50%; background: #fff; border: 2px solid #070C17"></span>` }).replace('class="mapbtns"', 'class="mapbtns" hidden')}
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
            <div style="margin-top: 8px">${badge("not modelled", "Solar events not modelled")}</div>
          </div>
          <div style="padding: 0 12px 6px"><a class="more" href="#/calc/dose">View calculation</a></div>
        </section>
      </div>

      <div style="grid-column: 1 / -1; display: flex; flex-direction: column; gap: 8px">
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
  const tl = P.plan.result.timeline, T = P.plan.result.hours, segs = P.segs, places = P.places;
  const $ = (id) => root.querySelector(`#${id}`);
  const st = { t: 0, playing: false, speed: 60, crew: 0, last: 0, raf: 0 };
  const params = P.plan.result.params;
  const cumM = []; let acc = 0; for (const g of segs) { acc += g.horizontalM; cumM.push(acc); }

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
    const carried = m.o2Left == null ? null : m.o2Left + m.o2Used;
    if (carried) {
      const pct = Math.max(0, (m.o2Left / carried) * 100);
      $("j-ring").style.setProperty("--p", pct.toFixed(1)); $("j-ring-t").textContent = `${Math.round(pct)}%`;
      $("j-o2-left").textContent = f(m.o2Left, 0); $("j-o2-of").textContent = ` of ${f(carried, 0)} L`;
      $("j-o2-res").textContent = `${f(carried * params.o2ReserveFraction, 0)} L`;
    } else { $("j-ring-t").textContent = "—"; $("j-o2-left").textContent = "not entered"; $("j-o2-of").textContent = ""; $("j-o2-res").textContent = "—"; }
    $("j-o2-used").textContent = `${f(m.o2Used, 0)} L`; $("j-fat").textContent = f(m.F, 2);
    // Next waypoint and distance to it along the route.
    const k = p.segment ?? 0, back = !!seg.back;
    const target = back ? places[0] : places[seg.leg + 1];
    let endIdx = k; while (endIdx + 1 < segs.length && !!segs[endIdx + 1].back === back && (back || segs[endIdx + 1].leg === seg.leg)) endIdx++;
    const leftM = Math.max(0, cumM[endIdx] - (p.moving ? cumM[k] : cumM[k]));
    $("j-wp").textContent = target?.name ?? "—";
    $("j-wp-n").textContent = back ? "return" : `${seg.leg + 1} of ${places.length - 1}`;
    $("j-wp-d").textContent = `${f(leftM / 1000, 2)} km`;
    $("j-wp-t").textContent = `about ${Math.max(1, Math.round((leftM / 1000) / Math.max(0.5, p.vKmh || params.v0) * 60))} min`;
    $("j-now").textContent = p.moving ? `walking, ${f(p.vKmh, 1)} km/h, ${f(p.slopeDeg, 0)}°` : p.label;
    // Crater ahead within 1.5 km.
    let ahead = null, dM = 0;
    for (let j = k; j < segs.length && dM < 1500; j++) { if (segs[j].crater && j >= k) { ahead = segs[j]; break; } dM += segs[j].horizontalM; }
    $("j-cr").textContent = ahead ? `Crater ahead · ${ahead.crater}` : "No crater zone ahead";
    $("j-cr-d").textContent = ahead ? (dM < 1 ? "you are in its zone" : `${f(dM / 1000, 2)} km`) : "next 1.5 km";
    $("j-cr-note").textContent = ahead ? "The route follows the terrain around steep walls. Open the crater to compare across and around." : "Clear ground on the planned route.";
    const me = $("j-me"); if (me) { me.style.left = `${seg.to.x}%`; me.style.top = `${seg.to.y}%`; }
    $("j-dose").textContent = f(p.hMsv, 3); $("j-rate").textContent = f(p.doseRateMGyPerH * params.qGCR, 4);
    const frac = Math.min(1, st.t / T);
    $("j-bar").style.width = `${frac * 100}%`; $("j-knob").style.left = `${frac * 100}%`; $("j-scrub").value = Math.round(frac * 1000);
  }
  function frame(now) {
    if (st.playing) {
      st.t = Math.min(T, st.t + ((now - st.last) / 1000) * (st.speed / 3600));
      if (st.t >= T) { st.playing = false; $("j-play").textContent = "▶"; }
      draw();
    }
    st.last = now; st.raf = requestAnimationFrame(frame);
  }
  root.addEventListener("click", onClick);
  const scrub = $("j-scrub");
  scrub.addEventListener("input", () => { st.t = (scrub.value / 1000) * T; draw(); });
  function onClick(e) {
    const b = e.target.closest("[data-act]"); if (!b) return;
    if (b.dataset.act === "j-play") { if (st.t >= T) st.t = 0; st.playing = !st.playing; b.textContent = st.playing ? "❚❚" : "▶"; }
    if (b.dataset.act === "j-speed") { st.speed = +b.dataset.v; root.querySelectorAll('[data-act="j-speed"]').forEach((x) => x.setAttribute("aria-pressed", x === b)); }
    if (b.dataset.act === "j-crew") { st.crew = +b.dataset.i; root.querySelectorAll('[data-act="j-crew"]').forEach((x) => x.setAttribute("aria-pressed", x === b)); draw(); }
  }
  const key = (e) => { if (e.target.closest("input, select, textarea")) return; if (e.code === "Space") { e.preventDefault(); $("j-play").click(); } };
  document.addEventListener("keydown", key);
  draw();
  st.last = performance.now(); st.raf = requestAnimationFrame(frame);
  return () => { cancelAnimationFrame(st.raf); root.removeEventListener("click", onClick); document.removeEventListener("keydown", key); };
}
