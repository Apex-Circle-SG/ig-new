# Casino calculators and sitemap maintenance

Implemented locally on 5 November 2026; push requires the user's instruction.

## Reader experience

The calculator hub now links to **Casino probability calculators**, grouping four tools:

- **Roulette odds & simulator** retains its existing URL. The betting grid shows exactly which pockets win; clicking a pocket selects a single-number bet. European and American wheels, fixed stakes and loss doubling, bankroll/table limits, stop thresholds and repeated runs remain available. New horizontal split, street, corner and six-line bets have selectable valid anchors. Zero pockets occupy separate rows so regular numbers match bet geometry.
- **Expected value & house edge** shows per-round/session expected net, break-even win probability, turnover and explicit net-payout conventions.
- **Losing-streak probability** uses an absorbing-state recurrence, accounting for overlapping streak windows. It distinguishes a streak anywhere in a session from losses in the next specified rounds.
- **Two-dice probability** shows a distribution, ordered winning combinations and fair net payouts for 2–20 sides.

Roulette reports sampled balance paths, pocket frequencies, drawdown, simulated profit frequency and 10th–90th percentile final balances. One or a few runs do not provide a stable percentile estimate. The visual table describes bet coverage rather than physical wheel order. The split selector covers horizontal numbered pairs only; zero splits, baskets, French surrender rules and bonus games are excluded and disclosed.

Calculation engines are separate from presentation and add no production dependencies. Assumptions and limits appear beside results. Standard roulette payouts were checked against [New Jersey roulette regulations, section 13:69F-5.2](https://www.nj.gov/oag/ge/docs/Regulations/CHAPTER69.pdf). This simulator is not an implementation of every table variation.

## Sitemap and privacy

`getSiteEntries()` now combines static approved routes, published editorial records, approved earning guides and **every article in the library catalogue**, rather than AI articles alone. This shared source drives the XML sitemap, sitemap partitions and human-readable content index. New library entries therefore appear automatically. New static calculator routes still need registration in the reviewed public-route list, and AGENTS.md records that requirement for every future content change.

Casino routes are classified as tools in sitemap partitions. Library articles are classified as content. Existing exclusions for private routes and previews remain. Casino pages use the existing consent-aware advertising policy and calculator analytics exclusion; calculations run locally.

## Verification and limits

[Verification evidence](verification/ai-library-refinement.json) records 464 passing unit tests, type checking, production build, Graphify refresh and local browser checks. Exhaustive small binary sequences verify overlapping-streak probabilities; roulette payouts are checked across offered bets and both wheels. Browser checks at 390 px and 1440 px cover all casino pages plus the content index, corner coverage, American 00 selection, running simulations and changing dice assumptions. All returned HTTP 200 with no horizontal overflow, browser exceptions or Axe WCAG 2 A/AA violations.

Production deployment is not checked because these commits have not been pushed. The existing AI coverage ledger is an editorial map, not proof that every source sentence has passed a fidelity audit; its opening glossary misroutes and source24 arithmetic have been corrected separately.
