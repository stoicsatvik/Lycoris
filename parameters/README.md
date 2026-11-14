# Lycoris parameter registry (declarations only)

**Goal:** define stable identifiers, physical meanings, units, evidence categories, dependencies, and future dataset bindings **before** data are uploaded.

## Separate categories
1. `constants/` — official NASA/USGS **published reference values**. Planetary constants, global climatological summaries and **product metadata are not interchangeable**.
2. `domains/` — **requested fields**, not populated data or claims that an instrument measures every field directly. Names are Lycoris canonical names, **not** official CSV column names.
3. `DATASET_BINDINGS.md` — how uploaded raw products map to canonical fields.
4. `DEPENDENCIES.md` — which scientific quantities feed which models.
5. `PRIORITY.md` — ingestion order.

## Data contracts
Domain records use: `id`, `unit`, `kind` (observed/derived/scenario/metadata), `description`, `source_family`, `dependencies`, and `status`.

Every field is unpopulated until its source product and transform are registered and validated. Never substitute numerical NASA mean values for a missing Jezero measurement. Do not invent instrument fields, exact archived CSV names, or human Mars suit safety limits.

`schema_version=1.0.0` is a declaration format version, not evidence of scientific validation.
