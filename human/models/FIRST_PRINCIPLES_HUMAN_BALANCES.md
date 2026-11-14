# Human physical balance model and dimensional invariants

These are **general physical relationships**, not calibrated Mars-specific physiological coefficients.

## Gas exchange
Metabolic O2 amount `n_O2(t)` (mol): `d n_O2 / dt = metabolic_oxygen_uptake_rate` (mol/s). For demand accumulated over an interval, `n_O2,used = integral rate_O2(t) dt`. Metabolic CO2 amount is separately `integral rate_CO2(t) dt`.

Do not assert a fixed human respiratory exchange ratio without specifying activity and metabolism. Human respiration is a biological demand; suit oxygen inventory and atmosphere must be modeled in a separate subsystem.

## Energy, work and heat
Approximate total metabolic power `P_metabolic = P_external_mechanical_work + P_internal_heat_and_other_stored_energy` with carefully specified boundaries. Neither mechanical efficiency nor a fixed kcal-per-liter-O2 conversion is universal over every physiological state. For heat balance: `dU_body/dt = P_metabolic - P_external_work - Q_removed + Q_external`, if all terms share a consistent system boundary and sign convention.

## Fluid budget
`dW_body/dt = water_intake - (urine + sweat + respiration + gastrointestinal_losses + other)`. Changes in body mass cannot always be interpreted as water alone. Headward fluid redistribution is a *compartment transfer*, not total-body water creation.

## Cardiovascular oxygen delivery
Oxygen delivery to tissues depends on `cardiac_output x arterial_oxygen_content` with explicit volume and time units. Pulse heart rate alone is not oxygen delivery.

## Movement and mechanics
Segmental dynamics depend on inertial mass, local gravity, joint torque, external forces, foot contact, load, and movement time. Gravity changes body weight but **does not change inertial mass**. A mechanical reduction to 0.38g cannot imply that oxygen demand falls to 38% without evidence.

## Dimension and falsification tests
- Integrated flows cannot have units of power or percent.
- At zero duration, accumulated use from finite flow must be zero.
- Total body water must not increase from merely redistributing fluid compartments.
- A lab biomarker cannot be predicted from wearable heart rate alone without calibrated evidence.
- Every calculation must state valid person/population, task, gravity and time domains.
