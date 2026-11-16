// Master step: x(k+1) = x(k) + Δt · f(x, u, e; θ) + w   (framework section 1).
// x: time, distance, per-person oxygen, fatigue, battery, water, CO₂, scrubber, heat, accumulated dose.
// u: route segments, speeds (via multipliers), stops, payload. e: climate provider. θ: params. w: optional noise.
// With observations it runs in "tracked" mode: y = h(x) + v, merged with a scalar Kalman update.
import { resolve } from "./params.js";
import { speedKmh } from "./terrain.js";
import { fatigueStep, o2Lph, vo2For } from "./body.js";
import { claireRate, columnMass, equivalentRate, gcrRate } from "./radiation.js";
import { batteryStep, co2Step, metabolicW, thermalStep, waterStep } from "./resources.js";

const MAX_STEP_M = 50; // environment and fatigue update at least this often along a segment

// Seeded random numbers so Monte Carlo runs are repeatable.
export function rngFrom(seed = 1) {
  let a = seed >>> 0;
  const uni = () => { a = (a + 0x6d2b79f5) >>> 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  return { uni, normal: () => Math.sqrt(-2 * Math.log(1 - uni())) * Math.cos(2 * Math.PI * uni()) };
}

// input: { route: [segments], env: hour → environment, crew: [{...}], params, startHour, stops: [{after, minutes, vo2?,
//          rest?, label?}], observations: [{atH, variable: "o2Used", member, value, variance}], noise: {o2Sd}, rng }
export function simulate(input) {
  const { route, env, crew = [{}], params = {}, startHour = 9, stops = [], observations = [], noise = {}, rng = null, initial = null } = input;
  const { v: P, meta } = resolve(params);
  const rover = input.travelMode === "rover";
  const Xref = columnMass(P.pressureRefPa, P.gMars);
  const people = crew.map((c, i) => ({
    id: c.id ?? `crew ${i + 1}`, bodyKg: c.bodyKg ?? P.bodyKg, payloadKg: c.payloadKg ?? 0,
    F: initial?.[i]?.F ?? c.fatigue0 ?? 0, o2Used: 0, o2Carried: c.o2CarriedL ?? P.o2CarriedL, o2Var: 0,
    battery: c.batteryWh ?? P.batteryWh, water: c.waterL ?? P.waterL, co2G: 0, scrubberG: c.scrubberG ?? P.scrubberG,
    heatJ: P.coolingW == null ? null : 0, sinceRestH: initial?.[i]?.sinceRestH ?? 0,
  }));
  const s = { t: 0, distM: 0, doseMGy: 0, hMsv: 0, hClaireMsv: 0, sep: null, blocked: null, maxSlope: 0 };
  const timeline = [], obsLeft = [...observations].sort((a, b) => a.atH - b.atH);

  function advance(dtH, { moving, vKmh = 0, slopeDeg = 0, seg = {}, stopVO2, resting = false, label, segIndex = null }) {
    const e = env(startHour + s.t + dtH / 2);
    const X = columnMass(e.pressurePa, P.gMars);
    const dGCR = gcrRate({ doseRef: P.doseRefMGyPerH, X, Xref, mu: P.mu });
    const eq = equivalentRate({ dGCR, qGCR: P.qGCR, qSEP: P.qSEP });
    const dClaire = claireRate({ doseRef: P.doseRefMGyPerH, X, Xref, muC: P.claireMu, betaT: P.claireBetaT, T: e.airTempC, Tref: e.dailyMeanTempC });
    s.doseMGy += dGCR * dtH; s.hMsv += eq.h * dtH; s.hClaireMsv += P.qGCR * dClaire * dtH; s.sep = eq.sep;
    for (const m of people) {
      const vo2 = rover && moving ? P.roverVO2 : vo2For({ vKmh: moving ? vKmh : 0, slopeDeg, bodyKg: m.bodyKg, suitAndCarryKg: P.suitAndCarryKg, payloadKg: m.payloadKg, terrain: seg.terrain ?? 1, F: m.F, stopVO2: stopVO2 ?? P.stopVO2 });
      const q = o2Lph(m.bodyKg, vo2) * (noise.o2Sd && rng ? Math.max(0, 1 + noise.o2Sd * rng.normal()) : 1);
      m.o2Used += (q + P.o2LeakLph) * dtH;
      m.o2Var += P.o2ProcessVarPerH * dtH;
      m.F = fatigueStep(m.F, dtH, { working: moving && !rover, resting, gainPerH: P.fatigueGainPerH, recoveryPer10Min: P.fatigueRecoveryPer10Min });
      m.sinceRestH = resting ? 0 : m.sinceRestH + dtH;
      Object.assign(m, co2Step(m, dtH, q, P.scrubberRemovalFraction));
      m.battery = batteryStep(m.battery, dtH, P.powerW);
      m.water = waterStep(m.water, dtH, P.waterUseLph);
      m.heatJ = thermalStep(m.heatJ, dtH, { metabolic: metabolicW(q), envNet: P.envNetW, cooling: P.coolingW });
      m.vo2 = vo2; m.q = q;
    }
    s.t += dtH; s.distM += moving ? vKmh * 1000 * dtH : 0;
    while (obsLeft.length && obsLeft[0].atH <= s.t) assimilate(obsLeft.shift());
    timeline.push({
      tH: s.t, hour: startHour + s.t, distM: s.distM, label, segment: segIndex, crater: seg.crater ?? null, moving, vKmh, slopeDeg,
      pressurePa: e.pressurePa, airTempC: e.airTempC, daylight: e.daylight, doseRateMGyPerH: dGCR, hMsv: s.hMsv, hClaireMsv: s.hClaireMsv,
      people: people.map((m) => ({ id: m.id, o2Used: m.o2Used, o2Left: m.o2Carried == null ? null : m.o2Carried - m.o2Used, F: m.F, vo2: m.vo2, battery: m.battery, water: m.water, co2G: m.co2G, scrubberG: m.scrubberG, heatJ: m.heatJ })),
    });
  }
  // y = h(x) + v → x ← x + K(y − h(x)), K = σ²x / (σ²x + σ²v). Only oxygen used is tracked for now.
  function assimilate(o) {
    const m = people[o.member ?? 0];
    if (o.variable !== "o2Used" || !m) return;
    const k = m.o2Var / (m.o2Var + o.variance);
    m.o2Used += k * (o.value - m.o2Used); m.o2Var *= 1 - k;
  }
  function rest(minutes, label, stopVO2, segIndex) { advance(minutes / 60, { moving: false, resting: true, stopVO2, label, segIndex }); }

  route.forEach((seg, i) => {
    if (s.blocked) return;
    const sp = rover ? { v: P.roverV, blocked: Math.abs(seg.slopeDeg) >= P.maxRoverSlopeDeg }
      : speedKmh({ v0: P.v0, slopeDeg: seg.slopeDeg, effort: P.effort, vo2max: P.vo2max, maxSlopeDeg: P.maxWalkSlopeDeg, phi: seg });
    s.maxSlope = Math.max(s.maxSlope, Math.abs(seg.slopeDeg));
    if (sp.blocked) { s.blocked = { segment: i, label: seg.label, slopeDeg: seg.slopeDeg }; return; }
    const pieces = Math.max(1, Math.ceil(seg.lengthM / MAX_STEP_M));
    for (let k = 0; k < pieces; k++) {
      if (!rover && P.restEveryH && people.some((m) => m.sinceRestH >= P.restEveryH)) rest(P.restMin, "scheduled rest", undefined, i);
      advance(seg.lengthM / pieces / 1000 / sp.v, { moving: true, vKmh: sp.v, slopeDeg: seg.slopeDeg, seg, label: seg.label, segIndex: i });
    }
    for (const st of stops.filter((x) => x.after === i)) advance(st.minutes / 60, { moving: false, resting: !!st.rest, stopVO2: st.vo2, label: st.label ?? "stop", segIndex: i });
  });

  return {
    mode: observations.length ? "tracked" : "simulation",
    travelMode: rover ? "rover" : "walk",
    hours: s.t, distanceKm: s.distM / 1000, maxSlopeDeg: s.maxSlope, blocked: s.blocked,
    startHour, endHour: startHour + s.t,
    dose: { gcrMGy: s.doseMGy, equivalentMsv: s.hMsv, solarEvent: s.sep, claireMsv: s.hClaireMsv, claireDeltaMsv: s.hClaireMsv - s.hMsv },
    people: people.map((m) => ({ id: m.id, o2UsedL: m.o2Used, o2SdL: Math.sqrt(m.o2Var), o2CarriedL: m.o2Carried, fatigue: m.F, sinceRestH: m.sinceRestH, battery: m.battery, water: m.water, co2G: m.co2G, scrubberG: m.scrubberG, heatJ: m.heatJ })),
    timeline, params: P, meta,
  };
}

// Monte Carlo over uncertain parameters: spread = { name: relativeSd }, routeFn(rng) may vary the geometry too.
export function monteCarlo(input, { runs = 300, seed = 1, spread = {}, routeFn = null } = {}) {
  const rng = rngFrom(seed), base = resolve(input.params).v, out = [];
  for (let r = 0; r < runs; r++) {
    const params = { ...input.params };
    for (const [k, sd] of Object.entries(spread)) params[k] = base[k] * Math.max(0.05, 1 + sd * rng.normal());
    const res = simulate({ ...input, params, route: routeFn ? routeFn(rng) : input.route, rng });
    out.push({ hours: res.hours, o2L: res.people.reduce((a, m) => a + m.o2UsedL, 0), hMsv: res.dose.equivalentMsv, claireMsv: res.dose.claireMsv });
  }
  const pct = (key, q) => { const v = out.map((o) => o[key]).sort((a, b) => a - b); return v[Math.min(v.length - 1, Math.floor(q * v.length))]; };
  const summary = {};
  for (const k of ["hours", "o2L", "hMsv", "claireMsv"]) summary[k] = { p5: pct(k, 0.05), p50: pct(k, 0.5), p95: pct(k, 0.95) };
  return { runs, seed, spread, summary };
}
