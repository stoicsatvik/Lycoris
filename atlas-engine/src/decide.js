// Return margins, constraints, route choice and crater alternatives (framework sections 8 and 9).
// Claire's experimental dose is reported beside the checks but never decides them.
import { simulate } from "./simulate.js";

const hm = (h) => { const m = Math.round(h * 60); return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; };
export const OUTCOME = { nogo: "NO-GO", undetermined: "UNDETERMINED", ok: "WITHIN ENTERED LIMITS" };

// M_R = remaining − needed to return − reserve.
export const margin = (remaining, returnNeed, reserve) =>
  [remaining, returnNeed, reserve].some((x) => x == null) ? null : remaining - returnNeed - reserve;

// The way back from the end of segment k: the travelled segments reversed, climbs become descents.
const reversed = (route, k) => route.slice(0, k + 1).reverse().map((s) => ({ ...s, dzM: -(s.dzM ?? 0), slopeDeg: -s.slopeDeg, label: `return: ${s.label ?? ""}` }));

// Return needs at the end of every segment, simulated from that point with the crew's fatigue and the local time.
export function returnNeeds(input, result) {
  const ends = [];
  input.route.forEach((seg, k) => {
    const at = result.timeline.findLast((p) => p.segment === k);
    if (!at) return;
    const back = simulate({ ...input, route: reversed(input.route, k), startHour: at.hour, stops: [], observations: [],
      initial: at.people.map((p) => ({ F: p.F, sinceRestH: 0 })) });
    ends.push({ segment: k, atH: at.tH, o2UsedL: at.people.map((p) => p.o2Used), o2ReturnL: back.people.map((p) => p.o2UsedL), hMsv: at.hMsv, hReturnMsv: back.dose.equivalentMsv, returnHours: back.hours });
  });
  return ends;
}

// Every constraint as pass / fail / undetermined. outAndBack: the crew must be able to walk home from every point.
export function checkConstraints(input, result, { outAndBack = true } = {}) {
  const P = result.params, out = [];
  const add = (name, status, detail) => out.push({ name, status, detail });
  const pass = (ok) => (ok ? "pass" : "fail");

  add("Terrain", result.blocked ? "fail" : "pass", result.blocked ? `Segment ${result.blocked.segment} (${result.blocked.label}) is ${Math.abs(result.blocked.slopeDeg).toFixed(1)}°, over the ${P.maxWalkSlopeDeg}° limit` : `Steepest ${result.maxSlopeDeg.toFixed(1)}°`);
  if (result.blocked) return out;

  const back = outAndBack ? returnNeeds(input, result) : [];
  const totalH = result.hours + (outAndBack ? back.at(-1)?.returnHours ?? 0 : 0);
  add("EVA duration", pass(totalH <= P.evaLimitH), `${totalH.toFixed(2)} h of ${P.evaLimitH} h`);
  const endHour = result.startHour + totalH;
  const t0 = input.env(result.startHour);
  add("Daylight", pass(result.startHour >= t0.sunrise && endHour <= t0.sunset), `${hm(result.startHour)}–${hm(endHour)}, sun ${hm(t0.sunrise)}–${hm(t0.sunset)}`);

  result.people.forEach((m, i) => {
    if (m.o2CarriedL == null) return add(`Oxygen, ${m.id}`, "undetermined", "Oxygen carried not entered");
    const reserve = P.o2ReserveFraction * m.o2CarriedL;
    const worst = Math.min(...(outAndBack ? back : [{ o2UsedL: result.people.map((p) => p.o2UsedL), o2ReturnL: result.people.map(() => 0) }]).map((b) => margin(m.o2CarriedL - b.o2UsedL[i], b.o2ReturnL[i], reserve)));
    add(`Oxygen, ${m.id}`, pass(worst >= 0), `Smallest margin ${worst.toFixed(1)} L after a ${reserve.toFixed(0)} L reserve`);
  });

  const limit = P.careerLimitMsv - P.priorDoseMsv;
  const worstDose = Math.min(...(outAndBack ? back : [{ hMsv: result.dose.equivalentMsv, hReturnMsv: 0 }]).map((b) => limit - b.hMsv - b.hReturnMsv));
  add("Radiation (cosmic rays)", pass(worstDose >= 0), `Margin ${worstDose.toFixed(1)} mSv of a ${limit} mSv allowance`);
  add("Radiation (solar events)", "undetermined", result.dose.solarEvent);

  const last = result.people;
  const resource = (name, key, emptyMsg) => last.forEach((m) => add(`${name}, ${m.id}`, m[key] == null ? "undetermined" : pass(m[key] >= 0), m[key] == null ? emptyMsg : `${m[key].toFixed(1)} left`));
  resource("Battery", "battery", "Battery or power draw not entered");
  resource("Water", "water", "Water supply or use not entered");
  resource("CO₂ scrubber", "scrubberG", "Scrubber capacity not entered");
  last.forEach((m) => add(`Heat storage, ${m.id}`, m.heatJ == null || P.heatStorageLimitJ == null ? "undetermined" : pass(m.heatJ <= P.heatStorageLimitJ), m.heatJ == null ? "Cooling capacity not entered" : `${(m.heatJ / 1000).toFixed(0)} kJ stored`));
  return out;
}

// NO-GO if any required check fails; UNDETERMINED if a required check lacks information; otherwise within limits.
export function outcome(checks, required = ["Terrain", "EVA duration", "Daylight", "Oxygen", "Radiation (cosmic rays)"]) {
  const req = checks.filter((c) => required.some((r) => c.name.startsWith(r)));
  if (req.some((c) => c.status === "fail")) return OUTCOME.nogo;
  if (req.some((c) => c.status === "undetermined")) return OUTCOME.undetermined;
  return OUTCOME.ok;
}

// r* = argmax U(r) over routes where every required constraint passes. Default U: shortest time.
export function chooseRoute(candidates, U = (c) => -c.result.hours) {
  const eligible = candidates.filter((c) => c.outcome === OUTCOME.ok);
  return { best: eligible.reduce((b, c) => (b == null || U(c) > U(b) ? c : b), null), eligible: eligible.map((c) => c.name) };
}

// Crater ahead: Δt, ΔO, ΔH = around − across between the same junctions.
export function compareAlternatives(across, around) {
  const o2 = (r) => r.people.reduce((a, m) => a + m.o2UsedL, 0);
  return {
    dHours: around.hours - across.hours, dO2L: o2(around) - o2(across), dHMsv: around.dose.equivalentMsv - across.dose.equivalentMsv,
    dClaireMsv: around.dose.claireMsv - across.dose.claireMsv, dDistanceKm: around.distanceKm - across.distanceKm,
    acrossBlocked: across.blocked, aroundBlocked: around.blocked,
  };
}
