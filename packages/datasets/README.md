# Public dataset snapshots

The web build imports `data/last-good.json`, atomically promoted only after validation. Immutable normalized versions and original Census workbooks live alongside it. No invented or demonstration values ship in this package. Raw workbook SHA-256 hashes are retained in each dataset version.

Run `npm run ingest:census` at the repository root. A repeated source checksum is a no-op for the published version. See [dataset documentation](../../docs/datasets.md) for provenance, coverage and limits.
