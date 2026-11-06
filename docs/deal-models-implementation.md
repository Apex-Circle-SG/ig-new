# Deal models, planning tools and knowledge integration

Implemented 6 November 2026. Formula/scenario version: `2026-11-06.1`.

## Delivered

- Six calculation workspaces: acquisition impact; debt capacity; linked LBO and recapitalization; valuation; SaaS scaling and financing; VWAP and price-volume analysis.
- Three private planners: diligence, integration plan/scorecard, and culture comparison.
- A corporate-finance calculator hub, a market-analysis hub and a Mergers, Acquisitions & Integration learning collection under Finance & Accounting.
- 23 new detailed guides plus the collection index. Existing founder-term and private-capital guides are extended rather than duplicated. Alliances/restructuring belong to Strategy & Growth; IPO readiness and valuation to Valuation & Transactions; SaaS to financial planning; family offices/capital roles to Investing & Portfolio Management; price-volume analysis to Trading & Markets.
- Meaningful introductions, decision sequences, 52 clarified glossary definitions, a four-model family-office comparison, a capital-role map and corrected SaaS margin comparison. Two source process images are reconstructed as themed, accessible nine-step visuals.
- All 31 historical cases retained with primary evidence, date meaning and completion limits. Seven contextual examples receive source-backed corrections.
- Local JSON scenario import/export, CSV result exports, three-scenario comparisons for calculations, complete expandable tables and lightweight SVG charts. No account, shared data room or remote spreadsheet execution is introduced.

## Source coverage

| Material | Retained and checked |
| --- | --- |
| Exact source archive | 12 files; SHA-256 `832858de004964d5fe9819dcbb3685569f718081bdd1c8d7275754f17c3320ec` |
| Five documents | 1,672 nonempty paragraphs; 12,888 words; 63 tables; 2 images |
| Seven workbooks | 25 worksheets; 101,504 populated cells; 90,634 formula cells |
| Public workbook downloads | All seven byte-identical to the reviewed originals, including credits and known defects |
| Historical price-volume observations | All 2,022 dated rows, including 43 zero-volume rows, in original raw units; downloadable CSV and loadable calculator example |
| Diligence | 370 source paragraph requests plus 103 template requests; four obvious split-line pairs combined into 469 working requests across 28 subject groups, with all source references retained |
| Culture | All 46 characteristics across 11 groups; evidence, respondent and date context; unrated distinct from zero |
| Integration | Source outline and approvals retained; 10 source objectives plus 3 additional metric slots; baseline, units, direction, tolerance and separate 100-day/year-one reporting |

Detailed evidence: [paragraph/image ledger](deal-models-content-coverage.csv),
[worksheet ledger](deal-models-workbook-coverage.csv),
[original inventory](../content/sources/deal-models/editorial/inventory.json),
[case evidence](deal-case-verification.json),
[methods research](upload-calculator-methods-research.md), and
[bounded legal/accounting review](deal-legal-accounting-source-review.md).

The build rejects changed source fingerprints, unexpected archive parts, unmapped
paragraphs/images, missing reviewed glossary definitions and changed workbook
inventories/downloads. Rebuilding all batches also preserves the earlier library
collections and their formula, metric, academic-reference and image checks.

## Modelling and reader limits

The workspaces implement the intended financial relationships independently;
they do not execute the original Excel files or claim to validate their empty
formula caches. Historical inputs and repeated calendar/bin scaffolding remain
available in the originals rather than becoming thousands of article rows.

Important disclosed issues include unreconciled historical earnings, copied
sensitivity constants, the absent debt macro, missing LBO names and fixed-period
interest references, inconsistent source volume scaling and date formulas,
misaligned SaaS percentages, mixed-unit scorecard totals and arbitrary statuses.
Source descriptions of software, funding benchmarks and family-office thresholds
are not presented as current verified norms.

The private Nasdaq wiki contents were not included. Some diligence prompts are
incomplete. Several cases remain announcement-only/adviser-reported; Reby has a
contested closing record and the supplied Yapily/finAPI completion is not
verified. These gaps are identified, not filled with invented material.

Specific tool conventions are visible beside the results: acquisition timing and
realization ramps; debt maturity and reserve/coverage constraints; LBO interest
basis, depreciation, accounting and preference assumptions; consistent DCF
enterprise/equity bases; SaaS ARR/revenue/cash proxies; and eligible-trade VWAP
versus daily-price proxies. The planning timeline uses calendar days, while
original dependency and working-day spreadsheet formulas remain in the source
files. Culture gaps are descriptive ordinal comparisons, not quality grades or
financial-synergy predictions.

## Privacy, discovery and hygiene

All nine workspaces reuse the existing opaque sandbox, nonce CSP and
`connect-src 'none'`. The parent receives only bounded height and coarse tool
events. Inputs never enter share URLs, parent HTML, analytics or network requests.
Drafts disappear on reload; deliberately exported files contain private data.
Scenario imports validate tool/version, known fields and selections; failed
imports preserve the draft. CSV exports escape spreadsheet formula prefixes.

All 11 new public calculator/hub routes are registered with canonicals, calculator
analytics exclusions, sitemap discovery, the human-readable content index and
library-tool discovery. Knowledge entries are picked up by the existing catalogue
sitemap. Existing consent and advertising safeguards remain in place.

The shared model entry point is `@insightginie/calculators/deals`. Numeric methods
stay separate from the browser editor and content build. There are no new
third-party dependencies. Temporary extraction/build/browser artifacts remain
outside Git; unrelated user changes are excluded from the commit. The bounded
Graphify scan now includes calculator source and was refreshed after the changes.

## Verification

- Production build with indexability and advertising enabled: passed.
- TypeScript and ESLint: passed.
- Unit suite: 490 checks passed across 32 files.
- Independent numeric cases cover funding reconciliation, synergy ramp thresholds,
  zero-interest repayment, operating funding deficits, linked LBO balance/cash/debt
  identities across interest/transaction/preference conventions, insolvency,
  DCF/equity bridges, IRR sign restrictions, SaaS retention/dilution/ARPA, weighted
  prices, units, bucket/date boundaries, CSV parsing and safe exports.
- Twelve browser tests cover old/new calculators, desktop/mobile layouts, private
  CSP, failed/successful scenario imports, exports, historical observations and
  planner interactions.
- Sixty guide/hub/index page/viewport checks at 1440px and 390px; all 17 unique
  tool/download resource links resolve; new paths appear in the combined sitemap
  and human content index. [Browser receipt](verification/deal-models-browser.json).
- Visual inspection: source images and responsive guide/calculator screenshots.
- Source fingerprints and complete paragraph/image/worksheet coverage: passed.

Checks establish the stated implementation behavior and source preservation, not
independent assurance of real transaction forecasts or historical benchmark data.
Cloudflare's post-push deployment is separate from the local production preview.
