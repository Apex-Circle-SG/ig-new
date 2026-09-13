# Advertising, revenue and SEO review

Reviewed 13 September 2026. This is an assessment and proposed rollout, not a
change to live advertising or search-indexing settings.

## Recommendation

Expand advertising on useful public pages. Start with controlled placements,
regional privacy handling and measurement. Keep private account areas free of
advertising and protect calculator inputs before adding advertising to their
documents. Resolve the production indexing settings before investing in more
search landing pages or external promotion.

The current four-route advertising allowlist and worldwide affirmative opt-in
were conservative implementation choices. They are not universal Google rules.
The original product brief prioritizes financial-input privacy and uninterrupted
calculations, while explicitly allowing ads below results. The implementation
protected that boundary by initially omitting ads from calculator documents.
It leaves potential inventory unused and should not be treated as the final
monetization strategy.

## What “mandatory” could mean

| Meaning | Assessment |
| --- | --- |
| Public pages normally display ads, with no paid ad-free tier | Feasible, subject to the applicable privacy choices, page eligibility and actual ad availability. |
| Every route, including account/profile, legal, empty and error pages, loads ads | Poor default: these routes do not all provide useful or suitable inventory; private financial areas conflict with the product brief. |
| A visitor must accept tracking or lose calculator access | Do not equate access to a useful tool with valid consent. Establish a supported regional privacy implementation; this is not a way to assume consent. |
| A visitor must view or click an ad before receiving a result | A forced-click design conflicts with AdSense click policies. A separate rewarded-ad product would require its own supported implementation and is not provided by this script. |
| Every page view produces revenue | Not enforceable: ad blockers, consent choices, network failures, account eligibility, advertiser demand and fill still apply. |

Google's current guidance requires a certified TCF CMP for **personalized** ads
in the EEA, UK and Switzerland. It also says non-certified traffic may qualify
for non-personalized or limited ads where supported. Non-personalized ads still
use identifiers for some purposes and are not automatically consent-free.
The local allow/deny cookie is not a certified CMP. A single worldwide
“advertising off unless accepted” switch is a simple starting policy, not the
only possible policy. Use supported regional controls, applicable opt-outs/GPC
and restricted data processing instead of assuming one rule everywhere.
[Google CMP requirements](https://support.google.com/adsense/answer/13554116?hl=en),
[non-personalized ads](https://support.google.com/adsense/answer/9007336?hl=en),
[US privacy controls](https://support.google.com/adsense/answer/9560818?hl=en),
[GPC handling](https://support.google.com/adsense/answer/14182916?hl=en-12).

Requiring or encouraging ad clicks is prohibited; placement must not confuse ads
with controls. [AdSense policies](https://support.google.com/adsense/answer/48182?hl=en).

## Earnings: explicit illustrative assumptions

No live traffic, consent-conversion or AdSense earnings report is available in
this project. Analytics events exist, but no analytics provider is connected.
The environment contains GitHub credentials only. The following numbers are
**arithmetic examples, not site measurements, industry benchmarks or forecasts**.

Define:

`Revenue = total page views × eligible-page share × requestable share × effective RPM / 1,000`

“Requestable share” incorporates visitors' privacy permissions and whether the
ad code can run. Effective RPM here means earnings per 1,000 requestable page
views, already incorporating placements, fill and auction yield. Do not multiply
by the number of ad slots again. If using an RPM measured across *all* site page
views, use that directly instead of applying eligibility/consent a second time.
Google defines page RPM as earnings divided by page views, multiplied by 1,000.
[Page RPM definition](https://support.google.com/adsense/answer/112030?hl=en).

Assume **100,000 monthly total page views**, **60% requestable traffic**, and an
effective **$10 RPM**. The traffic shares below are deliberately hypothetical;
four routes do not imply any particular share of real visits.

| Scenario | Eligible-page share | Requestable page views | Monthly revenue | Change vs restricted example |
| --- | ---: | ---: | ---: | ---: |
| Restricted public-page coverage | 20% | 12,000 | $120 | — |
| Broader public-page coverage | 80% | 48,000 | $480 | +$360 / +300% |
| Every page, unchanged privacy choices | 100% | 60,000 | $600 | +$480 / +400% |
| Every page and 100% requestable traffic | 100% | 100,000 | $1,000 | Unrealistic ceiling, not a deployable promise |

The last row assumes away opt-outs, ad blockers and other losses; “mandatory”
does not make it attainable. At $5 RPM, halve every amount; at $20, double it.
Those rates are sensitivity inputs, not a claim about finance-site RPMs.

At unchanged yield, moving from 80% to 100% page coverage adds only 25% revenue
in this example. A 20% drop in total page views cancels that entire gain:
`0.8 × 1.25 = 1`. Removing a hypothetical 40% requestability loss would provide
a mathematical 66.7% lift, before accounting for any lost visits or different
auction yield. Neither effect has been measured on InsightGinie.

An ad wall can raise revenue per remaining visit while reducing total earnings,
calculator completion and future return visits. More ads do not increase RPM
linearly. Measure the result rather than using slot count as the success metric.

## Engineering and user concerns

- **Financial inputs:** a third-party script runs in the surrounding page's
  JavaScript environment. Moving its visible slot below a result does not
  create a security boundary. This describes capability, not evidence that
  Google collected a user's income. Before ads share a calculator route,
  protect the personal tool with a reviewed isolation design, such as a
  separate-origin embedded calculator with no financial data sent to the
  parent, URL, telemetry or advertising code. Test keyboard use, sizing and
  network behavior. Do not improvise unsupported wrappers around AdSense.
  [Browser security background](https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/Supply_chain_attacks).
- **Placement:** start with one reserved in-page slot below substantive public
  content. Calculator placements follow privacy work. Expand to a second slot
  only on longer pages with evidence. Avoid overlays between input and result.
  A manual AdSense unit ID is required to control a specific slot; the supplied
  publisher loader alone does not identify one.
- **Speed and layout:** earlier local mobile Lighthouse measurements were
  homepage LCP 2.61 seconds and calculator LCP 1.87 seconds, both CLS 0. These
  are historical single lab runs without filled ads, not production p75
  measurements. Ads add requests and execution and can shift layout.
  [Recorded measurements](verification/ads-lighthouse-summary.json).
- **Search and retention:** ads themselves are not a universal ranking penalty.
  Google recommends avoiding excessive ads that interfere with main content
  and intrusive interstitials. Actual ranking, abandonment and return-rate
  effects are unknown here. [Page-experience guidance](https://developers.google.com/search/docs/appearance/page-experience).

## Live onsite SEO findings

The [HTTP audit](verification/seo-2026-09-13.json) checked 19 URLs, including
13 public HTML pages, robots.txt, sitemap, ads.txt, a nonexistent route and
HTTP/www redirects. It did not run ad scripts or measure Google indexation.

| Priority | Finding | Recommended action |
| --- | --- | --- |
| P0 | Every checked HTML response carries `X-Robots-Tag: noindex, nofollow`; public pages also contain noindex metadata. Production retains `SITE_INDEXABLE=false`. | Complete a launch review, then enable indexing for the useful public pages in the build and runtime configuration. Keep preview/private/unfinished pages excluded. Verify the actual Cloudflare responses afterward. |
| P0 | The live sitemap contains zero URLs. | Publish canonical, successful, indexable URLs in the sitemap when indexing is enabled; submit that version to verified webmaster accounts. |
| P0 | Cloudflare prepends a wildcard `Allow: /`, while the application emits wildcard `Disallow: /`. | Reconcile the edge and origin policies. Google's merged equal-specificity allow rule wins; do not describe this as proof that all Google crawling is blocked. The noindex headers remain the decisive observed indexing restriction. |
| P1 | Contact is a preview placeholder; author/reviewer infrastructure has no published people. | Add a working support/corrections channel and accurate operator information. Publish editorial research only with a real author and required review. |
| P1 | Analytics has no provider; no Search Console credentials or metrics are configured. | Measure completion, related-tool use, return visits, consent and advertising yield without collecting entered income. Connect real Search Console data. |
| P1 | One functioning calculator exists; no city/occupation pilot is published. | Build household income next, then source-backed cost-of-living/equivalent-salary products. Add entity hubs only when validated data support them. |
| P1 | Legacy URL inventory exists, but an approved redirect/retirement registry and backlink priorities still need review. | Import Search Console/backlink exports; prioritize actual referenced URLs. Use a 301 only for an equivalent replacement and a reviewed 410 for retirement. Never redirect unrelated legacy content to the homepage. |
| P2 | Current titles, descriptions and canonical URLs are present on the checked public pages. The tool has BreadcrumbList/WebApplication JSON-LD; the data page has Dataset JSON-LD. | Preserve these basics. Improve descriptive visible headings where useful; validate schema against actual visible facts. Add real update dates and related links as datasets/tools expand. More schema types alone are not an SEO strategy. |
| P2 | HTTP and www each redirect to canonical HTTPS with 301; the random missing URL returns 404. | Keep these behaviors and include them in release checks. |

Google explains that noindex prevents a fetched page from being indexed.
A sitemap is a discovery aid, not an indexing guarantee.
[Noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing),
[robots rule merging and precedence](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

The current calculator compares against the published population of people aged
15 and over, including people without income; it is not a full-time-worker,
age-specific or city-specific percentile. Preserve that distinction in search
titles, explanatory content and promotions. Do not relabel dataset years as
the current calendar year or create unsupported location variants.

## Offsite work and discovered opportunities

Public search surfaced existing references on:

- [Blogger](https://aloycwl.blogspot.com/), including an old migration message.
- [DEV](https://dev.to/aloycwl), whose profile links to InsightGinie and lists
  legacy technology articles.
- [Medium](https://aloycwl.medium.com/connecting-openclaw-to-qq-a-guide-to-the-onebot-adapter-skill-insight-ginie-a572de4f79b2),
  an example of legacy syndicated content with origin attribution.
- [LinkedIn](https://www.linkedin.com/posts/aloycwl_how-to-get-into-quantitative-trading-the-activity-7464767609763364865-Aqt_),
  an example of a legacy article promotion.

These are discovered references, not a complete backlink inventory, verified
followed links or evidence of ranking value. Search snippets may be stale.
Account ownership/control and live destinations must be confirmed before edits.

Recommended external work:

1. Set up/verify Search Console and Bing Webmaster Tools. Submit the repaired
   sitemap, inspect the principal tool/data pages and monitor indexing,
   queries, landing pages and migration errors. Search Console API submission
   requires authorized access. [Submission API](https://developers.google.com/webmaster-tools/v1/sitemaps/submit).
2. Add IndexNow for changed public URLs after the indexing rollout. It requires
   a hosted ownership key and can notify participating engines; it does not
   guarantee indexing or submit to Google Search. [IndexNow documentation](https://www.indexnow.org/documentation).
3. Update profiles and descriptions on channels actually controlled by the
   owner. Reclaim broken links with a relevant tool destination only when the
   context matches. Do not manufacture equivalence between old AI articles
   and a new income calculator.
4. Produce one small, reproducible national-income study from the current
   Census snapshot, with a downloadable derived table, methodology, date,
   embeddable chart and named reviewer. City studies need the corresponding
   data first. Offer the useful resource to relevant career educators,
   financial-education editors and data journalists.
5. Prepare individual outreach based on a page's actual subject. Earn editorial
   citations; do not buy ranking links, automate forum comments or create
   bulk directories and syndicated filler. [Google link-spam policy](https://developers.google.com/search/docs/essentials/spam-policies#link-spam).

No external account settings, messages or posts were changed during this audit.
The codebase has GitHub access; Search Console, Bing and the discovered social
accounts are not authenticated here. Read-only discovery and draft preparation
are available now; account changes and submissions require those accounts to
be connected. Outreach sending also requires explicit authorization.

### Drafts ready for owner review

**Profile description:**

> InsightGinie helps you understand your financial position through public US
> data and transparent calculators. Start with the individual income percentile
> calculator and explore its Census sources and methodology.

**Research brief:**

> How $50,000, $75,000 and $100,000 compare with US individual incomes in 2024.
> Use the validated CPS snapshot and deterministic engine, show the comparison
> population prominently, explain interpolation/open-ended bands, and provide
> the source table. Keep in draft until named authorship/review is established.

**Relevant-link outreach template, not sent:**

> Hello [editor], your [specific resource] discusses [matching income topic].
> InsightGinie offers a free US individual-income comparison using Census data,
> with the population, reference year and calculation limitations shown beside
> the result. If it helps your readers, the tool is at
> https://insightginie.com/calc/individual-income-percentile/.
> [Add a specific reason it complements this editor's resource.]

## Suggested rollout and measurement

1. **Indexable, trustworthy launch:** repair production indexing configuration,
   complete contact/operator information, reconcile Cloudflare robots and
   validate the canonical sitemap. Keep unrelated legacy migration decisions
   separate from new public-page eligibility.
2. **Measure before expanding ads:** configure regional privacy messages and
   privacy-preserving analytics; obtain AdSense page-level reports. Use actual
   route traffic shares, requestability, device mix and RPM in the model above.
3. **Expand public ad inventory:** add a controlled placement, then compare
   revenue per total session, calculator completion, return use, LCP/INP/CLS
   and policy errors. Run a comparison long enough for a meaningful sample;
   do not treat a few low-traffic days as conclusive.
4. **Build discovery worth promoting:** ship the next useful tool and one
   reviewed data study, then perform targeted external distribution and link
   reclamation. Scale entity pages after validated data and pilot engagement.

Revenue reports, indexing reports and follow-up tests should determine the next
change. Page count, ad count and unsolicited backlink count are not success
metrics.
