ALTER TABLE opportunities ADD COLUMN employment_type TEXT NOT NULL DEFAULT 'Not specified';
CREATE TABLE IF NOT EXISTS source_cursors (source_id TEXT PRIMARY KEY, cursor INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS earning_methods (id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, data TEXT NOT NULL, last_checked TEXT, check_status TEXT NOT NULL DEFAULT 'not-checked', last_http_status INTEGER);
CREATE TABLE IF NOT EXISTS automation_state (id TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS social_posts (day TEXT PRIMARY KEY, opportunity_id TEXT, fingerprint TEXT, status TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT, post_id TEXT, error_code TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS social_posts_opportunity ON social_posts(opportunity_id) WHERE status IN ('publishing','published','uncertain');
INSERT OR IGNORE INTO schema_migrations VALUES(2,strftime('%Y-%m-%dT%H:%M:%SZ','now'));
