// Self-checks for the calculation engine. runTests() throws on the first failure and returns the passed names.
// Expected values come from the notebook's hand calculations and the RAD/REMS research.
import {
  OUTCOME, claireRate, columnMass, compareAlternatives, craterGeometry, craterRoutes, crossValidate, equivalentRate,
  fatigueStep, fitWithinSol, gcrRate, monteCarlo, o2Lph, planEVA, resolve, rngFrom, simulate, speedKmh,
} from "../src/index.js";

const near = (got, want, tol, what) => { if (!(Math.abs(got - want) <= tol)) throw new Error(`${what}: got ${got}, want ${want} ± ${tol}`); };
const ok = (cond, what) => { if (!cond) throw new Error(what); };

// Constant environment, so oxygen and time can be compared with the notebook.
const flatEnv = (over = {}) => () => ({ pressurePa: 841.3, airTempC: -50, dailyMeanTempC: -50, daylight: true, sunrise: 6, sunset: 18, ...over });
const belva = { id: "Belva", d: 920, h: 68, alphaDeg: 21, a: 50 };
const notebookPace = { v0: 2.74, restEveryH: 0 }; // notebook: 2.74 km/h on the flat, no scheduled rests

export function runTests() {
  const passed = [], t = (name, fn) => { fn(); passed.push(name); };
  const P = resolve().v;

  t("Belva geometry matches the notebook (horizontal wall run)", () => {
    const g = craterGeometry({ ...belva, slant: false });
    near(g.wallRunM, 177.1, 0.3, "wall run"); near(g.floorM, 565.7, 0.6, "floor"); near(g.acrossM, 1020, 1, "across");
    near(g.aroundM, 1602, 1, "around"); near(g.detourM, 582, 1.5, "detour"); near(g.wallGrade, 0.384, 0.001, "grade"); near(g.depthToDiameter, 0.074, 0.001, "d/D");
  });
  t("Framework geometry uses the sloped wall length", () => {
    const g = craterGeometry(belva);
    near(g.wallM, Math.hypot(177.14, 68), 0.3, "slant wall"); near(g.acrossM, 2 * 50 + 2 * g.wallM + g.floorM, 1e-9, "across formula");
  });
  t("q = 60·m·VO2/1000 gives the notebook's 4.92 factor", () => {
    near(o2Lph(82, 1), 4.92, 1e-9, "L/h per unit VO2"); near(o2Lph(82, 14.04) * 0.0365, 2.52, 0.01, "approach + exit");
  });
  t("Constant-effort pacing reproduces the notebook's wall speeds", () => {
    const s = (deg) => speedKmh({ v0: 2.74, slopeDeg: deg, effort: 0.43, vo2max: P.vo2max, maxSlopeDeg: 30 }).v;
    near(s(0), 2.74, 1e-9, "flat"); near(s(21), 0.87, 0.03, "up 21°"); near(s(-21), 1.85, 0.05, "down 21°");
    ok(speedKmh({ v0: 2.5, slopeDeg: 31, effort: 0.43, vo2max: 36, maxSlopeDeg: 30 }).blocked, "31° should be blocked");
  });
  t("Fatigue: +0.05 per hour walking, a 10-minute rest removes 30%", () => {
    const opts = { gainPerH: 0.05, recoveryPer10Min: 0.3 };
    const F1 = fatigueStep(0, 1, { ...opts, working: true });
    near(F1, 0.05, 1e-12, "after 1 h"); near(fatigueStep(F1, 10 / 60, { ...opts, resting: true }), 0.035, 1e-12, "after rest");
  });
  t("Radiation: reference conditions return the reference dose", () => {
    const Xref = columnMass(P.pressureRefPa, P.gMars);
    near(gcrRate({ doseRef: P.doseRefMGyPerH, X: Xref, Xref, mu: P.mu }), P.doseRefMGyPerH, 1e-15, "no double counting");
    near(P.doseRefMGyPerH * P.qGCR * 24, 0.64, 0.01, "≈ Hassler's 0.64 mSv/day");
  });
  t("Jezero's thinner air adds 3–6% with the measured μ", () => {
    const Xref = columnMass(P.pressureRefPa, P.gMars), X = columnMass(723, P.gMars);
    for (const mu of [0.009, 0.017]) { const extra = gcrRate({ doseRef: 1, X, Xref, mu }) - 1; ok(extra > 0.025 && extra < 0.065, `μ ${mu}: extra ${extra}`); }
  });
  t("Missing solar-event term is flagged, not zero", () => {
    ok(equivalentRate({ dGCR: 1, qGCR: 3 }).sep.includes("not modelled"), "SEP flag");
    near(equivalentRate({ dGCR: 1, qGCR: 3, dSEP: 2, qSEP: 1.5 }).h, 6, 1e-12, "with SEP");
  });
  t("Claire with βT = 0 and μC = μ equals the standard model", () => {
    const a = { doseRef: 1, X: 20, Xref: 22.7 };
    near(claireRate({ ...a, muC: 0.012, betaT: 0, T: -30, Tref: -50 }), gcrRate({ ...a, mu: 0.012 }), 1e-15, "same");
  });

  // Synthetic sols with a known answer: dose depends on pressure (μ = 0.012) and temperature (βT = 0.0004).
  const rng = rngFrom(7), obs = [];
  for (let sol = 0; sol < 40; sol++) for (let k = 0; k < 60; k++) {
    const X = 22 + 0.6 * rng.normal(), T = -50 + 15 * rng.normal();
    obs.push({ sol, X, T, dose: 9 * (1 + 0.02 * (sol % 5)) * Math.exp(-0.012 * (X - 22) + 0.0004 * (T + 50) + 0.003 * rng.normal()) });
  }
  t("Joint fit recovers known coefficients", () => {
    const f = fitWithinSol(obs);
    near(f.mu, 0.012, 3 * f.muSE + 1e-4, "μ"); near(f.betaT, 0.0004, 3 * f.betaTSE + 1e-5, "βT");
  });
  t("Held-out sols: Claire beats standard when temperature really matters", () => {
    const cv = crossValidate(obs, { folds: 4 });
    ok(cv.deltaMAE > 0, `ΔMAE ${cv.deltaMAE}`); ok(cv.n > 2000, "held-out count");
  });

  const across = craterRoutes(belva).across, around = craterRoutes(belva).around;
  const one = (route, params = {}) => simulate({ route, env: flatEnv(), params: { ...notebookPace, ...params } });
  t("Belva across: time and oxygen close to the notebook (slope-length walls)", () => {
    const r = one(across);
    near(r.hours, 0.56, 0.03, "hours"); near(r.people[0].o2UsedL, 41, 2.5, "O₂ L per person");
  });
  t("Belva around: 1.602 km at 2.74 km/h", () => {
    const r = one(around);
    near(r.hours, 0.585, 0.005, "hours"); near(r.people[0].o2UsedL, 40.4, 1.5, "O₂ L per person");
  });
  t("Crater comparison reports around − across", () => {
    const c = compareAlternatives(one(across), one(around));
    near(c.dDistanceKm, craterGeometry(belva).detourM / 1000, 0.002, "Δ distance"); ok(c.dO2L > -5 && c.dO2L < 5, "ΔO₂ small");
  });
  t("A wall over the walking limit is blocked → NO-GO", () => {
    const out = planEVA({ route: across, env: flatEnv(), params: { maxWalkSlopeDeg: 20 }, crew: [{ o2CarriedL: 300 }] });
    ok(out.result.blocked && out.outcome === OUTCOME.nogo, out.outcome);
  });
  t("Missing oxygen supply → UNDETERMINED; entered supply → WITHIN ENTERED LIMITS", () => {
    ok(planEVA({ route: around, env: flatEnv(), crew: [{}, {}] }).outcome === OUTCOME.undetermined, "no supply");
    const out = planEVA({ route: around, env: flatEnv(), crew: [{ o2CarriedL: 300 }, { o2CarriedL: 300 }] });
    ok(out.outcome === OUTCOME.ok, out.checks.map((c) => `${c.name}:${c.status}`).join(", "));
    ok(out.checks.find((c) => c.name.startsWith("Radiation (solar")).status === "undetermined", "solar events stay undetermined");
  });
  t("Too little oxygen for the walk home → NO-GO", () => {
    ok(planEVA({ route: around, env: flatEnv(), crew: [{ o2CarriedL: 60 }] }).outcome === OUTCOME.nogo, "60 L is not enough there and back");
  });
  t("Real MCD climate at Jezero runs end to end", () => {
    const out = planEVA({ route: across, date: "2040-03-15", startHour: 10, crew: [{ o2CarriedL: 300 }], uncertainty: { runs: 50, spread: { bodyKg: 0.1, effort: 0.1, mu: 0.3 } } });
    const s = out.uncertainty.summary.o2L;
    ok(s.p5 <= s.p50 && s.p50 <= s.p95, "percentiles ordered"); ok(out.records.length === 3 && out.records[1].working.length >= 4, "records");
    ok(out.result.timeline.every((p) => Number.isFinite(p.pressurePa) && Number.isFinite(p.airTempC)), "climate values finite");
  });
  t("Monte Carlo is repeatable with a seed", () => {
    const a = monteCarlo({ route: around, env: flatEnv() }, { runs: 20, seed: 3, spread: { effort: 0.1 } });
    const b = monteCarlo({ route: around, env: flatEnv() }, { runs: 20, seed: 3, spread: { effort: 0.1 } });
    near(a.summary.o2L.p50, b.summary.o2L.p50, 0, "same seed, same answer");
  });
  t("Observations pull the oxygen estimate toward the measurement", () => {
    const free = one(around);
    const tracked = simulate({ route: around, env: flatEnv(), params: notebookPace, observations: [{ atH: 0.3, variable: "o2Used", member: 0, value: 30, variance: 0.01 }] });
    ok(tracked.mode === "tracked" && free.mode === "simulation", "modes");
    ok(tracked.people[0].o2UsedL > free.people[0].o2UsedL + 5, "estimate moved up");
  });
  t("Unknown equipment stays null, never invented", () => {
    const r = one(around);
    ok(r.people[0].battery === null && r.people[0].water === null && r.people[0].scrubberG === null && r.people[0].heatJ === null, "nulls");
    const r2 = one(around, { batteryWh: 1000, powerW: 100, scrubberG: 500, coolingW: 300 });
    near(r2.people[0].battery, 1000 - 100 * r2.hours, 1e-6, "battery"); ok(r2.people[0].scrubberG < 500 && r2.people[0].co2G >= 0, "scrubber used");
  });
  return passed;
}
