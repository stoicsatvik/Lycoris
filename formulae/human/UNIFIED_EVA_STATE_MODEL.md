# Unified EVA state model

Lycoris uses this governing contract for every added factor:

x[k+1] = x[k] + dt[k] f(x[k], u[k], e[k]; theta) + w[k]

This is a state transition, not a single weighted score. A mission is feasible only
while all hard resource and safety constraints have a viable return path.

## Current state vector

x = (elapsed_s, distance_m, O2_mol, CO2_capacity_mol, cooling_J, battery_J,
water_kg, dose_Sv, fatigue_index, navigation_confidence).

u is the crew decision: speed, route, rest, payload, shelter or return action.
e is observed terrain, weather, radiation, visibility and source context. theta
contains only approved crew, suit and equipment parameters. w is bounded residual
uncertainty. The implementation accepts a qualified rate bundle generated upstream
from (x, u, e, theta, w); it makes accounting explicit.

## Factor admission

Every new factor must declare units, source/evidence ID, valid domain, uncertainty,
and one destination.

| Registry groups | Destination |
| --- | --- |
| Mission, rover, operations, science | u and mission constraints |
| Coordinates, terrain, crater, regolith, meteorology, dust, illumination, radiation, localization, communications | e |
| O2, CO2, thermal, power, water, nutrition | resource components of x |
| Biomechanics, health, cognition | x dynamics or theta |
| Data quality, unknown/rare effects | observation uncertainty or w |

An unbound factor never receives a guessed default: it returns
insufficient_evidence.

## Atlas migration boundary

Migrated clean-room: generic fail-closed grid routing, separate resource inventories,
time-stepped accounting, and an abort-ready state representation.

Not migrated as facts: Atlas fixed VO2/slope/fatigue constants, pressure and
temperature approximations, radiation attenuation, fixed EVA thresholds, visual
image-derived elevation, or inferred terrain. These need a provenance-bound source
and a reviewed parameter bundle before binding.
