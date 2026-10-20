-- Keep the morning ledger intact: each slot has an independent daily claim.
CREATE TABLE IF NOT EXISTS social_discovery_posts (
 day TEXT PRIMARY KEY, opportunity_id TEXT, fingerprint TEXT, status TEXT NOT NULL,
 started_at TEXT NOT NULL, finished_at TEXT, post_id TEXT, error_code TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS social_discovery_opportunity
 ON social_discovery_posts(opportunity_id) WHERE status IN ('publishing','published','uncertain');
INSERT OR IGNORE INTO schema_migrations VALUES(3,strftime('%Y-%m-%dT%H:%M:%SZ','now'));
