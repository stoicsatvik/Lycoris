# Human parameter registry contract v1.0

Each `human/parameters/<group>/<domain>.json` contains `schema_version`, `group`, `domain`, `description`, `field_count`, `sources`, and the `fields` array.

Each **declared field** contains:
- `id`: stable `human.<domain>.<metric>` dotted identifier. The domain namespace is unique per file.
- `name`: display label.
- `unit`: physical or assay unit; may be `null` for categorical statuses. Units such as `score`, `index` and `log_units` require an identified instrument and scale before use.
- `kind`: `observable`, `derived`, `latent`, `clinical_assessment`, `scenario_input`.
- `description`: proposed meaning, usually with physiological context.
- `measurement_context`: `wearable`, `clinical_exam`, `laboratory`, `imaging`, `functional_test`, `task_log`, `self_report`, `model_only`, or `mixed`. This is a *candidate* modality, not an actual available sensor stream.
- `privacy`: `restricted` for all person-specific medical/psychological variables.
- `binding_status`: always `declared_unbound` at scaffold creation.
- `evidence_status`: a statement that this is a candidate scientific quantity **without directly validated human Mars response**.
- `source_leads`: a list of relevant public research/standards entrypoint IDs in `human/evidence/SOURCES.json`; leads are not proof each parameter is measured there.
- `anatomical_index`: optional site/eye/limb/organ, test or sampling location qualifier. Not an independently estimated variable.

The registry intentionally contains **no measurement values**, baseline ranges, treatment protocols, Mars-specific physiological coefficients, or certified hazard thresholds.

## Future binding and calibration

The future **observation** layer (not committed in this repository scaffold) must separately contain pseudonymous subject identity, time, mission phase/gravity context, native method and units, observation uncertainty, quality flags, consent and evidence provenance.

The future **model specification** must declare input IDs, outputs, equations, parameter evidence, priors and likelihoods where appropriate, numerical test cases, valid gravity and population domain, individual variability, and explicit failure/abstention behavior. A source-lead URL alone is never sufficient.

Do not silently change stable field meaning or convert different assay scales into one universal unit. Publish a versioned schema migration when meaning changes.

## Ethical boundary

Clinical diagnosis and interpretation require qualified assessment. Psychological, reproductive, neurological and medical information must not be inferred from generic performance telemetry or published publicly without appropriate protections and consent.
