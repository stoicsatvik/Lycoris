CREATE TABLE IF NOT EXISTS map_source_checks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  capabilities_url TEXT NOT NULL,
  etag TEXT,
  last_modified TEXT,
  status INTEGER NOT NULL,
  last_checked_at TEXT NOT NULL,
  changed_at TEXT NOT NULL
);
