# Human-system architecture

## State definition
For astronaut `a`, state `H_a(t)` is a structured vector of physiologic, neuromotor, psychological, behavioral and clinical variables. Covariates include individual baselines, injury status, age-related physiology, prior exposure, acclimatization, treatment and mission phases.

Exposures `E(t)`: gravity, thermal and respiratory environment, atmospheric pressure and composition, radiation quality and dose, motion, visual/aural workload, habitat isolation, communication delay, available food/water, activity schedule, light, noise and dust.

Tasks `U(t)`: walking, climbing, sampling, resting, eating, sleeping, exercising, emergency procedures and interactions with others.

**Transition model:** `H(t + dt) = F_human(H(t), E(t), U(t), theta, stochastic_perturbation)`. This is a *model interface*, not yet a calibrated function.

**Measurements:** `Y(t) = G(H(t), modality, timing, noise, missingness)`. Many latent psychological or biological states cannot be uniquely reconstructed from a wearable sensor. Observation and state must remain separate.

**Mission consequences:** metabolic O2/CO2 rates, metabolic heat, gait pace and stability, fatigue, task error, rest demand and human-driven return decisions. If evidence is insufficient, the engine must abstain.

## Timescales
- Immediate seconds–minutes: oxygen demand, heart rate, respiration, balance, workload, acute symptoms.
- Hours–days: fatigue, sleep, hydration, glucose availability, cognition, inflammation, early acclimatization.
- Weeks–months: muscular/osseous changes, cardiovascular deconditioning, nutrition status, immune and circadian effects.
- Months–years: long-term radiation associations, psychological adjustment, medical events and recovery after re-entry.

## Mission phases
Preflight Earth baseline -> launch/high acceleration -> outward transit microgravity -> Mars descent and landing -> 0.38g acclimatization -> habitat routine -> EVA -> illness/contingency -> surface return -> interplanetary transit -> Earth re-adaptation.

**No direct human Mars surface observations.** All long-duration human Mars responses are scenario inputs or transfer estimates.

## Dependencies and non-independence
Example coupled pathway: lower-gravity locomotor mechanics -> joint loading -> altered gait and muscle activation -> energy use -> oxygen demand and heat -> hydration/fatigue -> pace and balance -> time on surface.

Example psychosocial pathway: sleep timing + circadian phase + task load + interpersonal friction -> observed psychomotor performance under contextual assumptions. These are interacting influences, not diagnostic causal certainty.

Do not multiply arbitrary "fatigue", "stress", and "Mars gravity" penalties if they share the same underlying physiological mechanism. Use latent-state models or explicitly documented regression structure and covariance.

## Interface to suit (future)
Human subsystem outputs: metabolic O2, CO2 and heat flux, sweat/fluid needs, hand/leg torque and task interface restrictions, sensory/communication requirements. Inputs: physical load, resistance to motion, permitted breathing gas pressure/composition, cooling performance and safety equipment properties. Suit is not implemented in this directory.
