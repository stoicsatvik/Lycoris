# Canonical parameter contract v1.0

- **id**: unique dotted namespace, e.g. `atmosphere.air_temperature_k`.
- **unit**: explicit quantity units, `1` for fractions and dimensionless values, `null` for textual metadata.
- **kind**: `observed` (potential scientific data), `derived` (calculated), `scenario` (user-declared hypothetical input), or `metadata`.
- **source_family**: exact science instrument archive or `scenario` / `derived`; not proof that the source's exact column exists.
- **dependencies**: upstream canonical parameter IDs **where already registered**; any as-yet-undeclared dependencies are withheld until interface definition.
- **status**: `declared_unbound` in this initial release. Fields cannot be called source-validated yet.
- **description**: exact intended physical meaning and caveat.

### Binding requirements upon upload
Record source product ID, immutable version/hash, data provider and citation, source column key, native unit, conversion, time representation and observation support, coordinate reference and footprint, calibration/quality flags, missing-values, uncertainty and interpolation policy.

### Revisions
Never silently change an id's physical meaning or dimensional unit. Change the model or field version and record a migration.
