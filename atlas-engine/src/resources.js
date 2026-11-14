// Heat, battery, water, CO₂ and scrubber balances (framework section 5). A null parameter keeps that module
// UNDETERMINED instead of inventing a value.
import { J_PER_L } from "./vendor/atlas-constants.js";

const known = (...xs) => xs.every((x) => x != null);
export const RQ = 0.85; // respiratory quotient: CO₂ produced per O₂ consumed (by volume)
const CO2_G_PER_L = 1.977; // CO₂ density at 0 °C, 1 atm

// Metabolic heat from oxygen use: litres/hour × J per litre O₂ → watts.
export const metabolicW = (o2Lph) => (o2Lph * J_PER_L) / 3600;

// dU/dt = P_metabolic + P_environment,net − P_cooling  (J, Δt in hours). Not a core-temperature prediction.
export const thermalStep = (U, dtH, { metabolic, envNet, cooling }) =>
  known(U, cooling) ? U + (metabolic + envNet - cooling) * dtH * 3600 : null;

// E(k+1) = E − ΣP·Δt  (Wh, W, h)
export const batteryStep = (E, dtH, powerW) => (known(E, powerW) ? E - powerW * dtH : null);

// W(k+1) = W − (drinking + cooling + loss)·Δt  (L, L/h)
export const waterStep = (W, dtH, useLph) => (known(W, useLph) ? W - useLph * dtH : null);

// CO₂ in the loop and scrubber capacity are separate quantities (grams).
export function co2Step({ co2G, scrubberG }, dtH, o2Lph, removalFraction) {
  const produced = o2Lph * RQ * CO2_G_PER_L * dtH;
  const removed = scrubberG == null ? null : Math.min(produced * removalFraction, Math.max(0, scrubberG));
  return {
    co2G: removed == null ? null : co2G + produced - removed,
    scrubberG: removed == null ? null : scrubberG - removed,
    producedG: produced,
  };
}
