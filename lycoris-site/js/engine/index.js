// Mars Atlas calculation engine: everything except the UI.
// planEVA() is the one call most callers need; the modules below are exported for direct use and testing.
import { environment } from "./climate.js";
import { checkConstraints, outcome } from "./decide.js";
import { recordsFor } from "./record.js";
import { monteCarlo, simulate } from "./simulate.js";

export * from "./params.js";
export * from "./terrain.js";
export * from "./body.js";
export * from "./radiation.js";
export * from "./resources.js";
export * from "./climate.js";
export * from "./simulate.js";
export * from "./decide.js";
export * from "./record.js";

// input: { route, crew, params, startHour, stops, observations, date, site, outAndBack, uncertainty: {runs, spread} }
export function planEVA({ date, site = "jezero", outAndBack = true, uncertainty = null, required, ...rest }) {
  const input = { ...rest, env: rest.env ?? environment({ site, date }) };
  const result = simulate(input);
  const checks = checkConstraints(input, result, { outAndBack });
  const mc = uncertainty ? monteCarlo(input, uncertainty) : null;
  return { result, checks, outcome: outcome(checks, required), uncertainty: mc, records: recordsFor(result, mc) };
}
