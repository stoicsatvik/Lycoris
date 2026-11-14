# Lycoris Python engine

This is an experimental, deterministic computation core for a future Lycoris
integration. It is deliberately separate from the research registries and does not
bind any candidate parameter to a real crew observation or Mars-specific coefficient.

## Included now

- fail-closed A* traversal over a provenance-bearing terrain grid;
- explicit `valid`, `no_path`, `invalid_input`, and `insufficient_evidence` route states;
- time integration of already-qualified human O2, CO2, and metabolic-heat demand rates;
- separate suit O2, CO2-scrubber, and cooling-inventory balances.

## Not included

- a DEM loader, raster projection transform, or real Jezero product;
- a calibrated physiological demand model;
- an official Mars suit specification or flight-safety decision;
- a browser UI, map renderer, or AI-generated calculations.

Run the tests with:

```sh
PYTHONPATH=. python3 -m unittest discover -s tests -v
```
