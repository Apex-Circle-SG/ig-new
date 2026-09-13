# Read-only WordPress preservation pipeline

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
