// Environment provider e = C(location, Ls, local time, scenario, source) (framework section 6).
// Uses the Mars Climate Database tables already in the site. Each value says whether it is modelled, measured or
// entered, so the three never blend silently.
import { MCD } from "./vendor/mcd-climate.js";
import { atHour, seasonFor } from "./vendor/season.js";
import { KIND } from "./params.js";

const SOURCE = "Mars Climate Database v6.2, climatology scenario";

// site: "jezero" | "gale". date: "YYYY-MM-DD". Returns a function hour → environment.
export function environment({ site = "jezero", date, overrides = {}, measured = {} } = {}) {
  if (!MCD[site]) throw new Error(`no climate table for site "${site}"`);
  const s = seasonFor(date);
  const air = MCD[site].air2mK;
  const dailyMeanC = Array.from({ length: 24 }, (_, h) => atHour(air, s.ls, h)).reduce((a, k) => a + k, 0) / 24 - 273.15;
  const tag = (value, key, unit) =>
    key in measured ? { value: measured[key], unit, kind: KIND.measured, source: "Observation" }
      : key in overrides ? { value: overrides[key], unit, kind: KIND.entered, source: "Entered by user" }
        : { value, unit, kind: KIND.model, source: SOURCE };
  return (hour) => {
    const pressure = tag(atHour(MCD[site].psPa, s.ls, hour), "pressurePa", "Pa");
    const temp = tag(atHour(air, s.ls, hour) - 273.15, "airTempC", "°C");
    const h = ((hour % 24) + 24) % 24;
    return {
      ls: s.ls, season: s.season, hour,
      pressurePa: pressure.value, airTempC: temp.value, dailyMeanTempC: dailyMeanC, // Claire's Tref: the fit was centred on each sol's mean
      dustTau: tag(s.typicalDustTau, "dustTau", "optical depth").value,
      daylight: h >= s.sunrise && h <= s.sunset, sunrise: s.sunrise, sunset: s.sunset,
      provenance: { pressurePa: pressure, airTempC: temp },
    };
  };
}
