// Oxygen, effort and fatigue for one crew member (framework section 3).
import { walkVO2 } from "./vendor/physiology.js";

// q = 60 · m · VO2 / 1000   → litres/hour, m in kg, VO2 in ml/kg/min.
export const o2Lph = (bodyKg, vo2) => (60 * bodyKg * vo2) / 1000;

// VO2 = VO2base(v, slope) · ψ(payload, terrain, fatigue).
// Base is the existing suited walking equation (ACSM grade term, Mars gravity, suit + 23 kg carry).
// Extra payload scales by total moved mass; fatigue adds (1 + F).
export function vo2For({ vKmh, slopeDeg, bodyKg, suitAndCarryKg, payloadKg = 0, terrain = 1, F = 0, stopVO2 }) {
  const base = vKmh > 0 ? walkVO2(vKmh, Math.tan((slopeDeg * Math.PI) / 180)) : stopVO2;
  const payload = vKmh > 0 ? (bodyKg + suitAndCarryKg + payloadKg) / (bodyKg + suitAndCarryKg) : 1;
  return base * payload * (vKmh > 0 ? terrain : 1) * (1 + F);
}

// dF/dt = a·W − b·R, i.e. F(k+1) = max(0, F + (a·W − b·R)·Δt) for small steps.
// a = fatigue gain per hour of work (W = 1 while moving). Recovery is proportional to fatigue (R = F while resting),
// with b set so one 10-minute rest removes the configured share. Rest uses the exact decay e^(−bΔt) so the share
// holds whatever the step size (a single Euler step over 10 minutes would remove 36%, not 30%).
export function fatigueStep(F, dtH, { working, resting, gainPerH, recoveryPer10Min }) {
  const decay = resting ? (1 - recoveryPer10Min) ** (dtH / (10 / 60)) : 1;
  return Math.max(0, F * decay + (working ? gainPerH : 0) * dtH);
}
