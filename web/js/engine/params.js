// Default parameters for the calculation engine. Every value carries its unit, what kind of value it is, and where it
// came from, so results can say which inputs were measured, modelled, assumed or entered by the user.
import { BODY_KG, FATIGUE, STANDING_VO2, VO2MAX } from "./vendor/physiology.js";
import { CAREER_LIMIT_MSV, EVA_LIMIT_H, SLOPE } from "./vendor/atlas-constants.js";

export const KIND = { measured: "measured", model: "model", assumed: "assumed", entered: "entered", unknown: "not modelled" };
const p = (value, unit, kind, source) => ({ value, unit, kind, source });

export const DEFAULTS = {
  gMars: p(3.71, "m/s²", KIND.measured, "Mars surface gravity"),
  v0: p(2.5, "km/h", KIND.assumed, "Mars Atlas baseline walking speed"),
  roverV: p(6, "km/h", KIND.assumed, "Illustrative constant rover speed"),
  roverVO2: p(5, "ml/kg/min", KIND.assumed, "Low-activity occupant oxygen-use proxy"),
  maxRoverSlopeDeg: p(20, "degrees", KIND.assumed, "Illustrative rover terrain screening limit"),
  effort: p(0.43, "fraction of VO2max", KIND.assumed, "Notebook Belva case: 43% effort"),
  vo2max: p(VO2MAX, "ml/kg/min", KIND.measured, "NASA EVA flight rule, ICES-2026-127"),
  bodyKg: p(BODY_KG, "kg", KIND.measured, "Average crew mass, ICES-2026-127"),
  suitAndCarryKg: p(104 + 23, "kg", KIND.measured, "Suit 104 kg + 23 kg carry, ICES-2026-127"),
  stopVO2: p(STANDING_VO2, "ml/kg/min", KIND.assumed, "Standing/working at a stop (vendor/physiology.js)"),
  fatigueGainPerH: p(FATIGUE.driftPerHour, "1/h", KIND.assumed, "Fatigue drift (vendor/physiology.js)"),
  fatigueRecoveryPer10Min: p(FATIGUE.recovery, "fraction", KIND.assumed, "Share of fatigue recovered per 10-min rest"),
  restEveryH: p(FATIGUE.restEveryHours, "h", KIND.assumed, "Rest schedule (vendor/physiology.js)"),
  restMin: p(FATIGUE.restMinutes, "min", KIND.assumed, "Rest length (vendor/physiology.js)"),
  hazardSlopeDeg: p(SLOPE.hazard, "°", KIND.assumed, "Hazard slope (vendor/atlas-constants.js)"),
  maxWalkSlopeDeg: p(SLOPE.noGoWalk, "°", KIND.assumed, "No-go slope on foot (vendor/atlas-constants.js)"),
  evaLimitH: p(EVA_LIMIT_H, "h", KIND.assumed, "Suit EVA duration limit (vendor/atlas-constants.js)"),
  careerLimitMsv: p(CAREER_LIMIT_MSV, "mSv", KIND.measured, "NASA-STD-3001 career limit"),

  // Radiation, standard model. Reference values are Curiosity RAD/REMS means over the same 142 sols (2012-14, Gale).
  doseRefMGyPerH: p(0.00878, "mGy/h", KIND.measured, "RAD detector E, mean of 142 sols 2012-14 (solar maximum): 8.78 µGy/h"),
  pressureRefPa: p(841.3, "Pa", KIND.measured, "REMS mean pressure over the same 142 sols"),
  mu: p(0.012, "cm²/g", KIND.measured, "Within-sol fit, 142 sols (range 0.009-0.017; Guo et al. 2015: 0.022)"),
  qGCR: p(3.05, "Sv/Gy", KIND.measured, "Hassler et al. 2014: 0.64 mSv/day ÷ 0.21 mGy/day"),
  qSEP: p(null, "Sv/Gy", KIND.unknown, "Solar-event quality factor not modelled"),

  // Experimental Claire: joint pressure + temperature fit (detector B, within-sol, 142 sols). Association only.
  claireMu: p(-0.0004, "cm²/g", KIND.model, "Joint fit pressure term (+0.001 ± 0.005 %/Pa)"),
  claireBetaT: p(0.0004, "1/K", KIND.model, "Joint fit temperature term (+0.040 ± 0.006 %/K)"),

  // Consumables: unknown until the equipment is specified. null means the module reports UNDETERMINED.
  o2CarriedL: p(null, "L per person", KIND.unknown, "Suit oxygen supply not entered"),
  o2ReserveFraction: p(0.3, "fraction", KIND.assumed, "Mars Atlas default reserve"),
  o2LeakLph: p(0, "L/h", KIND.assumed, "Suit leakage not modelled"),
  priorDoseMsv: p(0, "mSv", KIND.assumed, "Crew dose before this EVA"),
  heatStorageLimitJ: p(null, "J", KIND.unknown, "Allowed body heat storage not entered"),
  o2ProcessVarPerH: p(4, "L²/h", KIND.assumed, "Growth of oxygen-estimate uncertainty between observations"),
  batteryWh: p(null, "Wh", KIND.unknown, "Suit battery not entered"),
  powerW: p(null, "W", KIND.unknown, "Suit power draw not entered"),
  waterL: p(null, "L", KIND.unknown, "Water supply not entered"),
  waterUseLph: p(null, "L/h", KIND.unknown, "Drinking + cooling water use not entered"),
  scrubberG: p(null, "g CO₂", KIND.unknown, "Scrubber capacity not entered"),
  scrubberRemovalFraction: p(1, "fraction of production", KIND.assumed, "Scrubber keeps up with production"),
  coolingW: p(null, "W", KIND.unknown, "Suit cooling capacity not entered"),
  envNetW: p(0, "W", KIND.assumed, "Net environmental heat exchange (sunlight, infrared) not modelled"),
};

// Plain values, with user overrides. Overrides are tagged as entered.
export function resolve(overrides = {}) {
  const v = {}, meta = {};
  for (const [k, d] of Object.entries(DEFAULTS)) {
    const o = Object.hasOwn(overrides, k);
    v[k] = o ? overrides[k] : d.value;
    meta[k] = o ? { ...d, value: overrides[k], kind: KIND.entered, source: "Entered by user" } : d;
  }
  return { v, meta };
}
