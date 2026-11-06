# Reviewed deal-model collection

`collection.zip` is the exact supplied archive reviewed on 6 November 2026.
SHA-256: `832858de004964d5fe9819dcbb3685569f718081bdd1c8d7275754f17c3320ec`.

Five documents and seven workbooks are classified in
`scripts/content-business/deal-plan.json`. Rebuild with
`python3 scripts/content-business/build.py`; it rejects changed archives,
unreviewed parts, unmapped paragraphs/images and changed workbook downloads.
The public source register links seven byte-identical XLSX originals and the
historical raw price-volume CSV. It identifies known formula defects, missing
material and interpretation limits. The private Nasdaq wiki target is retained
only as source provenance; its missing contents are not invented or linked as a
public reading.

- Paragraph/image destinations: `docs/deal-models-content-coverage.csv`.
- Workbook/sheet destinations: `docs/deal-models-workbook-coverage.csv`.
- Original paragraph, table, image and file hashes: `editorial/inventory.json`.
- Historical case evidence and uncertainty: `docs/deal-case-verification.json`.
- Implementation and validation: `docs/deal-models-implementation.md`.

New uploads must be reviewed and added as a distinct source batch; never replace
this archive to make a later upload pass the reviewed fingerprint.
