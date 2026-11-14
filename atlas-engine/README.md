# Mars Atlas calculation engine (JavaScript)

A dependency-free ES-module implementation of the Mars Atlas EVA formula framework, covering route physics, oxygen,
fatigue, radiation (standard and Experimental Claire), consumables, climate, return margins and decision outcomes.
It contains no UI.

It runs in the browser or under Node and is separate from the Python core in [`engine/`](../engine/). The Python core
refuses to fill unknown rates with Atlas constants. This engine *does* use documented Atlas planning defaults, and
every one of them is tagged `measured`, `model`, `assumed`, `entered` or `not modelled` (see `src/params.js`).
Results from this engine are planning estimates, not flight-certified guidance.

## Use

```js
import { craterRoutes, planEVA } from "./atlas-engine/src/index.js";

const belva = craterRoutes({ id: "Belva", d: 920, h: 68, alphaDeg: 21, a: 50 });
const plan = planEVA({
  route: belva.around, date: "2040-03-15", startHour: 10,
  crew: [{ o2CarriedL: 300 }, { o2CarriedL: 300 }],
  uncertainty: { runs: 300, spread: { bodyKg: 0.1, effort: 0.1 } },
});
plan.outcome;   // "NO-GO" | "UNDETERMINED" | "WITHIN ENTERED LIMITS"
plan.checks;    // every constraint with pass / fail / undetermined and its detail
plan.records;   // calculation records: inputs, units, sources, assumptions, working, output, uncertainty
```

## Formula map

| Framework section | File | Contents |
|---|---|---|
| 1. Master step, observations | `src/simulate.js` | State stepped at most every 50 m; seeded Monte Carlo; observations update the state with a scalar Kalman step (`mode: "tracked"`), otherwise `mode: "simulation"` |
| 2. Terrain, craters, time | `src/terrain.js` | Δs, signed slope, v = v₀·φ…, journey time, crater across/around, crater → route segments |
| 3. Oxygen, effort, fatigue | `src/body.js` | q = 60·m·VO₂/1000, suited walking VO₂ × payload × terrain × (1 + F), fatigue with exact rest decay |
| 4. Standard radiation | `src/radiation.js` | X = P/(10g), Ḋ = Ḋref·exp[−μ(X − Xref)], Ḣ = Q·Ḋ; solar events reported as "not modelled", never zero |
| 5. Heat, battery, water, CO₂ | `src/resources.js` | Energy, battery, water, CO₂ and scrubber balances; unknown equipment stays `null` → UNDETERMINED |
| 6. Climate | `src/climate.js` | Mars Climate Database v6.2 tables for Jezero and Gale by Ls and hour, each value tagged model, measured or entered |
| 7. Experimental Claire | `src/radiation.js` | ln(Ḋ/Ḋref) = −μC(X − Xref) + βT(T − Tref) + βᵀz, joint within-sol fit, held-out ΔMAE |
| 8. Margins, route choice | `src/decide.js` | Return needs re-simulated from every segment end; NO-GO / UNDETERMINED / WITHIN ENTERED LIMITS; r* = argmax U |
| 9. Crater alerts, records | `src/decide.js`, `src/record.js` | Δt, ΔO, ΔH around − across; calculation records |

Claire's dose is reported beside the standard result but never changes an outcome.

## Key defaults (all overridable)

| Parameter | Value | Kind | Source |
|---|---|---|---|
| Reference dose | 8.78 µGy/h | measured | Curiosity RAD detector E, mean of 142 sols 2012–14 (solar maximum) |
| Reference pressure | 841.3 Pa | measured | Curiosity REMS, same sols |
| μ | 0.012 cm²/g | measured | Within-sol fit, 142 sols (range 0.009–0.017; Guo et al. 2015: 0.022) |
| Q (cosmic rays) | 3.05 Sv/Gy | measured | Hassler et al. 2014 |
| Claire βT | 0.0004 /K | model | Joint fit, detector B. An association only, not a demonstrated cause |
| v₀ | 2.5 km/h | assumed | Mars Atlas baseline |
| Suit O₂, battery, water, scrubber, cooling | — | not modelled | Must be entered; checks stay UNDETERMINED until then |

The research behind these values is in [`datasets/raw/Mars_Atlas_Research_Report.md`](../datasets/raw/Mars_Atlas_Research_Report.md).

## Vendored files

`src/vendor/` holds copies of the Mars Atlas website files the engine builds on: the suited walking and pacing model
(`physiology.js`), the season and MCD sampler (`season.js`), the MCD tables (`mcd-climate.js`) and four constants
(`atlas-constants.js`). Keep them in step with the website if either changes.

## Tests

```bash
node atlas-engine/test/run.mjs
```

22 assert-based checks. They cover the notebook's Belva geometry and wall speeds, the 4.92 L/h oxygen factor,
fatigue recovery, the radiation reference and the Hassler cross-check, the solar-event flag, Claire reducing to the
standard model, recovery of known coefficients by the joint fit, held-out ΔMAE, the NO-GO / UNDETERMINED / WITHIN
outcomes, the walk-home oxygen margin, real MCD climate end to end, seeded Monte Carlo, observation updates and the
`null` handling for unknown equipment.

## Known limits

- The heat balance is a simple energy budget, not a core-temperature model.
- Terrain, visibility and navigation multipliers default to 1 unless a route supplies them.
- Shelter and crater shielding are not modelled.
- Only oxygen use is updated from observations.
- Radiation is scaled from Gale to Jezero through pressure; the dose reference is from solar maximum.
