# Business agreements and deal-document integration

Implemented 10 November 2026. Local implementation; publication requires a separately authorised push.

## Reader structure

The new **Business Agreements & Deal Documents** hub connects subject-specific guides instead of putting every document under one overloaded business category. It sits under Strategy & Growth, leaving the business gateway’s seven existing primary hubs intact.

| Guide | Primary destination |
| --- | --- |
| Business loans and personal guarantees | Finance → Valuation & Transactions → Funding agreements |
| Convertible funding: caps, discounts and event-driven repayment | Finance → Valuation & Transactions → Funding agreements |
| Acquisition term sheets: control, price and closing conditions | Finance → Mergers, Acquisitions & Integration → Deal documents |
| Founder fundraising equity: milestones, vesting and repurchase | Strategy & Growth → Venture planning |
| Partnership MOUs: scope, responsibilities and binding carve-outs | Strategy & Growth → Growth and restructuring |
| Nominee directors: duties, indemnities and appointment controls | Leadership → Business Ethics & Governance → Ownership & appointments |
| Nominee shareholding: voting, dividends and beneficial ownership | Leadership → Business Ethics & Governance → Ownership & appointments |
| Outsourced administration: scope, banking authority and liability | Operations & Performance → Operating practices |
| Protecting introductions: confidentiality and non-circumvention | Agreements hub → Introductions & fees |
| Finder’s fees: introductions, success triggers and the payment tail | Agreements hub → Introductions & fees |
| Intermediary commission waterfalls: payers, triggers and beneficiaries | Agreements hub → Introductions & fees |
| Vehicle funding, buyback and equity conversion | Finance → Investing & Portfolio Management → Private capital & institutions |

Two additional shared guides explain agreement-reading mechanics and compare NCNDA, finder-fee and fee-protection documents. Individual drafts retain their distinct clauses, numbers, durations and exceptions. Existing founder-investment and M&A guides gain related links; six existing collections gain contextual reading paths. Debt-capacity, acquisition-impact and diligence tools are linked where relevant without claiming they establish legal validity.

## Source retention and privacy

- Uploaded archive SHA-256: `c9d5791996a5fb451f756f534900358ca28f54de727b7db75f031f8711ed3e70`.
- 12 documents; **874 nonempty paragraphs**, including nine source tables. No embedded images, charts, objects, equations or auxiliary text were identified by the guarded source reader.
- The exact upload is preserved outside the public repository at `/mnt/sdb/agreement-review/private/original-upload.zip` (mode 0600), with the same SHA-256 as the upload. Root `D.zip` is now ignored to prevent accidental publication.
- `content/sources/business-agreements/collection.zip` is an anonymised teaching copy (SHA-256 `44bf43e4eaddffc0f68e3cb60c9a7045a6a33a3854db2661b5ee93f0c8d8d3d3`). It retains all body paragraphs and table structure after five reviewed identifying-string replacements; the package is normalised to body XML plus minimal DOCX manifests, removing metadata and package-level style definitions. Original document formatting remains available in the private upload. The generated inventory and coverage ledger derive from this public-safe copy.
- Every paragraph maps to a public guide and section in [the coverage ledger](business-agreements-content-coverage.csv). Public expanded detail retains each teaching-copy paragraph’s wording, with identifying strings replaced with role placeholders. Original signatures and placeholders remain in expandable detail rather than dominating the reading view.
- The build checks every public source paragraph against the anonymised archive, in order, and rejects dropped or changed wording. A separate local comparison checks the anonymised archive against all 874 original paragraphs after the five reviewed replacements and scans the new public content for those identifiers. Public searchable summaries use editorial text, not the source disclosures.
- The GitHub repository is public. Only the anonymised teaching archive, inventory, ledger and plan are included in this change. The exact original and replacement map remain in private local storage; no source archive is linked as a public website download. De-identification is not a guarantee against identification through context.

## Editorial treatment and limits

Each source guide has a meaningful title, introduction, four-step reading flow, section-level interpretation, source issues and related paths. Clauses are available within expandable disclosures, adjacent to their interpretation. Existing theme, type, comparison tables and responsive reading layouts are reused. The visual comparisons cover loan versus guarantee versus indemnity, commission allocation, the agreement-review sequence and the three intermediary-document roles. No raster images or dependencies are introduced. Existing site-level advertising and consent safeguards remain in place.

Important unresolved matters are labelled, rather than silently corrected:

- Loan: S$100,000/S$300,000 conflicts; 2020/2021 execution references; May interest date versus October loan date; three-month accrual versus single-month amount; undefined default-compounding period; guarantee party-reference defects. The 5% monthly rate is not endorsed; lending-law applicability has not been assessed.
- Founder: upfront unvested shares versus issuance on fundraising; no normal time-based vesting schedule; nil repurchase price; unclear event cross-references and missing wider founder arrangements.
- Convertible funding: no fixed maturity, ordinary interest or express voluntary prepayment mechanism; financing versus liquidity conversion formulas differ; option-pool denominator matters; insolvency conversion and priority require review. The draft does not define a separate insolvency conversion price clearly.
- Nominee director: statutory duties and indemnity limits remain relevant; purported strike-off remedies, blank intermediaries, cross-references, term, CPF language and fees require reconciliation. Current nominee-record requirements are not supplied by the historical draft.
- Nominee shareholder: registered and beneficial holding differ; incomplete “shorter period of” wording; cost and contribution allocations require confirmation. Confidentiality is not a conclusion about regulatory disclosures.
- MOU: expressly identified binding carve-outs; unclear article cross-references and incomplete subsequent commercial terms.
- Outsourcing: S$1 fee; defective notice phrase; products language in administration indemnities; cap tied to five years of fees; copied nominee signature labels; absent detailed operational schedules.
- Acquisition: Philippine-peso seller price versus Singapore-dollar operating facility; 51% control versus management/profit language; missing quantified claim limits; unclear binding status and cross-border approvals. Referenced confidentiality agreement and definitive transaction documents are absent.
- Ambassador: actually mixed vehicle funding, rental, buyback and conversion; unresolved return placeholders; referenced service contract absent; unclear asset title, valuation, payment security and interaction of drag-along with capital return. No investment promotion or approval is implied.
- Finder’s fee: merchant versus investor scope; 5% success fee versus undefined Upkeep Fee; broad continuing entitlement versus six-month wording; regulated-activity questions depend on conduct and exemptions.
- NCNDA: overly broad claimed third-party reach; separate fee contract needed; 18-month post-termination restriction; 200% penalty assertion; Singapore arbitration plus Georgia governing law. Different legal choices can coexist, but must be deliberate and coherent; no Georgia-law opinion is supplied.
- IMFPA: stock described as commodity; ambiguous payer and payment trigger; absent institutional acceptance and complete dispute terms; percentages sum to 3%, but this does not prove payment security.

## Primary-reference checks

References support bounded context, not blanket validation of the supplied documents:

- [ACRA director duties](https://www.acra.gov.sg/manage/companies/legal-requirements-common-offences/directors-duties/): duties apply to nominee directors as well. The source deed does not remove them.
- [ACRA register guidance](https://www.acra.gov.sg/regulations/practice-directions-registrars-interpretations-guidance/rorc-rond-rons-guidance/): company/controller and nominee records, including central filing, need current assessment. No historical filing deadline is presented as a future deadline.
- [Companies Act 1967, Part 5](https://sso.agc.gov.sg/Act/CoA1967?ProvIds=P15-): sections 172–172B distinguish indemnity restrictions, insurance and permitted third-party protection. Direct retrieval returned 403; the official indexed statutory excerpt was available. This is not a clause-by-clause statutory opinion.
- [MAS CMS licensing](https://www.mas.gov.sg/regulation/capital-markets/apply-for-licensing-or-registration-of-capital-market-entities/cms-licence): actual capital-markets dealing/advisory conduct and exemptions matter; “finder” and “ambassador” are not licensing determinations.
- [Denka v Seraya, Singapore Court of Appeal](https://www.elitigation.sg/gd/s/2020_SGCA_119): the penalty rule concerns secondary obligations triggered by breach. It does not adjudicate the NCNDA or establish Georgia-law treatment.
- [PDPC anonymisation guidance](https://www.pdpc.gov.sg/help-and-resources/2018/01/basic-anonymisation): supports careful handling of identifiers and context. No regulatory certification of the public examples is asserted.

The SIAC model-clause page returned 403. No unverified current model wording or rules edition has been inserted into these historical drafts. None is promoted as ready for execution, a guarantee of returns or a complete legal review.

## Discovery and validation

All 15 new pages enter the existing published knowledge catalogue. The combined sitemap, content sitemap group, content index, library search and collection navigation derive from that catalogue; no redundant static route registrations are needed. [Verification receipt](verification/business-agreements-checks.json) records source, discovery, browser and build checks. Temporary browser captures and logs remain outside Git under `/mnt/sdb/agreement-review/`.

Validation completed: guarded rebuild of all source batches, production build with TypeScript, **30 page/viewport checks**, **31 internal links**, content sitemap and content-index discovery, and **three accessibility scans with zero violations**. Expanded clauses were checked for overflow and identifying strings. Graphify refreshed its bounded graph (317 files, 1,258 nodes, 2,733 edges); incremental extraction still reports ten unresolved endpoint references, so it remains a partial structural map. No broad test suite was run for this content change. Physical-device and Safari checks, transaction-specific legal advice and live deployment are outside this verification.

The graph initially refused a one-node shrink. Inspection confirmed its sole deleted source was the identifying-string replacement map moved outside the public repository. The intentional one-node prune was then accepted; no unexplained source removal was ignored.
