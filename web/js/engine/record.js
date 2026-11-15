// Calculation record = {inputs, units, sources, assumptions, model version, working, output, uncertainty}.
// Every displayed number should point to one of these, so the AI guide explains the saved working, not a re-guess.
export const MODEL_VERSION = "mars-atlas-engine 1.0 (2026-11-14)";

export function makeRecord({ name, inputs = {}, output, unit, working = [], uncertainty = null, meta = {}, keys = Object.keys(inputs) }) {
  const sources = {}, assumptions = [];
  for (const k of keys) {
    const m = meta[k];
    if (!m) continue;
    sources[k] = `${m.source} (${m.kind})`;
    if (m.kind === "assumed" || m.kind === "not modelled") assumptions.push(`${k}: ${m.source}`);
  }
  return Object.freeze({ name, inputs, units: Object.fromEntries(keys.map((k) => [k, meta[k]?.unit ?? ""])), sources, assumptions, modelVersion: MODEL_VERSION, working, output, unit, uncertainty, createdAt: new Date().toISOString() });
}

// Records for the headline results of one simulation.
export function recordsFor(result, mc = null) {
  const P = result.params, meta = result.meta;
  const o2 = result.people.map((m) => makeRecord({
    name: `Oxygen used, ${m.id}`, output: m.o2UsedL, unit: "L", meta,
    inputs: result.travelMode === "rover" ? { roverVO2: P.roverVO2, bodyKg: P.bodyKg, o2LeakLph: P.o2LeakLph }
      : { effort: P.effort, vo2max: P.vo2max, bodyKg: P.bodyKg, v0: P.v0, fatigueGainPerH: P.fatigueGainPerH, o2LeakLph: P.o2LeakLph },
    working: ["q = 60 · m · VO2 / 1000 (L/h)", result.travelMode === "rover" ? "Moving VO2 uses an assumed low-activity occupant proxy" : "VO2 = suited walking equation(v, slope) · payload · terrain · (1 + F)", `O₂ = Σ (q + leak) · Δt = ${m.o2UsedL.toFixed(2)} L over ${result.hours.toFixed(2)} h`],
    uncertainty: mc ? { totalCrewO2L: mc.summary.o2L, note: "5th–95th percentile, whole crew" } : { sdL: m.o2SdL },
  }));
  const dose = makeRecord({
    name: "Radiation dose (standard model)", output: result.dose.equivalentMsv, unit: "mSv", meta,
    inputs: { doseRefMGyPerH: P.doseRefMGyPerH, pressureRefPa: P.pressureRefPa, mu: P.mu, qGCR: P.qGCR, qSEP: P.qSEP, gMars: P.gMars },
    working: ["X = P / (10 g)", "Ḋ = Ḋref · exp[−μ (X − Xref)]", "H = Σ Q_GCR · Ḋ · Δt", `Absorbed ${result.dose.gcrMGy.toFixed(4)} mGy → ${result.dose.equivalentMsv.toFixed(4)} mSv`, result.dose.solarEvent],
    uncertainty: mc ? mc.summary.hMsv : null,
  });
  const claire = makeRecord({
    name: "Experimental Claire dose difference (hypothesis scenario)", output: result.dose.claireDeltaMsv, unit: "mSv", meta,
    inputs: { claireMu: P.claireMu, claireBetaT: P.claireBetaT },
    working: ["ln(Ḋ/Ḋref) = −μC (X − Xref) + βT (T − Tref)", "Tref = that sol's mean air temperature", `ΔH = H_Claire − H_standard = ${result.dose.claireDeltaMsv.toFixed(5)} mSv`, "A difference between two model predictions, not measured exposure. Does not affect GO/NO-GO."],
  });
  return [...o2, dose, claire];
}
