# Scientific datasets

Purpose: maintain a traceable boundary between external measurements and Lycoris modeling assumptions.

## Stages
- `catalog/` — source registry, discovery notes, data-product metadata, and acquisition requirements.
- `raw/` — original immutable source files (do not commit large datasets to Git).
- `normalized/` — coordinate-, unit-, and time-normalized derivative copies.
- `derived/` — calculated products such as slope fields, route graphs, and sampled environmental context.
- `validation/` — independent reference fixtures, quality audits, and source-comparison records.

No NASA or third-party dataset is included in this initial scaffold.

## Mandatory provenance
Record mission, instrument, exact product ID/version, source URL, acquisition and processing time, coordinate frame, geospatial extent, spatial and temporal resolution, units, missing-data flags, quality measures, checksum, license/attribution, uncertainty, and permitted uses.

Do not label historical observations as current conditions or consider visualization tiles equivalent to quantitative terrain data.
