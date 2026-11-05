# Project foundations, improvement and problem-solving collection

Status: implemented locally; no push or deployment.

## Classification

Project Management contains governance, delivery approaches, planning and scheduling, estimation/performance, teams, project risk and closeout. Process Improvement is a separate parent for the existing Six Sigma collection, CMMI and project-management maturity. Problem Solving & Decision Making contains general framing, decomposition, 4S/TOSCA and TRIZ. Existing article URLs remain stable; related links connect the subjects.

The library landing page, topic filter, generated catalogue, XML sitemap and human-readable content index discover both new hubs. Advertising continues through the existing catalogue-aware, consent-controlled site layout.

## Retention and editorial treatment

- The new archive contains 1,257 nonempty source paragraphs across two documents, nine images and two Word equations. All are mapped in [the coverage ledger](project-core-content-coverage.csv).
- All 147 prior generated guides/indexes retain their existing sections and image reconstructions. Four retained batches now cover 6,544 paragraphs and 32 source images.
- Nine copied images become accessible themed flows, comparisons and compact summaries. No public raster images or new dependencies are added. Empty radar axes are an assessment framework, not fabricated measurements.
- Both equations have reviewed XML fingerprints and paragraph anchors. Unreviewed, changed or displaced equations fail import; original source text and equation transcriptions remain in the inventory.
- PERT includes all eight supplied triples and calculated activity duration/variance, with unspecified units disclosed. The separate network examples retain their own activities and every edge. Missing dependency data is not fabricated.
- EVM explains CV, SV, CPI, SPI, EAC and ETC. Full-precision calculations are separated from the original rounded example; missing AC units prevent a numerical remaining-cost claim.
- Legacy PRINCE2/CMMI, inaccurate Agile/Scrum/XP comparisons, unsupported success/failure statistics, conflicting PHA naming, incomplete TRIZ and vague legal labels are identified in the relevant reading notes.
- Method names without procedures remain explicit reference entries, not invented complete methods. The short quality-tool list links to the retained FMEA material and Six Sigma collection.

## New guides

- Projects: purpose, outcomes and success — `/library/knowledge/project-foundations/`
- Project lifecycle: from concept to handover — `/library/knowledge/project-lifecycle/`
- Project-management maturity: assess practices with evidence — `/library/knowledge/project-maturity/`
- Project managers, PMOs and champions — `/library/knowledge/project-leadership/`
- Project stakeholders: interests, influence and engagement — `/library/knowledge/project-stakeholders/`
- Project communication: meetings that move work forward — `/library/knowledge/project-communication/`
- Project teams: development, cooperation and performance — `/library/knowledge/project-team-development/`
- PRINCE2: products, stages and governance — `/library/knowledge/prince2-project-governance/`
- Critical chain: constraints, resources and buffers — `/library/knowledge/critical-chain/`
- Project costing: estimates, cost types and uncertainty — `/library/knowledge/project-cost-estimation/`
- Project budgets: resource plans and contingencies — `/library/knowledge/project-budgeting/`
- Project schedules: dependencies, float and critical paths — `/library/knowledge/project-scheduling/`
- PERT: three-point duration estimates and variance — `/library/knowledge/pert-three-point-estimation/`
- Activity networks: serial and parallel work — `/library/knowledge/schedule-network-examples/`
- Project risk: identify, own and respond — `/library/knowledge/project-risk-planning/`
- Project risk scoring: compare the source’s rating methods — `/library/knowledge/project-risk-scoring/`
- Project control: milestones, evidence and action — `/library/knowledge/project-monitoring-control/`
- Earned value: cost, schedule and forecast performance — `/library/knowledge/earned-value-management/`
- Project termination: finish, integrate or stop — `/library/knowledge/project-termination/`
- Project closeout: acceptance, handover and records — `/library/knowledge/project-closeout/`
- Project reviews: turn experience into usable learning — `/library/knowledge/project-lessons-learned/`
- Problem-solving tools: choose the question first — `/library/knowledge/problem-solving-toolkit/`
- Quality problem solving: causes, failures and corrective action — `/library/knowledge/quality-problem-solving/`
- Structure a problem: 4S and the TOSCA checklist — `/library/knowledge/structured-problem-solving/`
- TRIZ: technical and physical contradictions — `/library/knowledge/triz-contradictions/`
- CMMI: capability, maturity and institutionalized improvement — `/library/knowledge/cmmi-capability/`

## Expanded existing guides

- `project-charter`
- `organizational-structures`
- `agile-foundations`
- `waterfall-v-model`
- `xp-values-practices`
- `preliminary-hazard-analysis`

## Verification

Source generator assertions cover archive fingerprints, every paragraph, all image mappings, equation transcriptions, existing destinations, related links and category membership. Three negative parser checks confirm rejection of unreviewed math, changed fingerprints and changed anchors. No content unit tests were added.

Typecheck, optimized production build and full repository lint passed. 108 render checks and 22 accessibility audits passed across mobile and desktop, including six final checks after the table refinements. Browser, accessibility, discovery and final lint results are recorded in [verification evidence](verification/project-core-library.json) and [browser evidence](verification/project-core-browser.json). Temporary preview artifacts and screenshots are under `/mnt/sdb/ig-new-review/project-core/`.

## Maintenance

New source: `content/sources/business/project-core/collection.zip`; exact original paragraphs, table coordinates, image hashes and equation records: `editorial/inventory.json`. Reviewed ranges, introductions, notes and visual summaries: `scripts/content-business/project-core-plan.json`. Source visuals: `project-core-figures.json`; equation transcriptions: `project-core-equations.json`.

Regenerate all retained batches with `python3 scripts/content-business/build.py`. Do not overwrite an earlier archive when a new D.zip is uploaded.
