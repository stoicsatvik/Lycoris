# Future suit integration: human-only boundary

Human -> Suit, when a suitably justified model exists:
- metabolic O2 demand (mol/s);
- CO2 exhalation/production (mol/s);
- net metabolic heat load (W);
- gross work and external mechanical forces/torques (W, N, N m);
- water and sweating burden (kg/s, context needed);
- required visibility, reach, grip and communications conditions;
- human locomotion and fatigue state, bounded by uncertainty.

Suit -> Human, **not populated here**:
- worn mass/inertia, pressure and gas composition, cooling capacity, joint torques, restraint, noise/visibility, breathing resistance and vibration, available work/rest windows.

Safety-critical model output must give a no-prediction/insufficient-evidence response when prerequisites are unavailable. The future suit subsystem retains ownership of consumables/inventories; this human subsystem only owns human demand and behavior.
