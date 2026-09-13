# Trust and editorial infrastructure

Implemented 13 September 2026. These pages state product policies; they do not
constitute legal review or invent completed specialist review.

## Public routes

- `/corrections-policy/`: reporting details, versioned correction expectations,
  source revisions and the absence of a complete historical correction register.
- `/advertising-disclosure/`: configured display ads, independence of formulas,
  visitor choices, and future affiliate/sponsorship disclosure requirements.
- `/ai-disclosure/`: supported public material, deterministic calculations,
  limitations, draft standards and the distinction between server-processed Ask
  questions and private browser calculator inputs.
- `/finance-disclaimer/`: educational scope, projections and exclusions; no
  guaranteed financial result, personal investment recommendation or loan offer.
- `/research-methodology/`: facts versus assumptions, source/version retention,
  formula testing, editorial review and approval of contextual link suggestions.
- `/authors/insightginie/`: an organizational product-maintenance profile, using
  `Organization` JSON-LD rather than an invented `Person`.
- `/authors/`: the maintainer directory and honest current review status.

Root integration owns registry/indexation, navigation, current terms/privacy
alignment, and browser/release verification. No contact identity, credential,
legal entity registration, expert review or official endorsement was invented.

## FinanceTrust component

Import `FinanceTrust` from `apps/web/src/components/finance-trust`. Supply:

```tsx
<FinanceTrust
  methodologyPath="/research-methodology/"
  sources={[]}
  formulaVersion="an-actual-formula-version"
/>
```

The default maintainer is InsightGinie. Optional `publishedAt` and `updatedAt`
are ISO dates and must be real publication/change dates. Never derive them from
the current request time or substitute a data retrieval date. Unknown dates are
omitted. A source accepts `name`, public HTTPS `url`, optional `year` and `version`.

`reviewer` is absent by default. Its fields are `name`, `profilePath`, `reviewedAt`,
`scope` and `confirmed: true`; configure it only after a real identity/profile,
review and its scope have been verified. A technical check is not financial or
legal advice. The component does not invent qualifications or call an automated
test a professional review. Runtime validation rejects unsafe URLs, invalid
dates, reversed publication/update ordering and unconfirmed reviewers.

## Unpublished editorial work

`content/briefs/` contains three draft plans, not live research: AI workflow
economics, founder runway sensitivity, and drawdown/concentration limitations.
All authors, reviewers and review dates remain null; all sources are candidates
and all contextual links need approval. `schema.ts` validates the required
metadata and prevents a status change alone from fabricating completed review.

`briefPublicationDecision()` always reports `publishable: false`. Even an approved
brief is only a planning artifact; the finished article still needs source/fact
checks, real authorship/review and its own explicit publication decision.
`approvedContextualSuggestions()` selects only individually approved links and
does not modify content. Draft briefs must remain out of public feeds, sitemap,
content lists and the approved Ask corpus.

## Validation and remaining human work

`tests/unit/finance-trust.test.ts` covers attribution defaults, URL/date safety,
review configuration, source/author approval gates, and the distinction between
brief approval, link approval and publication.

Human legal review remains required for the financial disclaimer, commercial
disclosures, privacy/terms, operating identity and trademark clearance before
claiming those documents have been professionally approved. The code does not
provide legal clearance. Public copy must continue matching the actual enabled
Ask, advertising, storage and external-integration behavior after each release.

The commercial disclosure points to the [FTC’s endorsement guidance](https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking)
for context on material connections, without asserting a legal safe harbor.
Candidate research sources remain explicitly unvalidated in the briefs until
their exact use, versions and limitations receive editorial review.
