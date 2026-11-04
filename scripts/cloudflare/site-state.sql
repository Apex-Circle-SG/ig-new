CREATE TABLE IF NOT EXISTS ginie_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  value TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT '',
  lease_until INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS site_counts (
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  key TEXT NOT NULL,
  count INTEGER NOT NULL CHECK (count >= 0),
  PRIMARY KEY (kind, day, key)
);
CREATE TABLE IF NOT EXISTS request_limits (
  bucket TEXT PRIMARY KEY,
  expires INTEGER NOT NULL,
  count INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS request_limits_expiry ON request_limits(expires);
CREATE TABLE IF NOT EXISTS scheduled_jobs (
  name TEXT PRIMARY KEY,
  last_attempt INTEGER NOT NULL,
  last_success INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS migration_runs (
  id TEXT PRIMARY KEY,
  complete INTEGER NOT NULL DEFAULT 0
);
