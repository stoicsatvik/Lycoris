# Lycoris Python engine

A deterministic, evidence-aware computation core. It does not bind candidate
parameters to a real crew observation or Mars-specific coefficient.

Included:

- fail-closed A-star routing over a provenance-bearing terrain grid;
- explicit valid, no_path, invalid_input, insufficient_evidence, and
  resource_exceeded outcomes;
- time integration of separately tracked O2, CO2, and thermal inventories;
- unified EVA state propagation for distance, consumables, power, water, dose,
  fatigue, and navigation confidence.

The governing contract is documented in
formulae/human/UNIFIED_EVA_STATE_MODEL.md. Rates are evidence-qualified inputs
from upstream models/observations; this package does not replace unknown
physiology, terrain, weather, or radiation with Atlas constants.

Run:

    PYTHONPATH=. python3 -m unittest discover -s tests -v
