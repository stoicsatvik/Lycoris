// Mission date → Mars season, daylight, climate and radiation estimates at Jezero.
// Astronomy: Allison & McEwen (2000) solar longitude. Radiation: Guo et al. (2015), RAD at Gale.
// Climate (pressure, air temperature, dust): Mars Climate Database v6.2 (LMD), climatology scenario,
// sampled at Jezero and Gale by scripts/fetch-mcd.ps1 → scripts/build-mcd-climate.ps1 → data/mcd-climate.js.
import { MCD, MCD_LS_STEP, MCD_LT_STEP } from "./mcd-climate.js";

const D2R = Math.PI / 180;
const JEZERO_LAT = 18.4;
const MARS_G = 3.71; // m/s²

export function solarLongitude(date) {
  const jd = date.getTime() / 86400000 + 2440587.5;
  const d = jd + 69.184 / 86400 - 2451545; // days since J2000 (TT)
  const M = 19.3871 + 0.52402073 * d;
  const alpha = 270.3871 + 0.524038496 * d;
  const sinM = (k) => Math.sin(k * M * D2R);
  const eqCenter = (10.691 + 3e-7 * d) * sinM(1) + 0.623 * sinM(2) + 0.05 * sinM(3) + 0.005 * sinM(4) + 0.0005 * sinM(5);
  return ((alpha + eqCenter) % 360 + 360) % 360;
}

const SEASONS = ["Northern spring", "Northern summer", "Northern autumn", "Northern winter"];

// Sunlight at local noon relative to the annual average, from solar distance and sun height.
function noonSun(ls) {
  const dec = Math.asin(0.42565 * Math.sin(ls * D2R));
  const r = (1 - 0.0934 ** 2) / (1 + 0.0934 * Math.cos((ls - 251) * D2R));
  return { dec, value: Math.cos(JEZERO_LAT * D2R - dec) / r ** 2 };
}
const ANNUAL = Array.from({ length: 36 }, (_, i) => noonSun(i * 10).value).reduce((s, v) => s + v, 0) / 36;

// ---- MCD grid sampling: linear between 15° Ls rows, smooth (Catmull-Rom) between 3-hour columns, both periodic.
const wrap = (i, n) => ((i % n) + n) % n;
function alongDay(row, hour) {
  const y = wrap(hour, 24) / MCD_LT_STEP, k = Math.floor(y), t = y - k;
  const p = (j) => row[wrap(k + j, row.length)];
  return 0.5 * (2 * p(0) + (p(1) - p(-1)) * t + (2 * p(-1) - 5 * p(0) + 4 * p(1) - p(2)) * t * t + (3 * p(0) - p(-1) - 3 * p(1) + p(2)) * t ** 3);
}
function alongYear(rows, ls, pick) {
  const x = wrap(ls, 360) / MCD_LS_STEP, i = Math.floor(x), f = x - i;
  return pick(rows[wrap(i, rows.length)]) * (1 - f) + pick(rows[wrap(i + 1, rows.length)]) * f;
}
const mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
export const atHour = (rows, ls, hour) => alongYear(rows, ls, (row) => alongDay(row, hour));
export const dailyMean = (rows, ls) => alongYear(rows, ls, mean);

// Gale's annual mean pressure in the same model. Guo et al.'s dose rates are Gale averages, so Jezero's dose is
// rescaled by the Jezero–Gale difference in air overhead. Taking both sites from MCD cancels most model bias.
const GALE_REF_PA = mean(MCD.gale.psPa.map(mean));
const column = (pa) => pa / MARS_G / 10; // g/cm²

// Solar cycle phase is a rough projection: 11-year period from the 2024-25 maximum. Real cycles vary.
// The 250-800 MV range is set so a 2012-13 date reproduces RAD's measured 0.64 mSv/day to within about 10%.
function solarModulation(date) {
  const year = date.getUTCFullYear() + date.getUTCMonth() / 12;
  return 525 + 275 * Math.cos((2 * Math.PI * (year - 2024.8)) / 11);
}

export const STORM_UGY = 8100; // May 2024 event total, Curiosity RAD: the largest it has measured
const STORM_Q = 1.5; // assumption: storm protons weigh less per gray than cosmic rays

export function seasonFor(dateStr) {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const ls = solarLongitude(date);
  const { dec, value } = noonSun(ls);
  const sun = value / ANNUAL;
  const cosH = -Math.tan(JEZERO_LAT * D2R) * Math.tan(dec);
  const halfDay = Math.acos(Math.max(-1, Math.min(1, cosH))) / D2R / 15;

  const pJezero = dailyMean(MCD.jezero.psPa, ls);
  // Dose(X) = D₀ × e^(−μX), X = air overhead in g/cm² = pressure ÷ Mars gravity. μ = 0.022 cm²/g matches
  // RAD's measured −0.13 µGy/day per Pa at Gale (Guo et al. 2015), so this only rescales Gale's measured dose.
  const MU = 0.022;
  const pressureScale = Math.exp(-MU * (column(pJezero) - column(GALE_REF_PA)));
  const phi = solarModulation(date);
  // Dose equivalent: about 0.35 mSv/day at Φ≈1100 MV, up to 1.15 mSv/day at Φ≈250 MV (Guo et al. 2015).
  const eqAt = (f) => 1.15 - ((Math.max(250, Math.min(1100, f)) - 250) / 850) * 0.8;
  const air = MCD.jezero.air2mK.map((r) => r.map((k) => k - 273.15));
  const hourly = Array.from({ length: 24 }, (_, h) => atHour(air, ls, h));
  return {
    ls, season: SEASONS[Math.floor(ls / 90) % 4], sun, sunrise: 12 - halfDay, sunset: 12 + halfDay, pressurePa: pJezero, phi,
    columnGcm2: column(pJezero), galeColumnGcm2: column(GALE_REF_PA), thinAirExtraPct: (pressureScale - 1) * 100,
    doseMsvPerDay: eqAt(phi) * pressureScale,
    doseHighMsvPerDay: 1.15 * pressureScale,
    gyPerSv: 0.21 / 0.64,
    meanC: mean(hourly),
    swingC: Math.max(...hourly) - Math.min(...hourly),
    typicalDustTau: alongYear(MCD.jezero.dustTau, ls, (v) => v),
    airGrid: air,
    stormMsv: (STORM_UGY / 1000) * STORM_Q,
  };
}

// Air temperature 2 m above the ground at Jezero (MCD climatology). A dustier sky than usual damps the daily swing
// around the daily mean: dust warms nights and cools days.
export function airTempC(hour, dust, s) {
  const damp = { clear: 1, hazy: 0.8, storm: 0.55 }[dust] ?? 1;
  return s.meanC + (atHour(s.airGrid, s.ls, hour) - s.meanC) * damp;
}
