# Read-only WordPress preservation pipeline

## Resumable archive preservation

`mirror.py` extends the small deployed preview with a separate **ignored local
preservation store**. It reads the previously checksummed metadata audit for
9,071 public posts and 17 pages; it does not enumerate those IDs again. Full
responses and individual source records are immutable, hashed objects. Author
identity, source dates, original rendered HTML, captions, featured-media metadata,
source links and taxonomy fields remain in each raw object.

```sh
# All writes remain under ignored backups/; this makes no HTTP requests.
python3 scripts/content-sync/mirror.py plan

# Default: one bounded request. Resume skips already preserved IDs.
python3 scripts/content-sync/mirror.py capture --requests 1 --interval 5

# Explicit bounded archive capture: at most 92 sequential source requests.
python3 scripts/content-sync/mirror.py capture --requests 92 --interval 5

# Offline validation and nonpublished article preparation; no network calls.
npx tsx scripts/content-sync/prepare-mirror.ts
python3 scripts/content-sync/mirror.py verify

# Update inactive review artifacts after capture and preparation, without cutover.
python3 scripts/content-sync/update_migration_artifacts.py
python3 scripts/consolidation-audit/validate.py

# Optional bounded binary copies of referenced blog-host uploads.
python3 scripts/content-sync/mirror.py media --requests 25 --interval 5

# Offline importer regression tests.
python3 -m unittest discover -s scripts/content-sync -p '*_test.py' -v
```

Each collection request fixes `include` to audited IDs and requests at most 100
public records, so concurrent publishing cannot silently shift pagination. The
capture checks the expected ID set, source URLs, publication state and embedded
authors before checkpointing a batch. A changed/missing ID stops the operation
for reconciliation; an updated body is preserved with `changedSinceAudit` set.
Every completed batch survives a later source error or interruption. No command
in this mirror replaces application `last-good.json`, changes the cutover gate,
publishes a page, edits DNS or retires WordPress.

The request reader follows no redirects and permits only the two public REST
collection paths plus files under the original blog's uploads path. It enforces
timeouts, byte limits, response types, a minimum two-second interval (five by
default), and an exclusive local lock. **HTTP 429 stops immediately with no
automatic retry.** A persisted cooldown is the longer of `Retry-After` and five
minutes; a new capture command refuses network access until that time has passed.
Other source errors also stop for inspection. Do not defeat the cooldown by
moving the checkpoint or running multiple mirror processes.

`prepare-mirror.ts` runs the application's existing sanitizer and schemas offline
against the copied post bodies and writes reproducible, nonpublished records in
`backups/wordpress-mirror-2026-09-13/prepared/`. Pages retain their actual `page`
type in the raw mirror and await a corresponding page template/review; they are
never relabelled as articles. An invalid derived record remains in the raw
preservation store and is recorded as requiring review.

The dated receipt under `docs/audits/2026-09-13-migration-preservation/` distinguishes
body coverage, normalized candidates, copied binary files and missing host
access. Its compressed content map covers all 9,088 audited content records and
proposes article destinations only after local normalization succeeds. Every
candidate remains inactive and unapproved, without an asserted live target.
The earlier 41,211-URL discovery inventory still covers taxonomies/archives;
those URLs have no automatically invented equivalent target.

The artifact updater also writes
`prepared/cloudflare-bulk-redirects.review-only.csv` in ignored storage and
commits only its hash/summary in `redirect-review.json`. It follows the
[official Cloudflare CSV format](https://developers.cloudflare.com/rules/url-forwarding/bulk-redirects/reference/csv-file-format/),
with literal original URLs, verified normalized counterparts, HTTP 301 and every
query/subdomain/subpath/suffix option explicitly false. CSV escaping and each
source/target binding are machine-checked. There is no upload or activation code.
Each destination has four explicit source variants: HTTP/HTTPS, with/without the
trailing slash. Alias rows are counted separately from content destinations.
Actual Cloudflare quota and edge rule ordering remain unverified; an account
trace must establish that automatic HTTPS/slash normalization will not precede
these direct redirects and introduce a chain.
**Do not import this review file** while backup, restore, per-record approval,
target deployment/indexing and scoped redirect authority remain unverified.
It is a concrete configuration candidate, not a live redirect registry.

Current normalization is `wordpress-public-v2`: a bounded second sanitization
pass repairs malformed nesting exposed when unknown source tags are removed.
Existing `wordpress-public-v1` snapshots remain readable and are hashed with
their recorded version. New snapshots use v2. The deployed v1 manifest and its
two valid records are retained byte-for-byte. Prepared manifests record the
current version and hashes of the normalizer, sanitizer, schema and dependency
lockfile so the exact transformation can be reproduced.

Every prepared index is retained in `prepared/manifests/{sha256}.json` before
the atomic `prepared/index.json` alias is replaced. The existing alias is also
archived by verification, without changing its bytes. Source objects and derived
record objects are likewise immutable.

Checksum meanings are explicit: the checkpoint and prepared index `rawSha256`
hash the stored pretty-printed source JSON **file bytes**. The index links that
hash to `recordSha256`, the normalized record file's byte hash. Inside the
normalized `ContentRecord`, `rawSha256` hashes UTF-8
`JSON.stringify(parsedSourceObject)` instead. That compact JavaScript
serialization is not RFC 8785 canonical JSON and need not match the original
file's byte hash. `contentSha256` hashes the sanitized HTML string. The receipt
records each scheme and the immutable manifest hash.

The optional media command deduplicates original blog-host upload references,
including body `src`/`srcset`, media posters, linked uploads and featured-image
variants. It copies bytes without executing or serving them. Files hosted
elsewhere are retained as source references but never fetched by this command.
The referenced-media mirror is **not** the complete uploads directory: unlinked
files and private media still require a hosting export. A hosted archive export
is the appropriate way to preserve the full media library at scale.

Even complete public-body coverage is **not a restorable WordPress backup**.
Database tables, unpublished content/revisions, plugins/themes, secrets,
configuration, scheduled publishing and an isolated restore test require scoped
WordPress/hosting access. Final redirects require authority over the blog host.

Protocol references: [public post collection and include filter](https://developer.wordpress.org/rest-api/reference/posts/),
[REST pagination](https://developer.wordpress.org/rest-api/using-the-rest-api/pagination/),
[public media metadata](https://developer.wordpress.org/rest-api/reference/media/).

This pipeline reads **public published posts** from `https://blog.insightginie.com`.
It cannot change WordPress, DNS, ads, users or remote redirects. It keeps immutable
public JSON source snapshots and sanitized derived versions, then atomically
replaces a local last-good snapshot only after the entire requested batch passes.

The deployed app imports the validated snapshot at build time. Rebuild and
deploy after an approved snapshot change; article requests never fetch WordPress
or an input-controlled URL. A source outage does not make existing previews
unavailable. Missing/corrupt application snapshots fail closed.

## Current pilot and inventory

The pilot preserves posts 9164 and 13530, two externally referenced articles
already identified by the consolidation audit. Both are migration previews.
They keep their original blog canonicals and `noindex`, original author names,
publication/update dates, body text, media URLs, captions and source links.
The previews are not new professional/editorial reviews.

`content/wordpress/inventory-plan.json` contains the 9,071 audited public post IDs.
It was generated without recrawling the site:

```sh
python3 scripts/content-sync/plan-from-audit.py
```

The planner checks the existing public REST snapshots against their recorded
SHA-256 hashes. Local backup snapshots are needed to regenerate the plan; the
generated ID plan is committed so deployment and future bounded sync do not
depend on that backup directory. The inventory is metadata, not article-body
coverage or a complete WordPress backup.

## Bounded synchronization

```sh
# Validate the default two-item pilot and preserve raw responses, without publication.
npx tsx scripts/content-sync/sync.ts --limit 2

# Atomically publish validated local previews.
npx tsx scripts/content-sync/sync.ts --publish-preview --limit 2

# Resume a small batch from the audited inventory; existing IDs are skipped.
npx tsx scripts/content-sync/sync.ts --plan content/wordpress/inventory-plan.json --limit 25 --publish-preview

# Refresh already synchronized posts only when a source update is being reviewed.
npx tsx scripts/content-sync/sync.ts --plan content/wordpress/pilot.json --refresh --limit 2 --publish-preview

npx tsx scripts/content-sync/validate.ts
```

No command silently crawls all 9,071 posts. The batch limit is 1–100, default 2;
sequential requests wait at least one second (default 1.5s). HTTP 429 stops the
batch immediately, records `Retry-After`, and leaves last-good unchanged. Wait
the provider's interval before a human-triggered retry; there is no retry loop.
Other source/schema failures also leave last-good unchanged. Per-run receipts
under `content/wordpress/runs/` are local operational records, ignored by Git.

An exclusive lock prevents concurrent writers. If the process is killed, inspect
the recorded PID before removing a stale `.sync.lock`. A failed process may
leave unused immutable source/version files; do not delete them as part of an
automatic recovery. They do not affect the current snapshot.

## Validation and sanitization

The public [WordPress REST post schema](https://developer.wordpress.org/rest-api/reference/posts/)
supplies rendered content, GMT dates, publication state and embedded author/media
records. Protected, unpublished, wrong-host, identity-mismatched or incomplete
records are rejected. A successful snapshot has unique IDs, slugs, paths and
source URLs; its checksum and each rendered-content checksum must match.

The maintained `sanitize-html` dependency parses HTML against a strict allowlist.
Scripts, event handlers, inline styles, forms, active embeds, unsafe URL schemes,
credential-bearing URLs and local-network media URLs are excluded. Original
public text, source links, tables, accessible image descriptions and captions
survive. Images load without a referrer; old CSS and responsive `srcset` values
are not trusted. Source JSON preserves the original renderer input for audit.
Removed active embeds are disclosed on the preview. No ad code is imported.
[Sanitizer source](https://github.com/apostrophecms/apostrophe/tree/main/packages/sanitize-html).

The validator reproduces each normalized article from its immutable raw source
and writes `docs/verification/content-migration-validation.json`. Unit tests
cover malicious HTML, malformed input, identity/URL validation, checksum failures,
atomic last-good retention, locks, 429 behavior and publication/retrieval gates.

## Preview versus public cutover

`content/wordpress/cutover-gate.json` is deliberately in `preview` mode. Public
cutover requires all of the following documented outside this local sync:

1. A complete WordPress database/media/plugin/theme/configuration backup.
2. A verified restore test.
3. Hosting authority and verified 301s from the original blog URLs to exact
   equivalent targets, with successful target responses.
4. Per-record approval tied to its sanitized content checksum, reviewer and date.

Only then may the explicit gate be changed. Local source snapshots and copied
media links are **not** a restorable WordPress backup. Media files still depend
on the original host. Missing author/media/taxonomy information is never filled
with invented details; missing critical author/date/body fields fail ingestion.
Source permissions, licences and professional/editorial review remain human
publication responsibilities.

The local gate validates recorded evidence fields; it does not independently
prove the external backup/restore/redirect evidence. The current run does not
change or claim a complete remote migration. Root release controls and remote
verification must establish that evidence before applying cutover.

Migration previews and editorial drafts are excluded from RSS and the assistant
corpus. `getApprovedPublicDocuments()` exposes only explicitly vetted public
product/methodology snippets, with sources and update dates. Arbitrary imported
WordPress prose never becomes a retrieval instruction or authoritative answer.

## Rollback

```sh
npx tsx scripts/content-sync/rollback.ts VERSION_SHA256
```

This validates an existing immutable version and atomically restores last-good.
Rebuild and deploy to use it. It does not mutate the source site. Retain the
previous application release as a separate deployment rollback option.
