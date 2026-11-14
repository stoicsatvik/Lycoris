CREATE TABLE IF NOT EXISTS dataset_products (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  source_family TEXT NOT NULL,
  source_product_id TEXT,
  source_url TEXT,
  spatial_context TEXT NOT NULL,
  temporal_context TEXT NOT NULL,
  native_unit TEXT,
  evidence_status TEXT NOT NULL,
  ingestion_status TEXT NOT NULL,
  repository_path TEXT NOT NULL UNIQUE,
  sha256 TEXT,
  row_count INTEGER,
  quality_notes TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (evidence_status IN ('observed_elsewhere_on_mars', 'climatology_model', 'derived_research')),
  CHECK (ingestion_status IN ('registered_not_ingested', 'ingested', 'rejected'))
);

CREATE TABLE IF NOT EXISTS environment_observations (
  id INTEGER PRIMARY KEY,
  dataset_id TEXT NOT NULL REFERENCES dataset_products(id),
  sol INTEGER,
  lmst_hours REAL,
  observed_at_utc TEXT,
  dose_b_ugy_h REAL,
  dose_e_ugy_h REAL,
  pressure_pa REAL,
  air_temperature_k REAL,
  quality_flag TEXT,
  source_row INTEGER NOT NULL,
  UNIQUE(dataset_id, source_row)
);

CREATE INDEX IF NOT EXISTS environment_observations_dataset_sol
  ON environment_observations(dataset_id, sol);

INSERT OR IGNORE INTO dataset_products (
  id, title, source_family, source_product_id, source_url, spatial_context,
  temporal_context, native_unit, evidence_status, ingestion_status,
  repository_path, quality_notes
) VALUES
  (
    'curiosity-rad-observations',
    'Curiosity RAD dose observations',
    'NASA PDS',
    'MSL-M-RAD-3-RDR-V1.0',
    'https://pds.nasa.gov/',
    'Gale Crater; not a Jezero observation',
    'Historical MSL sols from uploaded extraction',
    'uGy/h',
    'observed_elsewhere_on_mars',
    'registered_not_ingested',
    'datasets/raw/data/rad_obs.csv',
    'Do not present as current conditions or direct Jezero radiation.'
  ),
  (
    'curiosity-rad-rems-matched',
    'Matched Curiosity RAD and REMS observations',
    'NASA PDS',
    'MSL-M-RAD-3-RDR-V1.0 + mslrem_1001',
    'https://pds.nasa.gov/',
    'Gale Crater; RAD and REMS records paired by the uploaded analysis',
    'Historical MSL sols from uploaded extraction',
    'uGy/h, Pa, K',
    'derived_research',
    'registered_not_ingested',
    'datasets/raw/data/obs_matched.csv',
    'Pairing gap and quality rules must survive ingestion; association is not a causal Mars-radiation model.'
  ),
  (
    'mcd-jezero-gale-hourly',
    'Mars Climate Database Jezero and Gale hourly table',
    'Mars Climate Database',
    'MCD v6.2',
    'https://www-mars.lmd.jussieu.fr/mcd_python/',
    'Jezero and Gale; modeled climatology rather than live measurements',
    'Seasonal hourly climatology',
    'dataset-specific',
    'climatology_model',
    'registered_not_ingested',
    'datasets/raw/data/mcd_jezero_gale_hourly.csv',
    'Do not present as a real-time forecast or as a rover observation.'
  );
