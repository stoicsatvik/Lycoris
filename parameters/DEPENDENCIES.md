# First-pass parameter dependency plan

This is a conceptual DAG of *derived* quantities, not an assertion of causal identification.

- CTX elevation + pixel spacing + projection + NoData => local terrain elevation, slope, aspect, local uncertainty.
- Terrain slope + roughness + mobility constraints => traversability and candidate route segments.
- Route geometry + segment speed + science-stop durations => outbound travel time and complete return time.
- Route segment effort + astronaut state + suit mass => metabolic O2 rate, CO2 rate, waste heat, fatigue progression.
- O2 rate + suit gas inventory + losses + reserves + time => resource-remaining trajectory and constraint margins.
- Local atmosphere + suit thermal design + metabolic heat => thermal and electrical energy balances.
- Radiation dose rate + exposure duration + shielding/particle assumptions => appropriate dose quantity (never conflate Gy and Sv).
- Time + coordinates + ephemerides + dust optical context => illumination estimates and uncertainty.
- Geological map + science objective + route => potential science benefit (not a measured scalar absent a scoring specification).
- Uncertain inputs + transparent prior/likelihood + credible evidence => posterior predictive uncertainty and sensitivity.

When state loops exist (fatigue affects speed affects elapsed time), evaluate them as time-stepped transitions rather than circular recomputation.

Not all quantities will be available at first. Missing dependencies must cause an explicit `insufficient_evidence` state rather than unsafe zero-filled predictions.
