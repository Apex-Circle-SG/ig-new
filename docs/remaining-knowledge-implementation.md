# Remaining knowledge: implementation and verification

Implemented 9 November 2026 after approval of the
[classification proposal](remaining-knowledge-content-review.md).

## Delivered structure

Added **40 focused guides and two child collections**. **28 existing guides**
receive distinct additions, related links or source clarifications. Familiar
frameworks keep their existing canonical pages. No prior guide or collection is
removed.

- **Customer Experience & Service Design**, under Product Development &
  Innovation: thirteen linked worksheet readings, from the proposition and
  customer identity through objectives, journey/tasks, expectations, effort,
  stress, error prevention, sensory accessibility, social experience, emotion
  and the action scratchpad. Related Brand, Marketing and Sales collections are
  linked without duplicating the articles.
- **Coaching & Reflective Practice**, under Communication & Personal Development:
  reflection, personal questions, learning/attention, bounded action, reflective
  frameworks and critical reading of scientific claims.
- Existing Leadership/People/Governance/Operations collections receive the
  executive review, business questions, competencies, cross-cultural comparison,
  team/leadership models, delegation, trust and meeting design.
- Marketing and strategy additions include STEPPS, platform launch approaches,
  strategy’s five Ps, distinct campaign material and clarified customer metrics.
- The physics glossary belongs to Science & Quantum. Spiritual interpretations
  and the bilingual Chinese programme overview belong to Beliefs & Mysteries.
  Decision exercises, venture questions and the short machine-learning research
  prompt have their own relevant destinations.

Business & Management retains its existing focused hubs; these additions do not
create a miscellaneous root category or push all supplied material into one guide.

## Source coverage and deduplication

| Item | Verified coverage |
| --- | --- |
| Original upload | Exact seven-file archive retained; SHA-256 `72a774db6946fd9975672b97d9b3b812779c528b83e552a3c66520610c921ca9` |
| Text | All 1,439 nonempty DOCX paragraphs have destination/disposition records |
| Images | All thirteen CX scans and the CEO poster have OCR drafts and reviewed accessible adaptations |
| Source visuals | Fourteen lossless WebP references and fourteen sized previews; source and asset hashes checked |
| Chinese | All 39 passages have English translations with accessible Chinese originals, organized into four sections |
| Repeated explanations | 79 source paragraphs map to existing canonical sections, with reasons recorded; their originals remain in provenance |
| Questionnaire content | 30 management, 33 venture/fundraising, 12 employee-topic and 4 personal-reflection prompts classified by reader purpose |

The canonical mappings include the already-covered competitive/growth,
segmentation, 7S, value-chain, VRIO, product-lifecycle, Tuckman, managerial-grid and
Kotter explanations, plus a few equivalent interpersonal-influence prompts.
Similar words in different contexts are not automatically deleted. Distinct
examples, application questions and caveats are retained.

The 79 mapped duplicate **paragraphs** are separate from the source questionnaire’s
79 **prompts**; these happen to have the same count. The latter are not all omitted.
The employee page uses independent descriptions of the twelve working-condition
themes, with Gallup attribution and owner links, instead of reproducing or
administering the owner-identified questionnaire or inventing scores.

Evidence: [paragraph/image ledger](remaining-knowledge-content-coverage.csv),
[original inventory](../content/sources/remaining-knowledge/editorial/inventory.json),
[OCR drafts](../content/sources/remaining-knowledge/editorial/ocr.json),
[image adaptations](../scripts/content-business/remaining-figures.json), and
[source research](remaining-knowledge-primary-source-review.md).

## Reader presentation

Each new guide has a meaningful title, introduction and distinct takeaway.
Relevant sequences and compact comparisons reuse the existing themed figure
presentation. Worksheet prompts are the main reading; source scans, attribution
and review notes sit behind a disclosure. The large yellow CEO image is a
supporting source, while its fifteen responsibility areas are readable text.

The Chinese translation is grouped by subject; each section provides its original
Chinese in a disclosure. Translation preserves the programme’s claims as
attributed language rather than endorsing them. Existing article URLs remain
stable. New and changed readings are in the combined sitemap and human-readable
content index through the existing published-catalogue pipeline.

Advertising and consent continue through the existing library page/layout.
No new tracking, response collection, assessment scoring, calculator route or
third-party application dependency was introduced. OCR tools and temporary
extraction/browser artifacts live outside Git on `/mnt/sdb`.

## Accuracy and remaining gaps

Primary-source research supports the physics corrections and the named framework
comparisons. The sixteen supplied physics entries are explained with a specified
model/scope. Hofstede and GLOBE remain distinct; Belbin contributions, Lencioni
obstacles, leadership-development stages and leadership behaviours are separate
lenses. The platform-launch list is matched to its authors’ 2016 INSEAD account.

The following limits remain explicit rather than being filled with invented data:

- The CX legend includes customer control, but no separate customer-control
  worksheet was supplied. The thirteen pages are not claimed to be a complete
  book or complete original worksheet pack. Their Methodical 2018 marks are
  preserved; precise edition completeness was not independently established.
- The Chinese overview announces five paths, six directions and seven levels but
  does not enumerate those systems. Its eight audiences and nine business
  situations are supplied and translated.
- Named quotations, several shorthand phrases, percentages, medical mechanisms,
  wealth claims and screening assertions remain unverified where no adequate
  source was found. They are framed as source assertions, metaphors or critical
  readings rather than current benchmarks or instructions.
- The marketing formulas lacked consistent cohort/time/unit definitions. Their
  limitations are explained alongside the existing customer-economics reference;
  no missing dataset or valid forecast was inferred.
- The collaborative-filtering entry supplies only a topic label. The resulting
  short research note identifies missing data/method details; it is not presented
  as an uploaded algorithm or reconstructed tutorial.

## Verification

- The complete source build passes coverage, archive, image, canonical-section,
  category, relationship and prior-batch checks.
- All 1,439 paragraph destinations, fourteen image mappings, twenty-eight image
  asset hashes, thirty-nine bilingual pairs and seventy-nine duplicate mappings
  were independently counted against the ledger and source inventory.
- Production build with public indexability and advertising enabled, TypeScript
  and ESLint: passed.
- Desktop/mobile browser review covers all 79 plan destinations and both new
  collections, source-image disclosures, local guide links, translation
  availability, absence of exact assessment items from public content, canonical
  links and sitemap/content-index inclusion. See the
  [browser receipt](verification/remaining-knowledge-browser.json).
- Visual inspection includes responsive CX, executive-review and bilingual pages.
- The bounded Graphify architecture graph is refreshed after the renderer/build
  changes. Existing source/content is preserved, and unrelated workspace changes
  are excluded from the commit.

No content-only test suite was added. Verification uses the existing build’s
assertions, production/type/lint checks and direct browser/source inspection.
Post-push Cloudflare deployment is separate from the local production preview.
