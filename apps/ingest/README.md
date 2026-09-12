# Census ingest

`npm run ingest:census` downloads approved Census CPS PINC-11 male/female workbooks, archives them by SHA-256, checks their exact table/year/sex/units/columns and income thresholds, combines the all-race counts, validates totals, writes an immutable version and atomically replaces the last-good manifest. No Census API key is necessary.

Failed and unchanged runs are recorded separately. A failed download or validation does not replace a published dataset. Existing invalid manifests require restoration; the ingest does not silently discard their history. Future survey years require explicit source/contract review before changing the pinned constants.

An exclusive `.ingest.lock` prevents concurrent writers. If an ingest process crashes, confirm that no job is active before removing that lock and rerunning. Raw files and previously published versions remain intact.
