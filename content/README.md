# Content ownership and publication

- `wordpress/`: immutable public source/derived snapshots, audited inventory
  plan, active last-good snapshot and explicit migration-cutover gate.
- `briefs/`: draft editorial briefs maintained by the editorial workstream.
- `authors/`, `guides/`, `methodology/`: existing Git-backed authoring boundaries.

The current WordPress pilot is a safe preview, not a completed migration. No
new editorial article is automatically published. Original article bylines are
preserved as historical source attribution, without invented biographies or a
claim that the new platform has professionally reviewed those articles.

The source and publication contract lives in
[`scripts/content-sync/README.md`](../scripts/content-sync/README.md).

Application exports in `apps/web/src/lib/content/` provide list/get operations,
publication status, filtered public feeds and an explicitly vetted retrieval
corpus. The public `/research/` page is a source-data explorer using the validated
Census dataset; it is not an unreviewed original editorial study.
