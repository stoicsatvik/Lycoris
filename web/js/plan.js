// Turns the planner's inputs into a terrain-aware route and runs the calculation engine on it.
import { CRATERS, loadTerrain } from "./terrain/terrain.js";
import { planLocalRoute } from "./terrain/route.js";
import { LOCAL, localKm } from "./terrain/places.js";
import { compareAlternatives, craterRoutes, environment, planEVA, simulate } from "./engine/index.js";

export { LOCAL, CRATERS, loadTerrain };
export const placeById = (id) => LOCAL.find((p) => p.id === id);
const CRATER_ZONE_M = 100;

export const DEFAULT_STATE = {
  start: "octavia", dest: "belva", stops: [],
  crew: 2, o2: 450, startTime: "09:30", date: "2026-11-14", ret: "back", travelMode: "walk",
  batteryWh: "", powerW: "", waterL: "", waterUseLph: "", scrubberG: "", coolingW: "",
};

const hoursOf = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return (h || 0) + (m || 0) / 60; };
const num = (v) => (v === "" || v == null || !Number.isFinite(+v) ? null : +v);

// Which crater zone (if any) a point is in, in local image percent coordinates.
function craterAt(p) {
  for (const c of CRATERS) if (localKm(p, c) * 1000 < c.diameterM / 2 + CRATER_ZONE_M) return c;
  return null;
}

// Engine segments from the routed samples: horizontal distance from the image frame, height from the CTX DEM.
function engineSegments(route, places) {
  const s = route.samples, z = route.elevations, segs = [];
  // Leg boundaries as fractions of the route, so sample spacing differences don't shift them.
  const legEnds = []; let acc = 0;
  for (const leg of route.legs) { acc += leg.km; legEnds.push(acc / route.km); }
  let total = 0;
  for (let i = 0; i < s.length - 1; i++) total += localKm(s[i], s[i + 1]);
  let km = 0;
  for (let i = 0; i < s.length - 1; i++) {
    const horizontalM = localKm(s[i], s[i + 1]) * 1000;
    if (horizontalM < 0.5) continue;
    const dzM = z[i + 1] - z[i];
    const mid = { x: (s[i].x + s[i + 1].x) / 2, y: (s[i].y + s[i + 1].y) / 2 };
    const frac = (km + horizontalM / 2000) / total;
    km += horizontalM / 1000;
    const found = legEnds.findIndex((e) => frac <= e + 1e-9);
    const leg = found === -1 ? legEnds.length - 1 : found;
    const crater = craterAt(mid);
    segs.push({
      label: `to ${places[leg + 1].name}`, leg, crater: crater?.name ?? (crater ? crater.id : null), from: s[i], to: s[i + 1],
      horizontalM, dzM, lengthM: Math.hypot(horizontalM, dzM), slopeDeg: (Math.atan2(dzM, horizontalM) * 180) / Math.PI,
    });
  }
  return segs;
}

const reverseSeg = (g) => ({ ...g, from: g.to, to: g.from, dzM: -g.dzM, slopeDeg: -g.slopeDeg, label: `return: ${g.label.replace(/^to /, "from ")}`, back: true });

export function crewFor(state) {
  return Array.from({ length: Math.max(1, Math.min(4, +state.crew || 1)) }, (_, i) => ({ id: `Crew ${i + 1}`, o2CarriedL: num(state.o2) }));
}
export function paramsFor(state) {
  const p = {};
  for (const k of ["batteryWh", "powerW", "waterL", "waterUseLph", "scrubberG", "coolingW"]) if (num(state[k]) != null) p[k] = num(state[k]);
  return p;
}

// Plans the whole EVA. Returns everything the views need.
export function computePlan(t, state) {
  const places = [state.start, ...state.stops.map((s) => s.id), state.dest].map(placeById).filter(Boolean);
  if (places.length < 2 || places[0].id === places.at(-1).id && places.length === 2) return { error: "Choose a start and a different destination." };
  const travelMode = state.travelMode === "rover" ? "rover" : "walk";
  const route = planLocalRoute(t, places, travelMode);
  const out = engineSegments(route, places);
  const segs = state.ret === "back" ? [...out, ...out.slice().reverse().map(reverseSeg)] : out;

  // Dwell at each science stop: after the last outbound segment of the leg that reaches it.
  const stops = state.stops.map((s, k) => {
    const idx = out.findLastIndex((g) => g.leg === k);
    return idx < 0 ? null : { after: idx, minutes: +s.min || 0, label: `science stop: ${placeById(s.id)?.name ?? s.id}`, vo2: 10.2 };
  }).filter(Boolean);

  const env = environment({ date: state.date });
  const paceSpread = travelMode === "rover" ? { roverV: 0.15 } : { effort: 0.1 };
  const input = { route: segs, env, date: state.date, crew: crewFor(state), params: paramsFor(state), startHour: hoursOf(state.startTime), stops, travelMode,
    roverPathFound: route.legs.every(leg => leg.pathFound),
    outAndBack: false, uncertainty: { runs: 120, seed: 7, spread: { bodyKg: 0.1, ...paceSpread, mu: 0.3 } } };
  const plan = planEVA(input);
  const crossing = route.craters.filter((c) => c.edgeM < CRATER_ZONE_M);
  return { places, route, segs, outSegs: out, stops, env, input, plan, crossing, state };
}

// Across vs around for one crater, simulated with the same crew, date and start time as the plan.
export function craterComparison(p, crater) {
  const c = { id: crater.name ?? crater.id, d: crater.diameterM, h: crater.depthM, alphaDeg: crater.rimSlopeDeg ?? 20, a: 50 };
  const geo = craterRoutes(c);
  const base = { env: p.env, crew: p.input.crew, params: { ...p.input.params, restEveryH: 0 }, startHour: p.input.startHour, travelMode: p.input.travelMode };
  const across = simulate({ ...base, route: geo.across });
  const around = simulate({ ...base, route: geo.around });
  return { crater, c, geometry: geo.geometry, across, around, diff: compareAlternatives(across, around) };
}

// Small extra records so every headline number has a saved calculation behind it.
export function extraRecords(p) {
  const r = p.plan.result, mc = p.plan.uncertainty?.summary;
  const rover = r.travelMode === "rover";
  return [
    { name: "Distance", output: r.distanceKm, unit: "km", modelVersion: p.plan.records[0].modelVersion,
      inputs: { route: `${p.places.map((x) => x.name).join(" → ")}${p.state.ret === "back" ? " and back" : ""}` }, sources: { route: "Least-cost path over the USGS CTX DEM (measured topography)" },
      working: ["Route found with A* over slope costs on a ~95 m grid", "Δs = √(Δd² + Δz²) summed over 120 samples per leg", `Distance = ${r.distanceKm.toFixed(2)} km`], assumptions: [], uncertainty: null },
    { name: "Duration", output: r.hours, unit: "h", modelVersion: p.plan.records[0].modelVersion,
      inputs: rover ? { roverV: r.params.roverV, stops: p.stops.length } : { v0: r.params.v0, effort: r.params.effort, stops: p.stops.length },
      sources: rover ? { roverV: r.meta.roverV.source } : { v0: "Mars Atlas baseline (assumed)", effort: "Notebook Belva case (assumed)" },
      working: [rover ? "t = Σ Δs / assumed rover speed + Σ stops" : "v = v₀ · φslope (constant-effort pacing); t = Σ Δs / v + Σ stops + scheduled rests", `${r.hours.toFixed(2)} h total`],
      assumptions: rover ? ["Constant planning speed. Rover traction, power and range are not modeled."] : ["Pace slows on slopes so oxygen use stays at the target effort"],
      uncertainty: mc ? mc.hours : null },
  ];
}
