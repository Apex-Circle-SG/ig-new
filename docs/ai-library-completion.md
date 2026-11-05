# AI library completion and engineering refinement

The work continues the AI-library overhaul: develop the remaining supplied topics and numerical exercises, retain useful detail, correct errors, use reader-facing titles and navigation, and preserve source traceability. Apply the installed Matt Pocock design/implementation standards, Ponytail's smallest complete change, and Graphify's bounded architecture analysis. Keep changes local until the user explicitly requests a push.

## Reader-facing changes

- All 25 formula figures have a recalculated, expandable numerical treatment linked from the appropriate lesson. Tables retain the given inputs/parameters and explain where a sketch approximates, omits or contradicts its own arithmetic.
- The remaining collection now has guides for clustering and representations, trees and feature selection, time series, compute complexity, activations and specialized architectures, agent platforms, model labels, cognition and symbolic systems, adoption, governance frameworks, historical evidence, preprocessing, language/perception, cloud pipelines and energy measurement.
- A 72-entry risk register is organized by meaning: model behavior; data/privacy; tool authority; governance; operations/value; people/social effects. Source codes are not reader-facing labels.
- The category catalogue is derived from published guide metadata. New guide slugs do not require a second manual registration; unknown future categories remain discoverable.
- Expandable tables use bounded horizontal scrolling, readable captions and keyboard focus. They do not stretch the page on mobile. Numerical examples retain assumptions and corrections adjacent to their results.

## Coverage and honest limits

`docs/ai-item-coverage.csv` maps all 2,641 extracted text passages and all 45 embedded images to reader destinations. The source documents and extracted inventory remain in `content/sources/ai/`. This is an editorial routing ledger, not a completed sentence-by-sentence fidelity audit. Review identified and corrected misroutes in the opening glossary; other broad ranges still need a semantic destination audit. A synthesized passage means its subject has been developed or consolidated; it does not certify every original sentence as true or reproduce every decorative element.

Nineteen ambiguous labels or argument/protocol names lack the original definition or citation; the reader-facing guides identify these uncertainties. Additional unsupported claims are corrected or contextualized, including specific scenario-size rules, old forecasts, financial performance numbers, cloud product diagrams and simplified legal classifications. These are source-evidence limits, not unpublished implementation tasks.

Some sketches identify Prof. Tom Yeh's AI by Hand. The arithmetic reader credits that origin and links to the publication; it does not republish the artwork. The exact softmax, variance, gradients and pooled features can differ from handwritten approximations. In particular, the preference diagram's printed parameters yield rewards 3 and 4, whereas its handwritten averaging leads to displayed scores 3 and 5; both calculation conventions are explained.

## Engineering changes

- `getAiGuideContent` owns category navigation, related reading, lesson lookup and exercise lookup behind one interface. The reader no longer combines manual slug registries with fallback categories.
- Source reconstruction is reproducible from `scripts/content-ai/reconstruct.py`, with literal arithmetic checks for known examples before output is written.
- Retired source-reader styling was removed. The added TypeScript and CSS follow the repository's formatter. No production dependency was added.
- Graphify 0.9.56 and its SQL parser are installed in `/mnt/sdb/ig-new-tools/graphify`; its Codex skill is installed. The repository's pinned requirements and restoration instructions make the environment reproducible. Its generated outputs remain ignored.
- Graph extraction now covers the relevant Python reconstruction code and Cloudflare adapters in addition to the existing bounded source roots. It does not scan credentials, environment files or arbitrary data directories. Unresolved external references and collapsed edges are structural graph limitations, reported separately from source defects.
- Digital-hygiene and skill-use preferences are recorded in AGENTS.md. Unrelated user changes, original sources and active services are preserved.

## Validation

Evidence is recorded in `docs/verification/ai-library-refinement.json`. Code checks include navigation behavior, sitemap discovery, type checking, lint and the production build. Browser checks cover AI pages at 390 px and 1440 px and expanded numerical tables. These checks do not establish that every historical source claim is correct or replace a full accessibility audit.

Routing correction: source figure 24 now computes its router scores instead of copying the handwritten expert choices. First-expert tie breaking yields A, B, A, B, B; expert B’s capacity sends the fifth token through unchanged.
