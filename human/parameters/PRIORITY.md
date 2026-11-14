# Human-EVA model implementation priorities

**Design principle:** sensor-available, source-validated measurements first; latent biological risk predictions last.

## P0 — essential human interfaces for a Marswalk
- `human.anthropometry.body_mass_kg`: anthropometric baseline
- `human.physical_fitness.vo2_max_ml_kg_min`: measured terrestrial capacity if evidence exists; otherwise scenario
- `human.physical_fitness.exercise_steady_power_w`: workload anchor
- `human.locomotion_gait.walking_speed_m_s`: terrain task speed
- `human.locomotion_gait.step_frequency_hz`: locomotion observation
- `human.locomotion_gait.slope_ascending_speed_m_s`: empirical/analog only
- `human.cardiac_function.heart_rate_bpm`: feasible direct measurement, context-dependent
- `human.respiratory_mechanics.respiratory_rate_hz`: respiratory demand proxy
- `human.gas_exchange.oxygen_uptake_mol_s`: **requires breath collection/validated workload model**; HR alone cannot supply it
- `human.gas_exchange.co2_output_mol_s`: separate CO2 exchange estimate
- `human.thermoregulation.core_body_temperature_k`: appropriate sensor/measurement modality
- `human.thermoregulation.body_metabolic_heat_generation_w`: model-dependent heat flux
- `human.fluid_electrolyte.fluid_net_balance_ml`: fluid accounting with known intake/loss
- `human.workload_fatigue.fatigue_physical_rating_score`: named subjective assessment
- `human.sleep_circadian.total_sleep_time_s`: prior sleep episode
- `human.cognitive_function.psychomotor_vigilance_median_rt_ms`: controlled performance test, not automatic inference

## P1 — conditional contextual effects
- Vestibular recovery and postural balance after altered-gravity exposure.
- Carrying-load and task-dependent grip/reach capacity.
- Hydration and thermal stress with source-qualified instrument inputs.
- Sleep/wake and cognitive task completion changes.
- Human response to confinement and mission delays with appropriate self-reports.
- Laboratory blood chemistry, inflammatory and nutritional biomarkers, if actual observations and consent exist.

## P2 — research-only or non-identifiable from existing mission data
- Individualized radiation-induced cancer risk, psychiatric outcomes, unexplored Mars partial-gravity adaptation functions, fully predictive immune/microbiome interactions, organ-level molecular networks, and medication efficacy under Mars exposure.
- These variables may be cataloged and displayed as research gaps but must **not** become confident EVA GO/NO-GO conditions without legitimate validated models.

**Rule:** high parameter count never licenses invention of observations or safety thresholds.
