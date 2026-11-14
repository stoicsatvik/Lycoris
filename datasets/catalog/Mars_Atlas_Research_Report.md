# Mars Atlas: Radiation, Pressure and Climate Research Report

**Prepared:** 14 Nov 2026 · **Scope:** research only. No website files were changed for this report.
**Question:** does the notebook's radiation model, Dose = D₀·e^(−μX) with X = P/g and μ = 0.022 cm²/g, hold up against real Curiosity measurements? Is the Mars Climate Database (MCD) accurate enough to supply pressure and temperature for Jezero?

---

## 1. Summary

| # | Finding | Confidence |
|---|---|---|
| 1 | MCD surface pressure matches Curiosity REMS within **0.4–1.3%** in every season tested. MCD is safe to use for pressure. | High |
| 2 | Within each sol, dose **falls as pressure rises**, as the formula predicts. Measured μ = **0.009–0.017 cm²/g**, below the notebook's 0.022. | Medium-high |
| 3 | Sol 420, the first sol you sent, is a **one-day spike**: +15% above the sols on either side. It is not representative and was excluded. | High |
| 4 | **Correction to my earlier report:** once bad temperature readings are removed, air temperature explains the daily dose swing as well as pressure does. The two move almost exactly opposite to each other (correlation −0.80), so this data cannot tell which one is the cause. | Open question |
| 5 | Comparing different seasons directly gives a misleading answer, because the Sun's activity changes more than the pressure effect. This method needs solar-activity data before it can be used. | High |

**What this means for the model:** keep the pressure-based formula. It is the one with a physical cause, since pressure measures the mass of air overhead. Consider a lower μ of about 0.012 (range 0.009–0.017). Treat temperature as an unresolved research question, not a confirmed effect.

---

## 2. Data used

| Source | What | Where from |
|---|---|---|
| Curiosity **RAD** RDR | Dose rate (µGy/h) from detectors B (silicon) and E (plastic, closer to human tissue), about 80 readings per sol | PDS PPI node: `MSL-M-RAD-3-RDR-V1.0` |
| Curiosity **REMS** ENV RDR (`RNV`) | Surface pressure (Pa), air temperature on boom 2 (K), sampled about every 2 minutes of operation | PDS Atmospheres node: `mslrem_1001` |
| **MCD v6.2** (LMD) | Pressure, 2 m air temperature and dust at Jezero and Gale, every 15° of Ls × every 3 h, climatology scenario | MCD web interface |

### Sol coverage
| Group | Sols | Season (Ls) | Purpose | RAD | REMS |
|---|---|---|---|---|---|
| Low pressure, year 1 | 0–30 | 152–166° | Lowest pressure of the year | 23 | 23 (21 with both) |
| High pressure | 150–200 | 241–273° | Highest pressure of the year | 51 | 49 (missing 193, 194) |
| Around sol 420 | 400–440 | 25–44° | 40 consecutive sols, for the within-sol method | 41 | 41 |
| Low pressure, year 2 | 669–700 | 151–168° | Same season as 0–30, one Mars year later, to measure the Sun's drift | 32 | 32 |

**Total:** 142 usable sols and 8,172 radiation readings matched to REMS within 40 minutes.

---

## 3. Results

### 3.1 Group averages (sol 420 excluded)
| Group | Sols | REMS pressure | MCD pressure (same Ls) | MCD error | Dose E (µGy/day) | Dose B (µGy/day) |
|---|---|---|---|---|---|---|
| Low pressure, year 1 | 21 | 735.8 Pa | 742.2 Pa | +0.9% | 212.0 | 222.0 |
| High pressure | 49 | 918.1 Pa | 930.0 Pa | +1.3% | 221.7 | 229.8 |
| Around sol 420 | 40 | 887.0 Pa | 890.5 Pa | +0.4% | 218.9 | 220.3 |
| Low pressure, year 2 | 32 | 735.7 Pa | ≈742 Pa | ≈+0.9% | 209.1 | 212.0 |

- MCD runs slightly high, but always within 1.3%.
- The two low-pressure groups have identical pressure (735.8 vs 735.7 Pa), which confirms the season repeats exactly from one Mars year to the next.

### 3.2 Sol 420 is a spike
| Sol | 416 | 417 | 418 | 419 | **420** | 421 | 422 | 423 | 424 |
|---|---|---|---|---|---|---|---|---|---|
| Dose E (µGy/day) | 220 | 221 | 221 | 216 | **253** | 224 | 219 | 220 | 221 |
| Pressure (Pa) | 879 | 887 | 882 | 891 | 887 | 885 | 888 | 891 | 893 |

Pressure on sol 420 was normal. The jump fits a small burst of solar particles, but I have not confirmed this against solar event lists.

### 3.3 Dose vs pressure within each sol (main result)
**Method:** within each sol, compare readings taken when pressure was above the sol's average with those taken when it was below (the method of Rafkin et al. 2014). Comparing within a sol cancels the Sun's slow changes.

| Group | Readings | Detector B: μ (cm²/g) | Detector E: μ (cm²/g) | dD/dP, B / E (µGy/day/Pa) |
|---|---|---|---|---|
| Around sol 420 | 3,007 | 0.012 ± 0.002 | 0.016 ± 0.003 | −0.072 / −0.097 |
| High pressure | 2,097 | 0.005 ± 0.001 | 0.012 ± 0.002 | −0.029 / −0.073 |
| Low pressure, year 2 | 2,412 | 0.013 ± 0.002 | 0.025 ± 0.003 | −0.076 / −0.143 |
| Low pressure, year 1 | 656 | 0.007 ± 0.007 | 0.012 ± 0.014 | too few readings |
| **All groups** | **8,172** | **0.009 ± 0.001** | **0.017 ± 0.002** | **−0.053 / −0.098** |
| Notebook / Guo et al. 2015 | – | 0.022 | 0.022 | −0.13 |

- The direction is consistent: in every group and both detectors, higher pressure means lower dose.
- The strength is about 40–75% of the notebook's μ. Detector E, the more tissue-like one, sits closer to the notebook.
- The spread between groups (0.005–0.025) is larger than the error bars, so μ may genuinely vary with season or solar conditions.

### 3.4 Temperature test (the notebook's "colder air = less radiation")
Here dose is fitted against pressure and air temperature together. About 5% of REMS temperature readings were physically impossible (below 170 K, i.e. −103 °C; Gale nights reach about −90 °C) and were removed.

| Group | Detector | Pressure effect | Temperature effect | P–T correlation |
|---|---|---|---|---|
| Around sol 420 | B | −0.012 ± 0.008 %/Pa | **+0.031 ± 0.010 %/K** | −0.79 |
| High pressure | B | −0.009 ± 0.005 %/Pa | +0.007 ± 0.008 %/K | −0.84 |
| Low pressure, year 2 | B | +0.015 ± 0.010 %/Pa | **+0.069 ± 0.011 %/K** | −0.77 |
| **All groups** | **B** | **+0.001 ± 0.005 %/Pa** | **+0.040 ± 0.006 %/K** | −0.80 |
| **All groups** | **E** | **+0.003 ± 0.008 %/Pa** | **+0.075 ± 0.010 %/K** | −0.80 |

**Correction:** my previous report said the silicon detector showed no temperature effect. That result was distorted by the bad temperature readings. With them removed:
- When both are fitted together, temperature takes over the daily dose swing and the pressure effect drops to about zero.
- Readings taken when the air is warmer show slightly higher dose. In sign, that matches your "colder means less radiation" idea.

**Why this is still not proof:**
1. Pressure and temperature are almost perfect opposites within a day: the air is warm and the pressure low in the afternoon, and the reverse at night. With a −0.80 correlation, a statistical fit can credit either one.
2. Physics favors pressure. Air temperature 1.6 m above the ground doesn't change how much air sits overhead, and that mass is what shields from cosmic rays.
3. The temperature term may be the instrument. RAD's own detectors and electronics warm and cool with the day, and that can shift their readings slightly. That would look exactly like a temperature effect.

**How to settle it:** compare readings at the same time of day across many sols, so the day/night cycle cancels and pressure and temperature vary independently with the weather. Alternatively, use RAD's own housekeeping temperatures, if PDS provides them. Neither was done for this report.

### 3.5 Comparing seasons directly
| Group | Sol | Pressure | Dose E | Dose E corrected for the Sun's drift |
|---|---|---|---|---|
| Low, year 1 | ~18 | 736 Pa | 212.0 | 212.0 |
| High | ~174 | 918 Pa | 221.7 | 222.5 |
| Around 420 | ~420 | 887 Pa | 218.9 | 220.8 |
| Low, year 2 | ~685 | 736 Pa | 209.1 | 212.0 |

- The same season one Mars year later shows 1.4% less dose on detector E and 4.5% less on B. That's the Sun's drift.
- Even with a straight-line correction for that drift, the high-pressure group has *more* dose. That gives a negative μ (E: −0.010; B: −0.008), which is physically wrong.
- **Why:** the Sun's effect didn't change in a straight line between 2012 and 2014. Early 2013 was quieter than the trend, which let more cosmic rays in. Comparing seasons needs real solar-activity data (heliospheric modulation potential or neutron-monitor counts). Until then, use the within-sol results in 3.3.

---

### 3.6 Every reading sorted from highest to lowest radiation, with the closest-in-time temperature and pressure
**File:** `radiation_sorted_nearest_conditions.csv`, 8,956 RAD readings, ranked 1 (highest dose, detector E) to 8,956 (lowest).

**How readings were paired:**
- Each radiation reading is paired with the REMS temperature and pressure recorded closest in time. Time runs across midnight, so a reading at 00:05 can pair with a sample from 23:58 the previous sol.
- Temperature uses the closest *valid* reading, skipping the impossible values below 170 K.
- The typical gap is about 10 minutes. The maximum allowed is 60 minutes, and each row shows its exact gap.
- **Flags:** 71 readings are marked `suspect` because they're less than half or more than double their sol's median, which points to very short or partial observations. Sol 420 is marked `spike`. The figures below exclude both, leaving 8,820 readings.

**A. Sorted by raw dose, in tenths of the list (tenth 1 = highest radiation)**
| Tenth | Dose E (µGy/h) | Air temp | Pressure | Recorded in daytime (08–18 h) | Mostly from |
|---|---|---|---|---|---|
| 1 (highest) | 9.40 | **−23.1 °C** | 869.5 Pa | **85%** | High-pressure sols (59%) |
| 2 | 9.06 | −31.1 | 876.8 | 72% | High-pressure sols (53%) |
| 3 | 8.98 | −40.5 | 880.5 | 56% | Sols 400–440 (51%) |
| 4 | 8.92 | −45.0 | 881.0 | 52% | Sols 400–440 (54%) |
| 5 | 8.85 | −47.6 | 868.0 | 45% | Sols 400–440 (54%) |
| 6 | 8.78 | −51.1 | 857.6 | 40% | Sols 400–440 (56%) |
| 7 | 8.69 | −50.9 | 819.4 | 43% | Sols 400–440 (45%) |
| 8 | 8.57 | −49.1 | 777.1 | 45% | Low pressure, year 2 (51%) |
| 9 | 8.43 | −49.0 | 747.5 | 46% | Low pressure, year 2 (75%) |
| 10 (lowest) | 8.09 | **−58.3 °C** | 747.9 Pa | **32%** | Low pressure, year 2 (88%) |

Read naively, this list says "higher pressure means more radiation". That's misleading. The raw ranking is mostly a ranking of *when* the sol was recorded:
- **Top of the list:** early 2013 (the high-pressure sols), when the Sun was quieter and more cosmic rays got through.
- **Bottom of the list:** mid-2014 (low pressure, year 2), near solar maximum.
- **Temperature trend:** the top readings are warmer and mostly daytime.

**B. Sorted by dose compared with its own sol's average** (removes the Sun's drift and the season, leaving only the day/night pattern)
| Tenth | Dose vs its sol | Air temp vs its sol | Pressure vs its sol | Recorded in daytime |
|---|---|---|---|---|
| 1 (highest) | +5.3% | **+17.8 °C** | **−22.0 Pa** | 79% |
| 2 | +1.8% | +13.4 | −16.8 | 75% |
| 3 | +1.2% | +9.7 | −11.8 | 67% |
| 4 | +0.6% | +6.7 | −7.7 | 62% |
| 5 | +0.2% | +1.6 | −1.1 | 53% |
| 6 | −0.3% | −3.2 | +4.2 | 47% |
| 7 | −0.8% | −8.3 | +10.6 | 38% |
| 8 | −1.3% | −10.7 | +13.1 | 35% |
| 9 | −1.9% | −13.6 | +16.4 | 29% |
| 10 (lowest) | −4.9% | **−13.7 °C** | **+15.3 Pa** | 31% |

**What this shows:**
- **A steady pattern:** within a sol, the higher-dose readings come with warmer air *and* lower pressure, mostly in the afternoon. The lower-dose readings come with colder air *and* higher pressure, mostly at night. The pattern is smooth across all ten tenths, so it's real and not noise.
- **Your observation holds:** colder moments do have less radiation.
- **But it doesn't prove temperature is the cause:** every cold moment is also a high-pressure moment (section 3.4), so this table can't say which one drives the dose.
- **Physics points to pressure:** an extra ~37 Pa of air overhead, the swing between tenths 1 and 10, should cut the dose by about 2–4% with μ = 0.009–0.017. The swing measured here is roughly 10%, and much of that spread is counting noise in individual short readings.
- **Range of single readings:** individual readings vary from about 4 to 17 µGy/h, so one reading alone isn't reliable. Compare averages of many readings, as in the tables above.

---

## 4. Jezero climate from MCD (pressure is validated, see 3.1)

### Seasons ranked from highest to lowest radiation
"Extra dose" is relative to Gale's yearly average, using the notebook's μ = 0.022. With the measured μ ≈ 0.012, every value in that column would be roughly halved.

| Rank | Ls | Season | Pressure | Air overhead | Extra dose vs Gale | Air mean (min / max) | Dust |
|---|---|---|---|---|---|---|---|
| 1 | 150 | N. summer | 624 Pa | 16.81 g/cm² | +14.5% | −51 (−74 / −22) °C | 0.30 |
| 2 | 135 | N. summer | 628 | 16.94 | +14.1% | −52 (−73 / −25) | 0.26 |
| 3 | 165 | N. summer | 633 | 17.05 | +13.9% | −51 (−75 / −20) | 0.34 |
| 4 | 120 | N. summer | 648 | 17.46 | +12.8% | −53 (−72 / −27) | 0.26 |
| 5 | 180 | N. autumn | 653 | 17.61 | +12.5% | −52 (−75 / −20) | 0.40 |
| 6 | 105 | N. summer | 677 | 18.26 | +10.9% | −53 (−72 / −30) | 0.27 |
| 7 | 195 | N. autumn | 686 | 18.49 | +10.3% | −52 (−75 / −20) | 0.47 |
| 8 | 90 | N. summer | 712 | 19.20 | +8.6% | −54 (−73 / −31) | 0.28 |
| 9–11 | 0 / 345 / 210 | various | 725 | 19.55 | +7.8% | −53 to −58 | 0.55–0.70 |
| 12 | 330 | N. winter | 732 | 19.72 | +7.4% | −59 (−80 / −31) | 0.68 |
| 13 | 15 | N. spring | 733 | 19.75 | +7.3% | −57 (−78 / −29) | 0.40 |
| 14 | 75 | N. spring | 740 | 19.95 | +6.8% | −56 (−74 / −32) | 0.29 |
| 15 | 315 | N. winter | 744 | 20.06 | +6.6% | −61 (−82 / −34) | 0.67 |
| 16 | 30 | N. spring | 745 | 20.07 | +6.5% | −57 (−77 / −31) | 0.37 |
| 17 | 45 | N. spring | 755 | 20.36 | +5.9% | −57 (−76 / −33) | 0.34 |
| 18 | 60 | N. spring | 756 | 20.37 | +5.8% | −57 (−75 / −32) | 0.32 |
| 19 | 300 | N. winter | 762 | 20.54 | +5.4% | −64 (−83 / −37) | 0.67 |
| 20 | 225 | N. autumn | 764 | 20.61 | +5.3% | −55 (−76 / −26) | 0.85 |
| 21 | 285 | N. winter | 783 | 21.12 | +4.1% | −66 (−84 / −39) | 0.67 |
| 22 | 240 | N. autumn | 795 | 21.42 | +3.4% | −59 (−78 / −31) | 0.89 |
| 23 | 270 | N. winter | 801 | 21.59 | +3.0% | −64 (−82 / −38) | 0.79 |
| 24 | 255 | N. autumn | 808 | 21.77 | +2.6% | −63 (−81 / −36) | 0.91 |

Across the seasons, the highest-radiation seasons are the *warmest* (mean about −51 °C) and the lowest are among the coldest (−63 to −66 °C). That ranking follows pressure, not temperature. It's the opposite of the within-day pattern in 3.4, which is another reason to suspect the within-day temperature effect is instrumental or a stand-in for something else.

---

## 5. Notebook items (Dr. Ayan's Research Notes)

**Numbers the PDF left blank (Belva):**
- Depth ÷ diameter = 0.074
- Wall run = 177 m, wall grade = 38%, floor = 566 m
- Across = 1,020 m, around = 1,601 m, detour = 582 m

**Your dD/dP worked example:**
- −0.022 × 0.0270 × 233 = −0.138 µGy/day per Pa. With Gale's ≈210 µGy/day in place of 233, it becomes −0.125.
- The measured value here is −0.053 (detector B) to −0.098 (detector E).

**Factual fixes before others read the notes:**
- Mars's warmest daytime temperature reaches about +20 °C at the equator in summer, not −20 °C.
- "Every crater on Mars" should read "the 81 craters found around Jezero".

**"+8.8% Jezero spring":**
- MCD gives +6 to +8% in spring with the notebook's μ.
- With the measured μ it becomes about +3 to +5%.

---

## 6. Limitations
- **Daily doses** are medians of the observation rates, not time-weighted averages. The day/night split of observations is uneven.
- **REMS sampling:** I took one row in every 120, which gives about 230 samples per sol. That's enough for pressure, which changes slowly, but rough for temperature.
- **The sol 420 spike** is flagged by a statistical rule only, not checked against solar event catalogues.
- **MCD temperature** has not been validated: the REMS air temperatures need the quality filtering described in 3.4 before they can be compared fairly.
- **All measurements are at Gale.** Using them for Jezero assumes the same physics at a different place and altitude, with pressure taken from MCD.

## 7. Suggested next steps (research only)
1. **Same time of day across sols:** compare at fixed hours to separate temperature from pressure (section 3.4).
2. **Solar-activity data:** get neutron-monitor or modulation-potential values to correct the season-to-season comparison (section 3.5).
3. **Check sol 420** against solar particle event lists.
4. **Jezero itself:** pull Perseverance MEDA pressure to validate MCD where the walks are planned.

---

## 8. Files (all in `research/`)
| File | Contents |
|---|---|
| `radiation_sorted_nearest_conditions.csv` | All 8,956 readings, highest to lowest dose, each with the closest-in-time temperature and pressure, the time gaps and the flags (section 3.6) |
| `data/sol_summary.csv` | One row per sol: group, Ls, daily dose B/E, pressure, air temperature, flag |
| `data/obs_matched.csv` | Every RAD reading with the nearest REMS pressure and temperature |
| `data/rad_obs.csv`, `data/rems_samples.csv` | Raw extracted values |
| `mcd_jezero_gale_hourly.csv`, `mcd_daily_summary.csv`, `mcd_daily_summary_by_radiation.csv` | MCD climate tables |
| `pds_file_manifest.csv` | PDS links for every sol used |
| `scripts/fetch_pds.ps1`, `scripts/analyse.ps1`, `scripts/sort_by_dose.ps1` | Download and analysis scripts. Re-running them only adds missing sols. |
