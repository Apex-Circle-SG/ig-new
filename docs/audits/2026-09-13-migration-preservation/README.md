# Public WordPress preservation

Generated 2026-09-13T09:34:07.267320+00:00.

Preserved **9,071 of 9,071 audited posts**
and **17 of 17 public pages** from
the original blog. Immutable source records preserve original rendered bodies,
bylines, dates, media metadata, captions and source links. Integrity failures:
**0**. Sources changed since the metadata audit: **0**.

Prepared **9,070 sanitized article candidates** in
ignored storage. These candidates have no publishing approval and do not change
the deployed two-article preview, its source canonicals or noindex controls.
The copied pages retain their original page type and await template/content review.

Copied **0 binary files** from **7,841 distinct referenced
blog-host upload URLs**. Raw source records retain media references even where
the binary has not been copied. This covers referenced public uploads only;
private, unlinked and external-host media are outside this binary mirror.

- [Machine-readable receipt](preservation-receipt.json)
- [Migration handover and remaining access](handover.md)
- [Inactive content migration map](content-migration-map-54fd8246a5c3.csv.gz): 9,088 rows;
  proposed destinations only for successfully normalized article copies.
- [Original full URL inventory](../2026-09-13-consolidation/blog-inventory/url-inventory.csv.gz):
  the wider 41,211-URL discovery, including taxonomies and archives.
- [Reproduction and safety controls](../../../../scripts/content-sync/README.md)

Local preservation store: `/root/ig-new/backups/wordpress-mirror-2026-09-13`. It is ignored by Git and is not an off-host
backup. The capture is resumable by audited ID; each completed batch is durable.
Source requests stop on errors and persist a cooldown without automatic retry.
Current run status: **audited_public_content_captured**.
Recorded successful source responses: **92**;
interrupted in-flight attempts are not included in that count.

The prepared index is also retained as an immutable hash-named manifest. The
index's `rawSha256` hashes the stored source file bytes and links to
`recordSha256`, the normalized file's byte hash. The normalized record's own
`rawSha256` instead hashes JavaScript `JSON.stringify(parsedSourceObject)`.
These serialization hashes intentionally differ; neither is silently substituted
for the other. See the receipt's `checksumSchemes` for the complete definitions.

**No remote WordPress mutation, DNS change, redirect activation, source deletion,
application snapshot replacement or new article publication occurred.** Public
rendered snapshots cannot restore WordPress. Final cutover still needs a complete
database/uploads/plugins/themes/configuration export, a verified isolated restore,
publishing freeze and delta reconciliation, per-URL review, and blog-host redirect
authority. Local checksums establish preservation integrity; they do not establish
editorial correctness, licensing or completed browser review for every article.
