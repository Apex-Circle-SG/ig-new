# Reviewed remaining-knowledge collection

Reviewed 9 November 2026. `collection.zip` is the exact supplied seven-file archive.
SHA-256: `72a774db6946fd9975672b97d9b3b812779c528b83e552a3c66520610c921ca9`.

The source contains 1,439 nonempty DOCX paragraphs, 13 embedded worksheet scans
and one standalone executive-checklist image. The Chinese source has 39
extractable paragraphs; it did not require OCR.

- `editorial/inventory.json`: original paragraphs, file/image hashes and locations.
- `editorial/ocr.json`: all fourteen machine OCR drafts, with engine and source hashes.
- `scripts/content-business/remaining-plan.json`: classifications, reviewed
  canonical duplicate mappings, curated explanations and bilingual passages.
- `scripts/content-business/remaining-figures.json`: reviewed accessible image
  adaptations, source/asset hashes, provenance and optimized image references.
- `docs/remaining-knowledge-content-coverage.csv`: destination/disposition of every
  paragraph and image, including omitted duplicate explanations and source-only
  wording.
- `docs/remaining-knowledge-primary-source-review.md`: independently checked
  framework/science references and remaining attribution limits.
- `docs/remaining-knowledge-implementation.md`: delivery and verification.

Rebuild all reviewed batches with `python3 scripts/content-business/build.py`.
Changed archives, unexpected parts, unmapped passages, missing canonical targets,
changed source images and missing/changed optimized assets fail the build.

OCR drafts are not publication text. The accessible worksheet/checklist content
was grouped, lightly rephrased and visually checked against the scans. Blank
writing lines and repeated boilerplate are consolidated; the supporting images
preserve the supplied layout, wording and marks.

The twelve Gallup-related employee prompts are retained in the source record;
public pages contain independently written topic guidance and owner attribution,
without administering the official instrument or claiming its validation.
Do not replace this archive when another upload arrives. Review a new batch and
record its fingerprint and editorial mapping separately.
