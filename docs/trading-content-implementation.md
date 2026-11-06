# Trading training — classification, preservation and implementation

Implemented locally on 6 November 2026. This change is not pushed or deployed.

## Reader structure

New topic: `/library/knowledge/trading-market-analysis/`, with **17 guides across seven sections**. It is a separate learning area, connected to Finance & Accounting and Investing & Portfolio Management rather than mixed into long-term portfolio material.

| Section | Guides |
| --- | --- |
| Start with a plan | Trading foundations; styles, timeframes, currency pairs and session clocks |
| Chart reading | Market structure/levels/volume; candlestick atlas; harmonic atlas; classical patterns, trendlines and specialist formations |
| Price action & setups | SMC/ICT vocabulary; analysis checklist; market regimes and the swing/turn/bounce/break playbook |
| Risk & execution | Position sizing, exposure and loss limits; orders, stops, targets and partial exits |
| Psychology & review | Discipline/journaling; all 41 behavioral prompts with clarified distinctions |
| Signals & validation | Indicator reference; all eight forex strategy-note groups; external resources, validation limits and missing material |
| Quantitative methods | All 24 quantitative-finance topics, plus VAR/VARMA/BVAR and Avellaneda–Stoikov |

Two existing investment guides gain links to the trading material. Finance and investment category navigation also links to the new topic. Existing statistical, AI/time-series and research-method guides supply related reading without duplicating their entire content. No trading calculator, live signal service, account connection or strategy execution is added.

## Source completeness

Upload SHA-256: `f6545d6d1b79ff6bde6347edab290704d874547cdc0d0336fa93d4b29229543d`.

The archive contains one training document: **601 nonempty paragraphs, 2,903 words, 10 tables, six images and five external hyperlinks**. Every paragraph and image is mapped to a destination. Substantive wording is retained in readable sections or original-note disclosures; structural titles may be consolidated. The original archive, including the original embedded image bytes, is retained unchanged at `content/sources/trading/collection.zip`.

The five external targets and their paragraph anchors are explicitly reviewed. The shared parser still rejects unexpected external objects, unreviewed URLs and changed link mappings. No broad bypass of source checks was introduced.

Evidence: [paragraph/image ledger](trading-content-coverage.csv), [section review decisions](trading-source-reviews.csv), [image-panel ledger](trading-image-coverage.csv), [inventory](../content/sources/trading/editorial/inventory.json), [coverage assertions](verification/trading-library.json).

## Visual treatment

A small server-rendered reference gallery uses the site's purple/teal palette and typography, with expandable groups, semantic headings and textual descriptions. It includes **158 conceptual SVG sketches and 44 source-linked study cards**, covering **202 source placements**:

- 68 named candlestick illustrations.
- 20 harmonic panels across ten families and two orientations.
- 20 labelled classical formations.
- 48 unlabelled studies of levels, projections, trendlines, channels, fans and wave counts.
- 44 institutional-price-action placements across 22 named pairs, organized as study cards linked to the original detailed sheet. These complex illustrations are not replaced with inferred sketches.
- Two specialist illustrations: Wolfe Wave and Adam & Eve.

Native sketches are explicitly conceptual, not exact geometric transcriptions, price observations or tested signals. Unlabelled source panels receive descriptive headings rather than invented system names. The **complete supplied artwork remains available for exact original line placement, ratio associations, arrows and fine print** through bounded previews and full-resolution WebP references. All six images are retained in this reader-accessible form; the twelve image derivatives total 1,417,536 bytes. Original pixels remain in the unchanged archive.

The institutional sheet's printed adaptation credit to ReadTheMarket.com / Mansor Sapari aka CMS is retained as an unverified supplied attribution. No authenticated original publication or licensing claim is invented. Other images have no authenticated creator identified in the upload.

## Editorial corrections and uncertainties

Reviewed explanations stay separate from the exact supplied notes. Important decisions include:

- The contrast between 5% annually and 5% monthly is unsupported performance rhetoric. A hypothetical repeated 5% monthly compounds to approximately 79.6% annually before costs; neither outcome is established by this upload.
- The 60/30/10 mindset/money/method split and 1–2% per-trade, 5% open-risk and 10% monthly limits remain source examples, not scientifically measured weights or universal safe budgets. Stop prices do not guarantee fills or maximum losses.
- The instruction to widen a stop near news is contextualized against the note not to increase risk. Correlated currency exposure, margin, gaps, costs and residual positions are made explicit.
- EST and EDT differ. The source's fixed EST-to-UTC+8 conversions use 13 hours; EDT uses 12. Source windows are not asserted to be official session or FOMC announcement times. The position-trading `M1` notation is left ambiguous rather than silently interpreted as a monthly bar.
- The source's unexplained currency-pair `r` notation is not converted into asserted correlation coefficients. Broker tick volume is not treated as consolidated global FX transaction volume.
- Harmonic ratios are preserved as printed, including unusual values and differing Cypher/Deep-Crab labels. Detached numeric columns are not guessed into validated leg specifications.
- The contradictory reversal phrase, incomplete regime sequence, undefined five-times breakout target, unclear EMA-bW/ASL terms and ambiguous post-trade waiting reminder remain identified.
- The eight forex note groups retain all settings and original rules. RSI EMA-13, the MACD 50% histogram rule, Ichimoku line references, discretionary H4/M15 terms and Tekan Seja indicator/crossing definitions are incomplete. The source's Stochastic-RSI 80/20 direction is not silently reversed.
- Hypothesis testing does not establish that a trading pattern is real; VARMA does not automatically cure overfitting. VaR/ES and Kelly remain conditional model concepts rather than guaranteed loss limits or universally suitable sizing rules.
- The full behavioral list distinguishes cognitive biases, selection effects, an optical illusion, credibility judgments and prospect theory. The latter is not merely a response to having more choices. The review prompts are editorial aids, not psychological diagnoses.

Primary context links on the relevant pages include the CFTC forex advisory, Investor.gov order definitions, Fidelity's technical-analysis overview, TradingView indicator documentation, US Naval Observatory time-zone definitions, the authors' forecasting text, the Avellaneda–Stoikov paper and Nobel Prize scientific background. These sources clarify the relevant concepts; they do not validate the uploaded strategies.

The named `Beyond The Markets - OrientFX.pdf` **is absent**. No book text is invented. No trade dataset, annotated execution log, complete script configuration or independently verified performance record accompanies this upload. These gaps are visible on the site.

## Discovery, verification and hygiene

The combined sitemap, content sitemap and human-readable content index discover **582 catalogue entries**, including all 18 new URLs. All prior 564 catalogue URLs remain. Previous guide sections/figures, the existing formula directory and the academic-reference catalogue are unchanged apart from the intended appended reading connections.

Verification passed:

- Production build and changed-file ESLint; five existing library/category checks.
- Source coverage, all 24 quantitative topic names, all behavioral source prompts, image/asset fingerprints and rejection of unreviewed/changed hyperlinks.
- **40 page renders** at 390px and 1440px, with canonical, category, related-link, anchor and overflow checks.
- **1,432 retained-passage checks**, original-note disclosures and all 202 gallery placements at each width.
- **12 figure checks** covering group expansion, labels, candle geometry, bounded image previews and full source-image access.
- **16 accessibility audits**, all **582 catalogue routes**, combined/content sitemap discovery and the human-readable index.
- The bounded Graphify architecture graph was refreshed. Existing advertising and consent behavior is preserved.

Browser evidence: [rendering and interaction report](verification/trading-browser.json), [topic and terminology search](verification/trading-search.json). Temporary extraction, metadata, optimization scripts, browser scripts and screenshots remain outside Git on `/mnt/sdb`. Unrelated user changes and uploads are untouched. The preview server is stopped after review. No new content-only test suite or dependency was added.
