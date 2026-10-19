CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sources (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, url TEXT NOT NULL,
 access_method TEXT NOT NULL, status TEXT NOT NULL, policy TEXT NOT NULL,
 last_success TEXT, last_error TEXT, last_count INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS opportunities (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL REFERENCES sources(id), external_id TEXT NOT NULL,
 title TEXT NOT NULL, organization TEXT NOT NULL, category TEXT NOT NULL,
 location TEXT NOT NULL, work_mode TEXT NOT NULL, reward TEXT NOT NULL,
 skills TEXT NOT NULL DEFAULT '[]', excerpt TEXT NOT NULL, source_url TEXT NOT NULL,
 published_at TEXT, last_seen_at TEXT NOT NULL, expires_at TEXT,
 status TEXT NOT NULL DEFAULT 'active', fingerprint TEXT NOT NULL,
 UNIQUE(source_id, external_id)
);
CREATE INDEX IF NOT EXISTS opportunities_status_date ON opportunities(status, published_at DESC, id);
CREATE INDEX IF NOT EXISTS opportunities_source_status ON opportunities(source_id, status, last_seen_at);
CREATE INDEX IF NOT EXISTS opportunities_fingerprint ON opportunities(fingerprint);
CREATE VIRTUAL TABLE IF NOT EXISTS opportunities_search USING fts5(title, organization, skills, location, excerpt, content='opportunities', content_rowid='rowid');
CREATE TRIGGER IF NOT EXISTS opportunity_insert AFTER INSERT ON opportunities BEGIN
 INSERT INTO opportunities_search(rowid,title,organization,skills,location,excerpt) VALUES(new.rowid,new.title,new.organization,new.skills,new.location,new.excerpt);
END;
CREATE TRIGGER IF NOT EXISTS opportunity_delete AFTER DELETE ON opportunities BEGIN
 INSERT INTO opportunities_search(opportunities_search,rowid,title,organization,skills,location,excerpt) VALUES('delete',old.rowid,old.title,old.organization,old.skills,old.location,old.excerpt);
END;
CREATE TRIGGER IF NOT EXISTS opportunity_update AFTER UPDATE OF title,organization,skills,location,excerpt ON opportunities BEGIN
 INSERT INTO opportunities_search(opportunities_search,rowid,title,organization,skills,location,excerpt) VALUES('delete',old.rowid,old.title,old.organization,old.skills,old.location,old.excerpt);
 INSERT INTO opportunities_search(rowid,title,organization,skills,location,excerpt) VALUES(new.rowid,new.title,new.organization,new.skills,new.location,new.excerpt);
END;
CREATE TABLE IF NOT EXISTS ideas (
 id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT NOT NULL, description TEXT NOT NULL,
 buyer TEXT NOT NULL, experiment TEXT NOT NULL, delivery TEXT NOT NULL, caveat TEXT NOT NULL,
 skills TEXT NOT NULL, startup TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'unvalidated'
);
CREATE TABLE IF NOT EXISTS platforms (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, url TEXT NOT NULL,
 description TEXT NOT NULL, eligibility TEXT NOT NULL, payment TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS ingestion_runs (
 id TEXT PRIMARY KEY, source_id TEXT NOT NULL, started_at TEXT NOT NULL, finished_at TEXT NOT NULL,
 status TEXT NOT NULL, records INTEGER NOT NULL, error TEXT
);
INSERT OR IGNORE INTO schema_migrations VALUES(1, strftime('%Y-%m-%dT%H:%M:%SZ','now'));
