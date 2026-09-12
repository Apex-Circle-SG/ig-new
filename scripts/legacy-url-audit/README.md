# Legacy URL audit

Python 3.10+ standard-library tools. No `.env` loading, secrets, or write requests.

```bash
python3 scripts/legacy-url-audit/crawl.py
python3 scripts/legacy-url-audit/validate.py docs/legacy/url-inventory.csv.gz
python3 -m unittest discover -s scripts/legacy-url-audit -p 'test_*.py'
```

The crawler inventories every URL in the advertised sitemap tree, then paginates public WordPress posts/pages/categories for additional URLs. It records REST tag totals but fetches only the first tag page by default, because sitemap URLs already cover the taxonomy. To enumerate every public tag, rerun with `--all-taxonomies --max-rest-pages 500`; inspect counts for truncation. The run uses three concurrent requests by default, at most four, a 30-second timeout, response-size limits, and a same-host redirect guard. Only the homepage is downloaded as HTML. Each source response has a SHA-256 checksum and a compressed snapshot in ignored `backups/legacy/`.

Outputs:

- `docs/legacy/url-inventory.csv.gz`: full deduplicated public URL export and provisional migration map.
- `docs/legacy/crawl-summary.json`: counts, coverage limits, errors, WordPress metadata and headers.
- `docs/legacy/request-manifest.json`: source URL, retrieval time, safe response headers, snapshot hash.
- `docs/legacy/robots.snapshot.txt`: observed robots configuration.
- `backups/legacy/`: local public response snapshots. **Not a full WordPress backup.**

Use a new `--output` and `--backup` directory for subsequent audits to preserve evidence.

To enrich an existing audit without refetching known documents, pass `--reuse-snapshots` with the same backup directory. Only checksum-verified snapshots referenced by its manifest are reused; original retrieval timestamps are preserved. For example, the initial September 2026 audit was enriched with `--all-taxonomies --max-rest-pages 500 --reuse-snapshots` to capture public tags omitted from the sitemap.

Every exported action has `approved=false`. Provisional `410` means “no equivalence established; review required,” not “safe to delete.” Trust/policy URLs are provisional `KEEP` pending review. No redirect targets are guessed. Import Search Console exports, backlink evidence, server-log URLs and WordPress administrator exports before making decisions.

A reviewed map adds `approved_by`, `approved_at` (ISO timestamp with timezone), `evidence_reference`, and `backup_manifest`. For a redirect, also add `equivalence_evidence`. Set `review_status=APPROVED` and `approved=true` only after review. The validator rejects homepage redirects, self redirects, cross-host targets, chains/cycles, destinations marked gone, duplicate sources and missing review evidence. Before enforcement:

```bash
python3 scripts/legacy-url-audit/validate.py path/to/reviewed-map.csv --require-approved
```

Enforcement mode requires every row in the submitted map to be approved; partial review never authorizes the remaining rows. The validator checks the evidence fields are present; an operator must verify their contents and the restored backup. These tools never deploy redirects, delete WordPress, change DNS, send email or submit sitemaps.
