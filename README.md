# Lycoris

**Explore. Simulate. Verify.**

Lycoris is an evidence-bound Mars EVA planning and training prototype for the 2026 NASA Space Apps Challenge: *Interplanetary Survival Guide: Martian Map*.

**Live prototype:** https://lycoris.buildwithsatvik.workers.dev/

## What it includes

- Interactive Jezero mission map with named locations, terrain imagery, crater context and route exploration.
- Scenario route model that updates distance, duration, oxygen, radiation and return margins from selected inputs.
- Virtual traverse with an illustrative rover point-of-view background, resource instruments, vital-sign estimates, minimap, science objective and end-of-expedition report.
- Atlas companion for contextual route, science and safety questions through a server-side AI endpoint.
- Interactive supplied 3D suit reference with visible subsystems and attribution.
- Evidence workspace for sources, assumptions, formulae and model limitations.
- NASA Mars Trek map synchronization and randomized solar-storm training scenarios.

## Unified state model

```
xₖ₊₁ = xₖ + Δtₖ f(xₖ, uₖ, eₖ; θ) + wₖ
```

Each simulation step updates mission state (such as position, oxygen, water, battery, fatigue and cumulative dose) from elapsed time, crew choices, environment, stated parameters and uncertainty. Outputs remain bounded by the quality and completeness of their inputs.

## Repository structure

- `datasets/` — scientific sources, provenance, processing stages and validation evidence.
- `formulae/` — mathematical specifications, units, dependencies, assumptions and checks.
- `principles/` — first-principles reasoning, Fermi bounds, Bayesian inference and validation standards.
- `human/` — evidence and parameter declarations for human systems research; not crew health data or Mars physiological predictions.

## Scientific and safety boundary

Lycoris is a research concept. It does **not** provide astronaut medical advice, live crew telemetry, real-time solar forecasts, operational route authorization, flight certification or a human-rated suit design.

Observations, derived outputs, hypothetical assumptions and unknowns are kept distinct. Map tiles should use their identified upstream source, and all data products should retain provenance, coordinate reference, units, spatial/temporal support and quality flags.

## Credits

The suit visual is the user-supplied **“Astronaut by Jungle Jim”** GLB, licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Its creator is credited in the application. Rover POV footage is user-supplied illustrative background material, not live Mars imagery or telemetry.
