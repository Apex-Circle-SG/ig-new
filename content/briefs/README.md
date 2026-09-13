# Editorial briefs: unpublished working material

These three briefs define useful questions for AI economics, founder finance and
quantitative risk. They are not articles, findings or approved public retrieval
documents. They must not enter a sitemap, feed, public content listing or Ask
corpus. Every seed has `status: draft`, null author/reviewer/review date, candidate
sources and pending contextual link suggestions.

`schema.ts` validates intent, hub, authorship, sources, method, review date,
disclaimer, related tool, status and link approvals. A candidate source is a
research lead, not proof that a future article’s claims have been verified.

For an approved brief, record real and distinct author/reviewer identities with
public profile paths, a completed review date and validated sources. These flags
must be supported by actual editorial records. Passing the schema does not create
that evidence or publish anything: `briefPublicationDecision` always returns
`publishable: false` because the resulting article needs its own publication gate.

`approvedContextualSuggestions` returns only suggestions with a recorded approver
and date. It performs no insertion. A human must approve the link’s context before
it is added to editorial prose; a brief’s general approval does not approve all
its links. Navigation and explicit source citations are separate product features.
