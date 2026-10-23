ALTER TABLE social_posts ADD COLUMN image_urn TEXT;
ALTER TABLE social_posts ADD COLUMN visual_url TEXT;
ALTER TABLE social_discovery_posts ADD COLUMN image_urn TEXT;
ALTER TABLE social_discovery_posts ADD COLUMN visual_url TEXT;
INSERT OR IGNORE INTO schema_migrations(version,applied_at) VALUES(4,datetime('now'));
