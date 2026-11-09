# Remaining knowledge collection: review and proposed integration

Reviewed 9 November 2026. **This was the pre-implementation proposal.**

Approved and implemented subsequently: see [delivery and verification](remaining-knowledge-implementation.md).

Archive SHA-256: `72a774db6946fd9975672b97d9b3b812779c528b83e552a3c66520610c921ca9`.
All seven files were inspected, including the 13 worksheet scans and the executive
checklist image. Temporary extraction and comparison evidence is under
`/mnt/sdb/ig-new-review/remaining-knowledge/`; the uploaded archive is unchanged.

## What is actually supplied

| Source | Content inspected | Processing needed |
| --- | --- | --- |
| CEO Checklist.jpg | One legible image covering 15 executive responsibility areas | OCR/transcription, remove internal repetition, rebuild as themed accessible text |
| Coaching.docx | 564 nonempty paragraphs; entrepreneurship, reflection, attention, influence, money, physics, neuroscience claims and spirituality | Split by meaning; clarify claims and source attributions |
| CX Worksheet.docx | One text title and **13 full-page worksheet images**, not a text-based manual | OCR/transcribe every worksheet; preserve questions, instructions, examples, sequence, credits and uncertainties |
| Marketing.docx | 327 nonempty paragraphs | Merge familiar material into existing guides; preserve distinct campaign, sharing and platform-launch material |
| Self-Questionaires.docx | 84 paragraphs: headings plus **79 prompts**—30 management, 33 fundraising, 12 employee, 4 self-awareness | Reorganize into relevant question banks; investigate assessment attribution; no invented scores |
| Teams & Human Resource.docx | 424 nonempty paragraphs | Split governance, leadership, talent, culture, meetings and decision-making |
| 广明灯.docx | 39 Chinese paragraphs; entrepreneurial self-cultivation/programme overview | Translate and interpret in context; **OCR is unnecessary** |

Total extractable document content: **1,439 nonempty paragraphs**, plus **14
images** including the separate JPEG. No additional nonempty auxiliary
header/footer/footnote/comment text, external relationship targets or embedded
charts/objects were found in these DOCX packages.

No incoming DOCX file matched a document hash in the 14 existing source
inventories. The embedded worksheet image hashes also did not match the existing
inventoried source images. That does **not** mean their ideas are all new.
A normalized comparison of substantial passages (40+ alphanumeric characters)
against the published knowledge catalogue found no verbatim substantial matches;
most overlap is condensed concepts, short lists, different wording or common
frameworks. Those require editorial comparison, not automatic deletion.

## Proposed destinations

Use existing categories first. Add at most two focused child collections where
the incoming material supplies a distinct reader workflow. Do not create one
mixed “remaining knowledge” collection or put every document under management.

| Reader need | Primary destination | Proposed treatment |
| --- | --- | --- |
| Review executive responsibilities | Leadership & Organizational Culture, connected to Business Ethics & Governance | New **“The CEO operating review: 15 areas of responsibility”** checklist, linking to existing strategy, finance, risk, people, customer, M&A and succession readings |
| Design and improve a customer experience | New **Customer Experience & Service Design** child collection under Product Development & Innovation | A guided workbook journey; cross-link Brand Strategy & Experience, Marketing and Sales & Customer Relationships |
| Reflect, coach, learn and focus | New **Coaching & Reflective Practice** child collection under Communication & Personal Development | Short practical guides and question banks; connect to existing productivity, listening, feedback and leadership pages |
| Lead teams and develop people | Existing Leadership & Organizational Culture and People & Employee Experience | Extend relevant guides; add focused competency, team-role, cross-cultural and leadership-model comparisons where absent |
| Govern and coordinate the business | Existing Business Ethics & Governance, Strategy & Growth and Operations & Performance | Board/CEO boundaries, decision rights, delegation and meeting design; cross-link project communication where relevant |
| Plan marketing and customer growth | Existing Marketing Strategy & Execution and Brand Strategy & Experience | Merge foundations; add missing sharing, campaign-planning and customer-feedback details |
| Launch a platform with two sides | Strategy & Growth, linked to Product Development & Innovation | Separate platform-launch playbook; do not confuse its “piggyback” strategy with international-market piggybacking |
| Prepare a venture or funding discussion | Existing venture/pitch and private-capital material | Add the distinct fundraising prompts, linking to existing economics, financing and term-sheet guides |
| Understand scientific terms | Existing Science & Quantum | A corrected, sourced introductory glossary; keep it separate from motivational uses of “quantum” or “energy” |
| Study spiritual or philosophical interpretations | Existing Beliefs, Symbols & Mysteries | Translate the Chinese overview and contextualize the spiritual passages; cross-link personal reflection without presenting belief language as established physics |
| Explore incentives, framing and trade-offs | Existing Problem Solving & Decision Making, linked to Economics & Society | Use the prisoner’s-dilemma payoff example and framing prompts as compact comparisons |
| Study power and questionable leadership advice | Existing organizational power and Business Ethics & Governance | Treat the 48-law list and coercive workplace claims as critical reading with ethical counterpoints, rather than endorsed HR instructions |

## File-by-file editorial decisions

### Executive checklist

Preserve all 15 headings: vision/strategy; leadership/culture; financial
management; governance; risk; operations; talent; customer focus; investor
relations; brand reputation; innovation/technology; sustainability/CSR;
stakeholders; M&A; continuity/succession.

This is useful as a **review index**, even when it links to knowledge already on
the site. Repeating a long guide under each checkbox would add clutter. Group
related checks, retain unique responsibilities and collapse literal repeats.
The risk-identification sentence appears in both Risk Management and Operational
Efficiency; the leadership/culture column repeats innovation encouragement.
Retain their meaning once and cross-link the relevant sections. Do not turn the
repeated CFO wording into a universal statement about who must own every role;
frame the checklist as a supplied review aid adaptable to organizational size.

The source is not visibly attributed. Keep the original image and its hash for
traceability, label provenance honestly, and rebuild the reading experience in
the site’s typography rather than uploading the tall yellow poster as the page.

### Customer-experience worksheets

All 13 scanned pages are legible at the supplied resolution. Their footers
identify **Methodical, 2018**, and *The Ten Principles Behind Great Customer
Experiences*. Preserve that attribution. The DOCX's single text paragraph is not
a valid measure of its content; the substantive material is in the images.

| Image | Worksheet | Reader purpose |
| --- | --- | --- |
| 1 | Why will people use this thing? | Clarify the proposition, customer rationale and business objectives |
| 2 | What makes your brand appealing? | Explore customer identity, values, community and status |
| 3 | What do your customers want to achieve? | Record objectives, unspoken motivations, deeper goals and business outcomes |
| 4 | When does the experience start and end? | Map the end-to-end journey and relevant experience principles |
| 5 | What does this stage involve? | Break a stage into tasks, preconditions, touchpoints and success criteria |
| 6 | Are you meeting expectations? | Compare existing expectations, learned behaviour and intended expectations |
| 7 | Can you make it effortless? | Examine task time, waiting, unnecessary features and language |
| 8 | Can you make it stress-free? | Examine capability, choice, distinctions and goal clarity |
| 9 | How many errors can you prevent? | Record possible errors, prevention and detection/recovery |
| 10 | How can you delight their senses? | Consider sensory channels and accessibility, not just decoration |
| 11 | Is it a social pleasure? | Explore interaction, human connection, community and individuality |
| 12 | Have you considered the emotions? | Map emotions to triggers and response strategies |
| 13 | Scratchpad—All your great ideas in one place | Consolidate requirements, ideas and actions by journey stage |

The chapter marker on image 12 is **CH13**, not CH12. “Customer in control” appears
in the worksheet legend, but **no separate customer-control worksheet is supplied**.
Do not invent it or describe these scans as a complete copy of the book. Repeated
author/date/project fields and footers can share one presentation, while each
worksheet’s distinct questions, examples and next-step instructions remain.

Best presentation: a workflow overview, readable worksheet sections and compact
journey/task/error/emotion tables. If editable worksheets are implemented, keep
inputs local and exportable using existing private-workspace patterns. These are
worksheets, not numeric calculators or validated scoring instruments. Keep the
source scans accessible as supporting references, sized appropriately, rather
than using full-height scans as the main article.

### Coaching notes

This document is not one coherent coaching course. Proposed split:

- Entrepreneurship, purpose, strategic questions and risk metaphors → strategy,
  venture and reflective practice, with anecdotes identified as anecdotes.
- Learning sequence, attention, distractions, action habits, progress tracking,
  reflection and listening → practical coaching/personal-development guides.
- The 48-laws list and “Peter’s law” maxims → attributed critical readings on
  influence and power, with discussion of conflicts and limits. “Peter’s law” is
  not automatically the Peter Principle; verify the intended source.
- The four “genius” labels, purpose/Ikigai material and personal needs → reflection
  frameworks, distinct from validated personality or clinical assessments.
- Investment and wealth parables → existing investing-behaviour or business-value
  readings only where a distinct example adds value. They do not establish returns.
- The prisoner’s-dilemma and framing scenarios → decision-making, with clear
  payoff/probability tables.
- Quantum terms, eigenstates/eigenvalues, spin, particles, tunnelling and unification
  → Science & Quantum. Some entries are fragments or inadequate explanations and
  require source-backed rewriting; no physics claims should justify coaching advice.
- “Ten Worlds,” faith, autosuggestion, spiritual vibration and contemplative passages
  → spiritual/philosophical reflection, connected to Beliefs & Mysteries.
- Brain-region, timing, hormone, grief, pain/medicine and mental-health statements →
  a fact-check queue. Do not publish these as established mechanisms or treatment.

Several quotations have names but no primary references. Preserve traceability,
verify attribution and avoid promoting an uncertain quote to a factual heading.
The two grief lists are inconsistent: the early list substitutes “blame,” while
another supplies bargaining and adds resurgence. The unexplained phrases “Kill
nuclear reactor,” “Role charity” and “Trump your trust” need clarification, not
invented interpretations.

### Marketing notes

Merge overlapping concepts into existing canonical guides: positioning/value
propositions, marketing mix, planning, communications, branding, segmentation,
channels, retention, Ansoff, five forces, VRIO, value chain and 7S.

Move strategy frameworks out of the marketing bucket when appropriate. The
Mintzberg five-P list deserves comparison with existing strategy coverage; do not
assume it is already covered merely because another Mintzberg framework exists.

Distinct additions worth preserving include STEPPS; the eight platform-startup
approaches; customer-decision/loyalty-loop notes; campaign/project coordination;
feedback/touchpoint review; and practical brand/channel prompts. Integrate them
into existing relevant guides or a focused new guide according to reader intent.

Do not turn the supplied formulas straight into calculators. “Lifetime value =
profit/customers” lacks a lifetime/cohort definition; CPC is used both for customer
cost and click cost; “cash-on-cash return” is assigned an LV/CPC ratio; and the
campaign-volume expression has unclear units. Reconcile them with the existing
[customer economics guide](/root/ig-new/apps/web/src/lib/library/knowledge.json)
and formula references, preserving the original wording with a correction record.

The “seven exposures” rule, daily ad counts and platform examples lack a dated
source. The donut list contains historical products such as Google+, Vine and
MySpace. Preserve useful communication lessons with historical labels; verify
current channel references before recommending them. The final collaborative-
filtering phrase is only a topic label, not enough source material for a full ML
tutorial; route it to Technology/AI as a research prompt.

### Team and HR notes

- Board responsibilities, organizational structures and CEO “hats” → governance
  and leadership responsibilities; connect to the executive checklist.
- Competency categories and leadership development → a practical competency
  reference, using observable behaviour rather than an invented total score.
- Talent, motivation, coaching cycles, autonomy, accountability, recognition and
  psychological contracts → existing people/employee-experience guides.
- Delegation, meeting costs, OPPT, facilitation and synchronous/asynchronous choices
  → a focused meeting/delegation playbook linked to project communication.
- Decision process, DEEP and trust-building prompts → decision-making and
  leadership practice, retaining incomplete source labels as such.
- Hofstede and GLOBE → a cross-cultural comparison; keep the frameworks separate
  and avoid using national averages to label individual employees.
- Belbin roles, Lencioni dysfunctions, the ability/motivation/opportunity model,
  transformational leadership, servant-leadership characteristics and the complex-
  systems leadership notes → distinct annotated framework comparisons where not
  already represented. They should not be conflated into one assessment.
- Tuckman, the managerial grid and Kotter → existing guides, retaining only new
  explanations or application prompts rather than creating duplicate articles.
- Unemployment labels → Economics & Society if substantive enough; avoid creating
  a page out of a few undefined labels.

Engagement percentages, meeting statistics, the “double cost” trust assertion and
ocular deception-testing note have no supporting study in the upload. The
categorical “never hire an academic” claim and coercive workplace maxims should
be studied critically, not restated as general hiring or management policy.

### Self-assessment prompts

Keep the 79 actual prompts, grouping them by reader use instead of publishing a
single generic questionnaire:

1. Management/strategy review: 30 prompts, linked to executive review and business
   planning. Update relative-year wording without inventing a forecast.
2. Venture/fundraising readiness: 33 prompts, linked to venture validation, pitch,
   unit economics, funding stages and founder terms.
3. Employee experience: 12 prompts, linked to engagement and development. The wording
   resembles a named established engagement questionnaire; verify the instrument
   and attribution before presenting or adapting it. Do not invent norms or imply
   official validation of the site's version.
4. Personal reflection: four prompts—personality, proficiency, purpose and practice—
   linked to coaching/reflection.

Some reflection questions also appear by meaning in Coaching. Share one canonical
question where it serves the same purpose, retaining both source pointers. A
question about business strategy and one about personal meaning should not be
merged merely because their wording is similar.

### Chinese overview

Preserve the spelling **广明灯** rather than silently changing the source name.
Provide a readable English version with the Chinese original available alongside
it, separating translation from editorial explanation.

The subject is entrepreneurial purpose, personal cultivation, values and a
promoted learning system. It is **not a technical document about lamps**, a
quantum-physics explanation or a conspiracy dossier. Its relevant home is
entrepreneurial/spiritual philosophy, with links to purpose and leadership.

Translate terms such as 道, 心法 and 能量场 in context, retaining their philosophical
or promotional character. For example, “一份生命的使用说明书” is a figurative
“instruction manual for life”; “能量场” should not become a claim about a measured
physical field in an English science article.

The text advertises five spiritual-growth paths, six cultivation directions and
seven energy levels, but **does not enumerate the actual five/six/seven systems**.
It does explicitly list eight audiences and nine business situations. Preserve
those supplied lists and identify the missing schemas; do not manufacture a
complete programme, diagnostic ladder or scoring tool from the headings.

## Deduplication and delivery rules

1. Retain the exact original archive and source hashes.
2. Compare meanings and reader purpose, not filenames or isolated short keywords.
3. Omit repeated public explanations and repeated question instances where truly
   equivalent; map each omitted passage to the retained canonical guide/section.
4. Merge distinct examples, caveats, prompts and applications into the relevant
   existing material. A known framework can still contribute a new useful example.
5. Preserve all unique content and all source traceability. Do not delete the
   originals to satisfy “omit repeated.”
6. OCR/transcribe all 14 images, then check the text against the originals before
   publication. Reuse common worksheet boilerplate while retaining unique prompts.
7. Translate the Chinese source with its original wording accessible. Mark
   uncertainty and incompleteness rather than guessing.
8. Add readable diagrams, comparison tables and worksheets where helpful; keep
   scans secondary and preserve attribution.
9. Update the published catalogue, category navigation, related links and complete
   sitemap/content index in the same implementation change.

**Recommended order:** reconcile duplicates and existing destinations; transcribe
images and translate the Chinese source; build the CX workflow and executive/
reflection question banks; integrate the remaining unique topic material; resolve
source claims and coverage; review presentation and discovery. Publication should
follow approval of this classification proposal.

No application code, published content, source archive, commit or deployment was
changed for this review. Full structured OCR and external claim/quotation/
assessment verification remain implementation work; visual inspection and topic
review are complete.
