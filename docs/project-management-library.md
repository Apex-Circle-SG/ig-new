# Project Management and Six Sigma library

Status: implemented locally; not pushed.

## Structure

Project Management is the parent hub at `/library/knowledge/project-management/`, with six sections: planning/governance; delivery approaches; Six Sigma/process improvement; risk/assurance; estimation/performance; teams/responsibilities/change.

Six Sigma & Process Improvement is a focused child collection at `/library/knowledge/six-sigma-improvement/`. Its guides cover foundations, DMAIC/DMADV, Taguchi loss and robust design, excellence-model outlines, process architecture and Lean supply. Its relationship to ongoing operations is acknowledged and linked through Business & Management.

Technical modeling is classified under Technology. A new Technology hub includes all 14 existing technical articles unchanged and the new Empirical Modelling, Markov/HMM, model-driven engineering and constructionist-design references. Project Management links to these technical subjects.

No empty future-project-management pages are created. Additional supplied material can extend the same six-section structure.

## Coverage

- Six retained DOCX files, approximately 19,515 words, 952 nonempty paragraphs and no embedded images/equations.
- Exact uploaded archive preserved at `content/sources/business/project-management/collection.zip`.
- 41 new guides, including two clearly identified editorial comparison maps.
- One Six Sigma child index and two topic hubs (Project Management and Technology): 44 new URLs.
- Four older guides receive related source detail: balanced scorecard, Kotter, change responses and customer feedback. Risk-management and Kanban guides receive related navigation links.
- Every new paragraph has a destination in `docs/project-content-coverage.csv`; exact source text and document hashes are in the retained editorial inventory.
- The four MDE paragraphs duplicated under the iterative-development heading share one displayed section; both source locations remain mapped. Reuse is rejected unless the nonstructural text is already present in that section.
- Across the three retained batches: 5,287 paragraphs and 23 original images mapped, with zero unmapped items. The earlier unavailable source image remains disclosed in its original guide.
- Existing 105 guide/index contents are retained; existing 14 Technology catalogue articles retain their URLs, titles and bodies.

The generator now owns catalogue entries by slug, rather than deleting whole topics. Adding a Technology hub therefore preserves its pre-existing articles. Discovery rules read a generated topic-root list, so additional collections do not require hardcoded topic checks in the page dispatcher or library filters.

## Presentation and navigation

Meaningful titles, introductions, takeaways, section navigation, source limitations and related guides accompany the detail. Source tables retain their relationships. New compact process flows, comparisons and role summaries are editorial HTML/CSS visuals, explicitly distinguished from unavailable source diagrams. No image-generation service or new production dependency is required.

All 44 new URLs are discovered by the existing combined sitemap and human-readable content index. Technology’s existing pages gain links back to its hub and to Project Management. Existing consent/privacy advertising controls apply through catalogue eligibility.

## Source gaps and corrections

- Taguchi loss and signal-to-noise equations and the referenced figure are absent; no source diagram is claimed to have been recovered.
- The fault-tree Table 1/patient example, MORT charts/manuals and iterative painting illustration are absent.
- The source’s PROBE variables and coefficient symbols are incomplete/corrupted. The lower prediction interval is mislabeled UPI. No missing confidence level, regression dataset or interval formula is invented.
- Planned program-size accounting does not reconcile: with printed base “00”, 500 + 0 − 10 − 20 + 20 = 490, while the source total is 590. The implied possible base 100 is not silently substituted. Actual values reconcile to 600.
- Risk scales mix ordinal rankings and ratings, contain ambiguous occurrence units and omit one detection row. No risk-priority-number calculator or calibrated probabilities are invented.
- Blank/0% tracking entries are presented as template placeholders, not measured project results.
- The probability/likelihood definition is corrected in reading notes with NIST support while the original paragraph is retained.
- Taylor’s source publication date is 1909; the linked primary text is dated 1911. The discrepancy is disclosed.
- Fixed refinement timeboxes are identified as one team’s example; the official Scrum Guide describes refinement as ongoing activity.
- Six Sigma’s 3.4-DPMO convention is explained with its long-term shift assumption, without treating every process as having the same defect probability.
- The old EFQM outline, historical adoption/financial claims and legacy regulatory/standards references are identified with their limits.
- DuraLabel and HCRQ promotional passages remain accessible as source/vendor context rather than endorsed technical conclusions.
- Copied “Add to My Personal Learning Plan” navigation clutter is removed from the reading text; the exact original remains in the inventory and ledger.

Selected supporting references were checked against the official Scrum Guide, NIST, ASQ, EFQM, Warwick and the primary Taylor text. This is not certification of every historical, safety or organizational claim in the supplied material.

## Destinations

- New: Six Sigma: variation, defects and improvement — `/library/knowledge/six-sigma-foundations/`
- New: DMAIC or DMADV: improve a process or design one — `/library/knowledge/dmaic-dmadv/`
- New: Taguchi: quality, variation and loss — `/library/knowledge/taguchi-quality/`
- New: Robust design: system, parameter and tolerance choices — `/library/knowledge/taguchi-robust-design/`
- New: Quality excellence models: compare the supplied perspectives — `/library/knowledge/quality-excellence-models/`
- New: Process architecture: connect inputs, activities and customers — `/library/knowledge/process-architecture/`
- New: Lean supply: quality, lead time and continuous improvement — `/library/knowledge/lean-supply/`
- New: Project charters: define scope, purpose and ownership — `/library/knowledge/project-charter/`
- New: Strategy deployment: align objectives, improvements and resources — `/library/knowledge/strategy-deployment/`
- New: Action plans and reviews: make progress traceable — `/library/knowledge/project-action-reporting/`
- New: Software delivery approaches: compare assumptions and feedback — `/library/knowledge/delivery-approaches/`
- New: Waterfall and the V-model: sequence and planned assurance — `/library/knowledge/waterfall-v-model/`
- New: Spiral and iterative delivery: learn through repeated cycles — `/library/knowledge/spiral-iterative-delivery/`
- New: Agile delivery: feedback, uncertainty and people — `/library/knowledge/agile-foundations/`
- New: Extreme Programming: values, feedback and engineering discipline — `/library/knowledge/xp-values-practices/`
- New: Lean Agile practices: refinement, acceptance criteria and refactoring — `/library/knowledge/lean-agile-practices/`
- New: PSP, CMM and TSP: personal discipline and team delivery — `/library/knowledge/software-process-discipline/`
- New: PROBE estimation: sizes, regression and prediction ranges — `/library/knowledge/probe-estimation/`
- New: Software size accounting: reconcile the plan and actuals — `/library/knowledge/psp-size-accounting/`
- New: PSP tracking sheets: phases, time and defects — `/library/knowledge/psp-tracking-templates/`
- New: Preliminary hazard analysis: identify issues early — `/library/knowledge/preliminary-hazard-analysis/`
- New: HAZOP: examine deviations from intended operation — `/library/knowledge/hazop-study/`
- New: Software FMEA and FMECA: distinguish the requested analysis — `/library/knowledge/software-fmea/`
- New: Fault trees: reason backward from an unwanted event — `/library/knowledge/fault-tree-analysis/`
- New: Cause–consequence analysis: link causes to possible outcomes — `/library/knowledge/cause-consequence-analysis/`
- New: MORT: examine barriers and management contributions — `/library/knowledge/mort-investigation/`
- New: Choose a hazard-analysis question before choosing a tool — `/library/knowledge/hazard-methods-comparison/`
- New: Risk ratings: read the supplied severity and detection scales — `/library/knowledge/risk-rating-scales/`
- New: Top-down and bottom-up: separate the risk-modeling context — `/library/knowledge/risk-modeling-perspectives/`
- New: RASCI: make responsibility and accountability explicit — `/library/knowledge/rasci-responsibilities/`
- New: Organizational structures: fit the work and the strategy — `/library/knowledge/organizational-structures/`
- New: Scientific management: ideas, history and critiques — `/library/knowledge/scientific-management/`
- New: Change communication: connect stakeholders, messages and review — `/library/knowledge/change-communication-planning/`
- New: Concept selection: Pugh matrices and group prioritization — `/library/knowledge/group-concept-selection/`
- New: Empirical Modelling: observation, dependency and agency — `/library/knowledge/empirical-modeling/`
- New: Markov models and HMMs: states, transitions and observations — `/library/knowledge/markov-models/`
- New: Model-driven engineering: models as engineering artifacts — `/library/knowledge/model-driven-engineering/`
- New: Constructionist design: modular integration for interactive AI — `/library/knowledge/constructionist-design/`
- New: Wheel-and-spoke development: share a prototype across programs — `/library/knowledge/wheel-spoke-development/`
- New: The chaos model: connect small tasks with project-level work — `/library/knowledge/chaos-development-model/`
- Expanded/linked: Balanced scorecard: connect strategy to measures — `/library/knowledge/balanced-scorecard/`
- Expanded/linked: Kotter: build support and sustain change — `/library/knowledge/change-kotter/`
- Expanded/linked: Responding to change: emotion, engagement and support — `/library/knowledge/change-responses/`
- Expanded/linked: Customer feedback: NPS and learning loops — `/library/knowledge/customer-feedback/`
- New: Transformation: readiness, ownership and daily improvement — `/library/knowledge/transformation-deployment/`
- Expanded/linked: Risk management: prioritize uncertainty and response — `/library/knowledge/risk-management/`
- Expanded/linked: Kanban: visualize work and limit work in progress — `/library/knowledge/kanban-workflow/`

## Guide-specific reading notes

### Six Sigma: variation, defects and improvement

- The source contains historical adoption, savings, trademark and standards claims without complete references; these are retained as source claims, not current organizational facts.
- The conventional 3.4-defects-per-million figure uses a 1.5-standard-deviation long-term mean-shift convention and depends on how defect opportunities are defined. It is not a universal defect probability obtained merely by saying “six standard deviations”.
- The “effectiveness = quality × acceptance” expression is a management heuristic, not a measured physical law.

### DMAIC or DMADV: improve a process or design one

- The source places DMADV and DFSS together. DMADV is presented here as a design pathway; the notes do not establish that it is the only Design for Six Sigma approach.
- No process capability results or complete worked improvement project are supplied.

### Taguchi: quality, variation and loss

- The referenced loss-function figure and several equations are absent from the archive. The text describes a quadratic relationship, but no missing source image or equation is represented as recovered.
- Mean/variance notation is corrupted in the source. The prose distinguishes process variation and off-target bias, but this document is not a complete calculation specification.
- Attributed quotations and historical claims lack full bibliographic details.

### Robust design: system, parameter and tolerance choices

- Signal-to-noise equations and the referenced figures are not supplied. The source’s wording also confuses variance/standard-deviation notation; no executable formula is inferred from it.
- Welding, composite-fitting and non-quadratic-loss cases are source summaries without the underlying data. They cannot be independently recomputed from this archive.
- Statements about controversy, national practice and statistical efficiency are historical source commentary, not a current comparison of countries or methods.

### Quality excellence models: compare the supplied perspectives

- The EFQM enablers/results outline is an older presentation. The source provides no edition, assessment criteria or scoring rubric.
- Baldrige and Shingo are named only at category/summary level. No certification score, complete model or causal equation is invented.

### Process architecture: connect inputs, activities and customers

- The source heading reads “AQPC”, apparently referring to APQC; its exact edition and publication are not supplied. The spelling is retained in the detailed notes.
- The Catalyst inventory has no complete source citation. The lists are preserved as the collection’s process examples, not asserted as current official frameworks.

### Project charters: define scope, purpose and ownership

- The source supplies field names, not a completed charter or a worked project. Blank fields are presented as a reference checklist.
- “Recognising casual interrelationship” appears in the original objective-setting list; it may be a terminology error, and no causal analysis method is supplied.

### Strategy deployment: align objectives, improvements and resources

- No completed X-matrix, correlation values or resource allocations are supplied. The visual below is a conceptual reading aid, not a recovered source matrix.
- Compliance, debate, discussion and dialogue are the source’s catchball-style labels, not a validated maturity scale.

### Action plans and reviews: make progress traceable

- The tracking chart, timing plan, X-matrix and PDCA status are named but no filled examples, numerical results or complete templates are included.

### Software delivery approaches: compare assumptions and feedback

- The comparison is an editorial synthesis of the supplied descriptions. The source’s “best for” claims are contextual opinions rather than universal selection rules.

### Waterfall and the V-model: sequence and planned assurance

- The source’s fixed-size recommendations, “no prototypes” statements and success comparisons are simplified descriptions, not universal rules for every V-model implementation.
- The relationship graphic is an editorial summary; it does not claim to recover a missing source diagram.

### Spiral and iterative delivery: learn through repeated cycles

- The iterative painting illustration is referred to but absent. The editorial flow below is not a reconstruction of that image.
- The source says both that detailed requirements can emerge and that complete requirements are understood, and it describes rigid non-overlapping iterations. These are source tensions, not requirements imposed by this guide.

### Agile delivery: feedback, uncertainty and people

- The chapter uses historical commentary and attributed quotations without complete editions or publication references. These are retained as supplied.
- Agile is discussed broadly here; the source does not supply a complete Scrum Guide or a universal delivery recipe.

### Extreme Programming: values, feedback and engineering discipline

- “Current state” in the source refers to late-1990s/early-2000s commentary, not an updated adoption survey.
- Recommendations about small teams, safety-critical work and project size are source generalizations; no conclusion about a real project’s compliance or suitability follows from this list.
- Statements that XP rejects reuse or that only code matters are source rhetoric, not requirements that replace professional design judgment.

### Lean Agile practices: refinement, acceptance criteria and refactoring

- Two-week sprints, four-sprint releases and two-/eight-hour refinement meetings describe one team. They are not mandatory Scrum events or timeboxes; the Scrum Guide describes refinement as ongoing activity.
- The text’s assertion that all test scenarios are covered by acceptance criteria is not demonstrated. Acceptance criteria do not prove exhaustive testing.
- Refactoring is not inherently technical debt. It can improve internal structure; the source’s equation of refactoring with waste/debt is retained as a claim to examine.

### PSP, CMM and TSP: personal discipline and team delivery

- The reported failure rate and six-percent schedule deviation refer to historical claims with incomplete citations in this archive. They are not current delivery benchmarks.
- The source discusses CMM and PSP/TSP terminology historically; it does not provide a current maturity assessment or certification procedure.

### PROBE estimation: sizes, regression and prediction ranges

- BA and PA are not defined in the supplied extract. The regression symbols rendered as ë_0 and ë_1 appear corrupted. No coefficient values, data or proxy-size mapping are invented.
- The lower-interval line is labeled UPI although its expression subtracts Range. It appears to be a lower prediction limit; the source wording is retained and the discrepancy is disclosed.
- No confidence level or method for computing Range is supplied, so no numerical interval or calculator is created.

### Software size accounting: reconcile the plan and actuals

- The planned base is printed “00”. With that value, the supplied total formula gives 490, while the table reports 590. A base of 100 would reconcile it, but that correction is not assumed.
- Actual values reconcile to 600 under the printed formula. The table is a source example; code-size counts are not a stand-alone measure of software value.
- The “Total New / Reused” label is split and ambiguous. Its meaning is not silently completed.

### PSP tracking sheets: phases, time and defects

- The source’s headings mention time in phase, defects injected and defects removed, but its extracted rows are mostly phase labels and 0% placeholders. It is not a complete dataset or a filled project report.

### Preliminary hazard analysis: identify issues early

- PrHA here means preliminary hazard analysis. Process hazard analysis is a broader use of the abbreviation PHA; the two are not treated as interchangeable names.
- One- or two-person reviews and the marine/LNG examples are source descriptions, not a staffing rule or a vessel-specific safety assessment.
- Source suggestions about informal documentation do not establish what records a real project or regulator requires.

### HAZOP: examine deviations from intended operation

- The source supplies no complete P&ID, guideword worksheet or worked HAZOP. No safety conclusions about an actual process can be inferred.
- “Most commonly used” and the vendor’s growth/warranty claims are unverified source assertions. The printer passage is retained as attributed source context, not presented as a recommendation.
- Applicability and team requirements for a regulated process must be established for the actual context; this is an educational collection.

### Software FMEA and FMECA: distinguish the requested analysis

- The HCRQ training statement is preserved as a vendor claim. It is not an endorsement or evidence that the technique guarantees useful results.
- 49 CFR 238.105 and MIL-STD-1629A are cited in the source without a verified current edition or applicability determination. The quotation is preserved as historical source material, not current compliance guidance.
- The source contains “SFM CA”, apparently a damaged label. No missing technical requirement is reconstructed.

### Fault trees: reason backward from an unwanted event

- The referenced Table 1 and patient-hazard Figure 1 are absent. The visual below explains the gate concepts without claiming to recover that medical-device example.
- No failure probabilities, dependency assumptions or complete tree are supplied. No top-event probability is invented.

### Cause–consequence analysis: link causes to possible outcomes

- No complete event tree, fault tree or probability dataset is supplied. The reading sequence does not establish a risk estimate for a real system.

### MORT: examine barriers and management contributions

- The actual MORT charts and manuals are absent. Codes such as SA1, SB1, MA1 and MB2 are retained but cannot be followed as a complete chart-based procedure from this archive alone.
- “Ultimate” hazard tool, diagram sizes and one-hour estimates are source claims, not a ranking or a promised effort estimate.
- The source contains typographical and citation errors, including “February 19732” and “MOST Users Manual”. No original publication is reconstructed.
- MORT’s assumed-risk route is part of the source model, not a declaration that an actual loss is acceptable.

### Choose a hazard-analysis question before choosing a tool

- This is an editorial reading map, not a safety assessment, qualification tool or determination that a particular regulatory requirement is satisfied.

### Risk ratings: read the supplied severity and detection scales

- The source mixes 1–5 rankings with 1–10 ratings. It gives no validated conversion, risk-priority formula or rule for combining them.
- The occurrence intervals and their frequency descriptions are inconsistent or ambiguous. They are preserved, not converted into calibrated risk estimates.
- Only four detection/visibility rows are supplied, ending at ranking 2. The missing ranking-1 row is not invented.

### Top-down and bottom-up: separate the risk-modeling context

- The source combines sector/stock selection with operational-risk modeling. Its claims that one method never uses historical data and that either method is inherently backward/forward-looking are not established general rules.
- These notes are a terminology comparison, not investment advice, a portfolio strategy or a numerical risk model.

### RASCI: make responsibility and accountability explicit

- The source alternates RACI and RASCI wording. The extra S is supporting; the guide retains both labels while explaining the distinction.
- The single-accountable-person convention is the source’s rule for the matrix, not a complete organizational governance model.

### Organizational structures: fit the work and the strategy

- The university and Google examples are undated generalizations, not current organizational assessments.
- Claims that a structure removes the need for innovation or guarantees better decisions are source simplifications.

### Scientific management: ideas, history and critiques

- The source gives 1909 as the book publication date. The linked primary text is dated 1911; the original wording is retained with this correction. Other work-study anecdotes still lack complete references.
- “Add to My Personal Learning Plan” is copied navigation text in the original. It is removed from the reading text while retained in the exact source inventory.
- Claims about all workers’ motivation or the origins of modern teamwork are historical source assertions, not universal explanations of behavior.

### Concept selection: Pugh matrices and group prioritization

- “Normal Group Technique” is the source label; it appears to refer to Nominal Group Technique, but the original reference is missing. The supplied procedure is retained without claiming it is a complete canonical protocol.
- The instruction to use groups of six is a source example, not a universal requirement. No Pugh scoring matrix or criteria weights are supplied.

### Empirical Modelling: observation, dependency and agency

- The source’s “current” EDEN implementation description and its quoted criticisms are undated. They are preserved as historical notes, not current software recommendations.
- “Broken functional programming” is an attributed critical opinion in the source, not the definition of the approach.

### Markov models and HMMs: states, transitions and observations

- The source definition of likelihood as requiring unaccounted outcomes is incorrect. A likelihood treats the observed data as fixed and varies model parameters; the original paragraph remains accessible with this correction.
- “No memory” is shorthand for conditional dependence on the modeled current state, not a claim that the state cannot encode information about the past.
- The parameter-description paragraph ends “If they are variable,” and is incomplete. No missing continuation is invented.
- The biological examples are illustrative source prose. No transition matrix, emission probabilities or executable HMM example are supplied.

### Model-driven engineering: models as engineering artifacts

- Four MDE paragraphs repeat verbatim under the source’s iterative-development heading. They share one displayed treatment, with both source locations mapped.
- “Best known” and language-generation claims reflect the source’s undated framing, not a current comparison of engineering tools.

### Constructionist design: modular integration for interactive AI

- The extract gives no paper title, authors, date, implementation, evaluation data or complete CDM procedure. Its first-person claims are retained as source claims, not InsightGinie’s own experiment.
- No current architecture recommendation or reproduced AI system is implied by this abstract.

### Wheel-and-spoke development: share a prototype across programs

- Low risk, easy scaling and rising quality are claims in the source. No project data or comparison is supplied to establish them as general outcomes.

### The chaos model: connect small tasks with project-level work

- The source’s “only valid way” wording is a strong opinion, not an established universal rule.
- The Go-strategy and chaos-theory connections are described without original references or a formal mathematical model.

### Responding to change: emotion, engagement and support

- Lewin’s phases and the cultural-web labels are supplied as short lists, not a complete change program.

### Customer feedback: NPS and learning loops

- The new source supplies three customer labels without survey scoring thresholds. No missing calculation method is invented.

### Transformation: readiness, ownership and daily improvement

- The source’s readiness expression is a management heuristic, not a calibrated predictor of project success.

## Maintenance

Classify new material in a reviewed plan before publishing it. This batch uses `scripts/content-business/project-plan.json`; the parent and child collections are configured in `collections.json`. New conceptual visuals live with their editorial page plan and do not masquerade as source images.

Run `python3 scripts/content-business/build.py` to regenerate all retained batches. Source archives are pinned by reviewed fingerprints in `batches.json`. Do not overwrite earlier uploads. The script validates all paragraph/image coverage, duplicate reuse, slugs, categories and links before writing generated outputs.

Verification evidence: `docs/verification/project-management-library.json`. No push or live deployment is included.
