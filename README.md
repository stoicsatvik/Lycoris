# Lycoris

Scientific mission-planning architecture for the 2026 NASA Space Apps Challenge: Interplanetary Survival Guide: Martian Map.

## Initial repository scope

This first milestone establishes documentation and directories only:

- `datasets/` -> scientific sources, provenance, processing stages, and validation evidence.
- `formulae/` -> mathematical model specifications with units, dependencies, assumptions, and checks.
- `principles/` -> first-principles reasoning, Fermi bounds, Bayesian inference, and scientific validation standards.

No application implementation, external datasets, or empirical Marswalk safety certification are included in this initial scaffold.

## Ground rules

- Observations, derived outputs, hypothetical assumptions, and unknowns stay distinct.
- Data products retain source IDs, planetary coordinate reference, units, spatial and temporal support, and quality flags.
- All scientific outputs must identify model versions, evidence limitations, and reproducible test conditions.
- A modeled route or suit parameter is never described as flight-certified astronaut safety guidance.
- Pre-existing project material may be reused only if authorized and disclosed under applicable event rules and licenses.

## Human systems research library

The [`human/`](human/) subsystem contains evidence and parameter definitions for anatomy, physiology, neuroscience, psychology, space-exposure responses and mission operations. Its 1,691 candidate parameters are **declarations only**, not validated Mars physiological predictions or stored crew health data. See [`human/parameters/INDEX.json`](human/parameters/INDEX.json) for the full domain inventory.
## Mars Atlas calculation engine (JavaScript)

[`atlas-engine/`](atlas-engine/) is a standalone ES-module implementation of the Mars Atlas EVA formula framework: route physics, oxygen and fatigue, standard and Experimental Claire radiation, consumables, MCD climate, return margins and NO-GO / UNDETERMINED / WITHIN ENTERED LIMITS outcomes. It has no UI. Unlike the Python core it uses Atlas planning defaults, each tagged with its provenance. Run `node atlas-engine/test/run.mjs`.

## Cloudflare catalog API

The repository root contains a Cloudflare Worker backed by D1. It serves a read-only, provenance-aware dataset catalog at `/api/health`, `/api/datasets`, `/api/datasets/:id`, and `/api/observations`. Run `npm install`, then `npm run dev` locally; apply database migrations explicitly before deploying. Raw research files are not copied into D1 until a source-hash and quality-preserving ingestion run is recorded.


## NASA Mars Trek map synchronization

`GET /api/maps/nasa-mars-trek` returns NASA Mars Trek WMTS capability URLs for the global MOLA hillshade and controlled Jezero HiRISE mosaic. Map clients must use these upstream services directly rather than copied tiles, so NASA-published tile updates can appear without a Lycoris re-ingestion run. A Cloudflare Cron Trigger checks capability ETag and Last-Modified headers every six hours and exposes the latest check state from that endpoint.


## Solar-storm training scenarios

`GET /api/simulations/solar-storm?journey_day=12&seed=42` produces a deterministic, illustrative solar-storm scenario for journey rehearsal. Omit `seed` for a new scenario and retain the returned seed to reproduce it. The API intentionally provides no dose calculation, medical recommendation, or crew-authorization decision.

`GET /api/space-weather/source` identifies the official NOAA SWPC alerts feed. NASA and NOAA operational monitoring, mission-specific flight rules, vehicle configuration, shelter design, and authorized dosimetry remain the source of real crew decisions.
