// Terrain, speed and crater geometry (framework section 2).
import { paceFor } from "./vendor/physiology.js";

const D2R = Math.PI / 180;

// Δs = √(Δd² + Δz²), α = atan(Δz / Δd). Signed: positive = climbing.
export function segment(a, b) {
  const horizontalM = Math.hypot(b.x - a.x, b.y - a.y), dzM = b.z - a.z;
  return { horizontalM, dzM, lengthM: Math.hypot(horizontalM, dzM), slopeDeg: Math.atan2(dzM, horizontalM) / D2R };
}

// Turn a polyline of {x, y, z} points (metres) into segments, keeping any per-point attributes (terrain, crater...).
export const segmentsOf = (points) => points.slice(1).map((b, i) => ({ ...points[i], ...segment(points[i], b) }));

// v = v0 · φslope · φterrain · φvisibility · φfatigue · φnavigation.
// φslope is the existing constant-effort pacing rule: the pace that holds the same oxygen rate on this slope,
// relative to the pace on flat ground. φfatigue defaults to 1 because fatigue is already charged in oxygen cost.
export function speedKmh({ v0, slopeDeg, effort, vo2max, maxSlopeDeg, phi = {} }) {
  if (Math.abs(slopeDeg) > maxSlopeDeg) return { v: 0, blocked: true, factors: { slope: 0 } };
  const target = effort * vo2max, grade = Math.tan(slopeDeg * D2R);
  const factors = {
    slope: paceFor(target, grade) / paceFor(target, 0),
    terrain: phi.terrain ?? 1, visibility: phi.visibility ?? 1, fatigue: phi.fatigue ?? 1, navigation: phi.navigation ?? 1,
  };
  return { v: v0 * Object.values(factors).reduce((a, b) => a * b, 1), blocked: false, factors };
}

// t_journey = Σ Δs / v + Σ t_stop.
export const journeyHours = (moves, stopsH = []) =>
  moves.reduce((s, m) => s + m.lengthM / 1000 / m.v, 0) + stopsH.reduce((s, h) => s + h, 0);

// Simplified circular crater: diameter d, depth h, wall angle α, approach a each side (all metres).
// slant: true uses the wall's sloped length √(b² + h²) (framework); false uses horizontal run b (notebook).
export function craterGeometry({ d, h, alphaDeg, a = 50, slant = true }) {
  const b = h / Math.tan(alphaDeg * D2R);
  const wallM = slant ? Math.hypot(b, h) : b;
  const floorM = Math.max(0, d - 2 * b);
  const acrossM = 2 * a + 2 * wallM + floorM;
  const aroundM = Math.PI * (d / 2 + a); // semicircular detour between opposite endpoints
  return { wallRunM: b, wallM, floorM, acrossM, aroundM, detourM: aroundM - acrossM, depthToDiameter: h / d, wallGrade: h / b, bowlOnly: d < 2 * b };
}

// The same crater as route segments, ready for simulate(). Elevation comes from the DEM in real routes.
export function craterRoutes(c) {
  const g = craterGeometry(c), wallRun = g.wallRunM;
  const tag = { crater: c.id ?? "crater" };
  const across = [
    { ...tag, label: "approach", horizontalM: c.a ?? 50, dzM: 0 },
    { ...tag, label: "down the wall", horizontalM: wallRun, dzM: -c.h },
    { ...tag, label: "floor", horizontalM: g.floorM, dzM: 0 },
    { ...tag, label: "up the wall", horizontalM: wallRun, dzM: c.h },
    { ...tag, label: "exit", horizontalM: c.a ?? 50, dzM: 0 },
  ].map(withShape);
  const around = [withShape({ ...tag, label: "around the rim", horizontalM: g.aroundM, dzM: 0 })];
  return { geometry: g, across, around };
}
function withShape(s) {
  return { ...s, lengthM: Math.hypot(s.horizontalM, s.dzM), slopeDeg: Math.atan2(s.dzM, s.horizontalM) / D2R };
}
