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
## Cloudflare catalog API

The repository root contains a Cloudflare Worker backed by D1. It serves a read-only, provenance-aware dataset catalog at `/api/health`, `/api/datasets`, `/api/datasets/:id`, and `/api/observations`. Run `npm install`, then `npm run dev` locally; apply database migrations explicitly before deploying. Raw research files are not copied into D1 until a source-hash and quality-preserving ingestion run is recorded.
