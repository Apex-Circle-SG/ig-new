# Consolidation audit tooling

Read-only HTTP inspection. Nothing here deploys redirects, publishes content,
changes WordPress or configures Datadog. Requires Python with `requests` and
`lxml`, plus the repository's Playwright/axe dependencies. Install the pinned
Python dependencies in an isolated environment before running the audit suite:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/consolidation-audit/requirements.txt
.venv/bin/python -m unittest discover -s scripts/consolidation-audit -p 'test_*.py'
```

CI selects Python 3.13 and installs this requirements file explicitly; it does
not rely on packages preinstalled on the development host.

## Discovery and evidence

The September 13 inventory used the existing read-only crawler with
`--origin https://blog.insightginie.com --all-taxonomies --max-rest-pages 400`.
The second pass used `--reuse-snapshots`. The default 150-page limit is insufficient
for the 32,045 tag records. Raw public snapshots remain under ignored
`backups/consolidation-2026-09-13/`; they are not a complete CMS backup.

The older discovery tool emits provisional retirement fields for its original
legacy task. Those fields were deliberately stripped from the new report and
are **not migration instructions**. The unmodified bootstrap output is preserved
locally under `bootstrap-unmodified`. Current candidates are in MIGRATION_MAP.csv.

## Source crawl

Only resume after the origin rate limit has cleared and permitted crawl capacity
has been established. Start with a small batch and one worker:

```sh
python3 scripts/consolidation-audit/source.py \
  --inventory docs/audits/2026-09-13-consolidation/blog-inventory/url-inventory.csv.gz \
  --output docs/audits/2026-09-13-consolidation/source \
  --snapshots backups/consolidation-2026-09-13/html \
  --workers 1 --limit 250
```

Omit `--limit` for the entire discovered inventory. The crawler stops making new
requests to a host after a 429 in that run. No proxy rotation or access-control
bypass is implemented. Reports identify errors and unmeasured fields; HTTP 200
is never inferred from a REST publication flag. Arbitrary query combinations,
link-only URLs, attachments and deep archive pagination need a separately
reviewed discovery expansion before claiming all URLs were enumerated.

Source records contain initial/final status, redirect chain, canonical, robots,
title/description/H1, JSON-LD, language, word count, normalized content hash,
links and declared image dimensions. Natural image dimensions and browser
accessibility cannot be established from source HTML alone.

## Browser audit

```sh
node scripts/consolidation-audit/browser.mjs
```

This deliberately covers the 13 current main public pages and explicit blog/
viewport samples. It is not a 41,211-page browser crawl. Ad/analytics requests
are blocked to avoid manufacturing impressions and contaminating measurements.
The report includes incomplete axe checks and non-200/error responses; those
must not be treated as template-level WCAG results. Browser parsing differences
alone do not establish cloaking or duplicate-content defects.

## Report and checks

```sh
python3 scripts/consolidation-audit/report.py
python3 scripts/consolidation-audit/validate.py
python3 -m unittest discover -s scripts/consolidation-audit -p 'test_*.py'
```

The report builds an inactive candidate map and versioned compressed JSONL URL
records. Missing fields remain null. The curated measured-source snapshot is
separate from partial bulk-crawl attempts. Do not label source coverage complete
until all reports and discovery gaps have been reconciled. New measurements
require a new versioned audit directory rather than rewriting historical proof.
