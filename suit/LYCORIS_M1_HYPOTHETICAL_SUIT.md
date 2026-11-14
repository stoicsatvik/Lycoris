# Lycoris M1 hypothetical Mars EVA suit

Status: virtual concept. The word pass in this directory means a passed software
gate only. It is not a design certification, safety finding, medical clearance,
or permission to build or operate human-rated hardware.

## System role

The M1 treats the suit as a one-person spacecraft: pressure garment, life support,
thermal control, power, communications, sensing, mobility, dust management, and
emergency return state all report to the Lycoris unified transition equation.

## Notional concept envelope

| Item | Virtual concept target | Status |
| --- | --- | --- |
| Hard upper torso external envelope | 0.62 m wide x 0.42 m deep x 0.74 m tall | illustration-only |
| PLSS external envelope | 0.58 m x 0.34 m x 0.92 m | illustration-only |
| Dry suit plus PLSS mass | at or below 68.04 kg | virtual requirement |
| Suit pressure concept | 40 kPa nominal pure-oxygen design point | notional; no pressure-vessel analysis |
| EVA operational-life target | at least 100 EVAs | virtual requirement |
| Dust connector target | at least 1,000 dusty cycles | virtual requirement |
| Mars environment interface | 9 torr CO2 support declared | virtual requirement |

The mass, life, connector-cycle and 9 torr Mars-environment targets are drawn from
NASA's PLSS roadmap. They are planning targets, not universal acceptance limits.

## Candidate layer architecture

1. Liquid cooling and ventilation garment: textile liner plus cooling-water tubing.
2. Pressure bladder: polyurethane or urethane-coated nylon heritage candidate.
3. Restraint layer: Dacron heritage candidate.
4. Tear-resistant liner and multilayer insulation: neoprene-coated ripstop and
   aluminized-film heritage candidates.
5. Outer dust/abrasion cover: Ortho-Fabric family candidate. NASA describes
   Ortho-Fabric as a Nomex, Gore-Tex and Kevlar composite; candidate palm material
   is Vectran; candidate dust-repellent glove material includes Teflon.

These are material families for traceability. Selection requires coupon testing,
seam and joint qualification, Mars-dust exposure testing, flammability,
outgassing, aging, radiation, pressure-cycle, and human factors verification.

## Virtual verification gate

The profile must provide evidence identifiers and pass all of:

- mass, EVA-life, dusty-connector-cycle, and Mars-atmosphere planning gates;
- pressure, ppO2 and ppCO2 telemetry capability;
- adjustable thermal control;
- simulated pressure-hold, thermal-vacuum, and human-in-the-loop flags;
- resource viability from the unified formula for the actual mission step.

A run fails closed for missing evidence or a negative resource balance. This follows
NASA's requirement pattern for suit monitoring/recording of pressure, ppO2 and
ppCO2, and for adjustable thermal control.

## Sources

- NASA PLSS Roadmap, 2024: https://ntrs.nasa.gov/api/citations/20240006328/downloads/Roadmap%20ICES-2024-Final%20Rev34.pdf
- NASA-STD-3001 spacesuits: https://www.nasa.gov/reference/11-0-spacesuits-vol-2/
- NASA spacesuit materials on Perseverance: https://www.nasa.gov/missions/mars-2020-perseverance/perseverance-rover/how-nasas-perseverance-is-helping-prepare-astronauts-for-mars/
- NASA human-rated suit testing: https://www.nasa.gov/reference/jsc-space-suits/
