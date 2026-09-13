# Migration preservation handover

The complete **inventoried public corpus** is now preserved locally: **9,071
posts and 17 pages**. **9,070 article copies** pass offline normalization and are
prepared outside the application. The live site still contains its original two
nonindexable article previews. Migration cutover is not complete.

The [fresh total check](public-totals-check.json) returned **9,071 posts and 17
pages** at 09:35 UTC on September 13, 2026. These two small public requests found
no count delta. Counts cannot establish a publishing freeze, detect every edit,
or substitute for final reconciliation with an authenticated export.

## Preserved evidence and reproducibility

- [Preservation receipt](preservation-receipt.json): all raw response and record
  checksums validate; no source `modified_gmt` differed from the metadata audit.
- [Offline test results](offline-tests.json) and [content unit results](content-unit-tests.json).
- [Redirect rehearsal summary](redirect-review.json): 9,070 exact article
  destinations and 36,280 explicit source rows, including HTTP/HTTPS and both
  slash forms. Every row is inactive, unapproved and outside live configuration.
- [Full migration map](../../../../MIGRATION_MAP.csv) retains all 41,227 source
  rows. Unverified pages, taxonomies and archives remain REVIEW with no invented
  replacement. The two known main-host aliases remain separate source rows.
- [Importer commands and controls](../../../../scripts/content-sync/README.md).

The ignored preservation store is
`backups/wordpress-mirror-2026-09-13/`. The immutable prepared manifest is
`prepared/manifests/aba2d745f596809b34c1716ac589cc038f27dc9a418a2c301fdcd8919ca61c22.json`.
Its transformation is `wordpress-public-v2`; the manifest records the actual
normalizer, sanitizer, schema and dependency-lockfile hashes. The prepared index
maps each raw **file-byte** checksum to its normalized **file-byte** checksum.
The normalized record's own `rawSha256` instead hashes JavaScript
`JSON.stringify(parsedSourceObject)`. The receipt documents this distinction.

Capture resumed after one interrupted process: 7,817 records were already
durable, and the remaining 1,271 posts were preserved by the resumed run.
There are **92 successful recorded body-capture responses**, plus **two
separately recorded total checks**. An interrupted in-flight attempt may not be
included in the successful-response count. No rate-limit response was observed
in this capture; tested HTTP 429 behavior stops immediately and persists the
server-directed cooldown. No automatic retry defeats that cooldown.

## Source exceptions

One preserved source remains unsuitable for normalization:

| WordPress ID | Source slug               | Disposition                                                                                              |
| ------------ | ------------------------- | -------------------------------------------------------------------------------------------------------- |
| 7363         | `crypto-security-in-2026` | Body is literally `<p>Test content</p>` (12 text characters). Raw preserved; REVIEW; no target proposed. |

Two original articles contained malformed HTML nesting after unknown tags were
removed: post 8757 (`explaining-openclaws-canary-skill-a-comprehensive-guide-to-secret-leak-detection`)
and post 9875 (`ex-io-expands-regulated-tokenized-securities-product-matrix-solidifying-leadership-in-the-rwa-market`).
A bounded second sanitization pass repairs that nesting while preserving the
visible text. Regression fixtures check the repair, and the two deployed valid
records reproduce byte-for-byte. No schema threshold was weakened; v1 snapshots
remain readable under their original version and checksum.

## Remaining work that requires host access

No media binaries were copied. The source records retain **7,841 unique
referenced blog-host upload URLs**, including body variants and featured-media
metadata. A small resumable public-media batch can be captured with:

```sh
python3 scripts/content-sync/mirror.py media --requests 25 --interval 5
python3 scripts/content-sync/mirror.py verify
```

That command covers referenced public files only. A complete backup requires an
authenticated hosting export of the database, entire uploads directory, other
site files, plugins, themes and configuration, followed by an isolated restore
test. Public REST content cannot produce that backup. A full-host download
command cannot be specified accurately until the actual export URL or SSH/SFTP
host and website path are supplied. Keep the resulting archives in ignored
restricted storage and copy them to a separate backup destination.

Before cutover, establish a publishing freeze, reconcile changes/new/deleted
records, review content and equivalence per URL, preserve required media, deploy
approved targets, and verify their status/canonical/indexing. Then validate the
scoped blog-host redirect authority, Cloudflare list capacity and edge rule
ordering. The CSV is a concrete review artifact; it has not been uploaded and
must not be activated against unpublished targets. Unknown entity/archive
replacements receive no blanket redirect or inferred 410.

No WordPress service, source file, DNS setting, application publication snapshot,
or live redirect changed during this preservation work. This local mirror is
not an off-host backup, editorial approval, licensing clearance or browser review
of every article.
