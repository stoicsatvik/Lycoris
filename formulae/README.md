# Formula and model specifications

The mathematical registry for Lycoris. Organize by physical and numerical domain rather than by UI screen.

- `units/`: physical dimensions and conversions.
- `geodesy/`: Mars location, reference systems and distance.
- `terrain/`: elevation, gradient, slope and terrain uncertainty.
- `routing/`: route graph, constraints, return trips and path validity.
- `human/`: suited locomotion, metabolism, fatigue and rest.
- `life_support/`: O2, CO2, pressure, thermal and energy inventories.
- `environment/`: atmosphere, radiation, illumination and dust.
- `uncertainty/`: error propagation, probabilistic inference and sensitivity.
- `optimization/`: science value, feasibility and route comparison.

A formula is not scientific evidence by itself: all models need a versioned contract, valid operating domain, dimensional checks, independent tests, and citations. Use `MODEL_TEMPLATE.md` for new models.
