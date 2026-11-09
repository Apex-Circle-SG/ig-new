# Casino probability lab

Implemented 9 November 2026. Local implementation; not pushed or deployed.

The casino section now contains **nine playable games**, a shared session-comparison lab and the three existing probability calculators. Nine new routes join the enhanced existing roulette route. The directory groups tools by reader intent: Card games, Dice games, Wheel & reel games, and Probability & session tools.

## What readers can do

| Tool | Route | Play and calculation |
| --- | --- | --- |
| Baccarat | `/calculators/casino/baccarat/` | Deal Player and Banker in stages; see the drawing rule at each step; compare commission and Super 6, 8:1 and 9:1 ties; explore an interactive Banker third-card map; calculate exact next-hand odds from editable remaining point counts. |
| Blackjack | `/calculators/casino/blackjack/` | Hit, stand, double, split and late surrender; choose decks, H17/S17 and 3:2/6:5; calculate exact finite-shoe dealer outcomes and next-card bust probability, including the dealer peek; compare sampled action returns. |
| Sic Bo | `/calculators/casino/sic-bo/` | Select Small/Big/Odd/Even, totals, singles, doubles, triples and two-face combinations; roll three dice; inspect all 216 ordered outcomes and edit the payout. |
| Craps | `/calculators/casino/craps/` | Follow come-out and point states; maintain Pass/Don’t Pass and Come/Don’t Come contracts; add true odds; inspect six one-roll proposition bets. |
| Video poker | `/calculators/casino/video-poker/` | Deal, hold and draw in Jacks or Better; choose 9/6 or 8/5; edit a hypothetical hand; enumerate all 32 holds and every legal replacement combination. |
| Three-card poker | `/calculators/casino/three-card-poker/` | Play or fold, optionally add Pair Plus; see dealer qualification and separate Ante bonus; compare Play with Fold by enumerating all 18,424 possible dealer hands. |
| Casino War | `/calculators/casino/casino-war/` | Choose surrender or war after a genuine dealt tie; calculate the conditional cost; compare second-tie payouts of 2:1 and 1:1. |
| Slots teaching model | `/calculators/casino/slots/` | Change symbol weights and three-match gross payouts; spin an original three-reel model; compare theoretical RTP, paying-spin chance, standard deviation and observed return. |
| Roulette | `/calculators/roulette/` | Place up to 30 overlapping wager entries on one spin; compare European/American wheels and European la partage; inspect each chip’s net, combined profit distribution and replay history. Original single-bet simulator retained. |
| Session comparison | `/calculators/casino/session-lab/` | Choose a game, compare fixed stakes with doubling after a loss on the same seeded outcomes, inspect balance paths, turnover, drawdown, percentiles, profitability and insufficient-balance stops. |

Directory: `/calculators/casino/`. The existing expected-value, losing-streak and two-dice calculators remain linked and functional.

## Mathematical boundaries

- Baccarat odds enumerate ordered draws without replacement from ten point-value counts. These describe the **next complete hand**, not an already partially dealt hand. A separate totals/third-card map explains the fixed Banker drawing rule. Naturals stop both hands. Banker/Player pushes and Super 6 half-pay wins are included.
- Blackjack dealer outcomes are exact finite-shoe enumeration. The hidden hole card is integrated out, and a successful peek excludes dealer blackjack. Next-card bust risk uses the same peek-conditioned information. **Action expected returns are 6,000 seeded samples with a stated continuation policy**, not optimal strategy: stand on hard 17/soft 18; splitting is limited to two hands and split aces draw once. Before a dealer peek, dealer blackjack settles the original wager before a double or split can occur; late surrender is unavailable.
- Playable blackjack uses US hole-card peek, double after split and no insurance or resplitting. Split 21 pays 1:1. One/six/eight deck choices are supported. Deck choice affects play and exact hand analysis; session experiments explicitly use eight decks.
- Sic Bo defaults are an **illustrative editable paytable**, not a copy of the linked New Zealand schedule. Default specific triples pay 150:1, any triple 30:1 and doubles 8:1. Single-face returns vary with the number of matching dice; there is no single flat payout for every winning single-face outcome.
- Craps bars 12 on Don’t Pass/Don’t Come. Come odds are off during a table come-out; resolving off odds returns the odds stake with zero net. Don’t Come lay odds remain working. The lab does not model casino-specific odds caps, buy/lay/place/field/hardway bets. Contract odds are distinguished from one-roll proposition bets.
- Video poker displays **gross returned per stake**. A high pair returns 1×, hence zero net. The modeled royal ratio is 800×, corresponding to the maximum-credit ratio. Current-hand optimal holds are enumerated exactly; simulation uses an explicitly simpler demonstration hold policy, with no claim of optimal whole-game RTP.
- Three-card poker ranks a straight above a flush; A–2–3 is low. Pair Plus uses the stated 1/3/6/30/40 net table and settles independently of folding in this lab. Ante bonuses are paid on played qualifying hands regardless of dealer result.
- Casino War defaults to the linked Massachusetts rule: second tie returns the original wager and pays the extra war wager **2:1**. The 1:1 option is labelled a comparison variant. Burn cards are unobserved; the calculation marginalizes them rather than pretending their identities are known. Play and experiments use a fresh six-deck shoe per initial round.
- Slots are an original teaching model with three independent identical weighted reels, one payline and only three-match wins. They are not a reconstruction of a commercial machine.
- Session comparisons use the same outcome sequence for each staking pattern until a stop. They reserve possible additional stakes before a round, track actual turnover and preserve the stake after a push. A loss/profit stop can overshoot by one round. Session quantiles are empirical, not confidence intervals. Exact independent/full-shoe expected-return references are shown where available; none is invented for the simplified blackjack/video-poker policies.
- Random seeds are reproducible teaching controls, not gambling-grade random-number generation. All balances are virtual.

## Presentation, privacy and implementation

Native CSS cards/dice/reels, compact probability bars and SVG balance charts use the existing purple/neutral site theme. No copied casino art, raster downloads, new npm dependencies, accounts, storage or deposits. Animations respect reduced-motion preferences. Labels, focus styles, live results and horizontally contained tables support keyboard/mobile use.

Pure rules live in `apps/web/src/lib/casino/`. Page controls reuse shared presentation and a browser-worker lifecycle. Exact hold analysis and other calculations can be cancelled; editing calculation inputs clears stale results. Game modules load on demand. Existing consent-aware site advertising and calculator privacy behavior remain in place.

The calculator directory, canonical metadata, static route registry, combined sitemap and human content index are updated together. The route-resolution check now recognizes both the old calculator catalogue and new game catalogue.

## Sources reviewed

Sources establish specific rules and mathematical methods; the lab’s supported options are stated separately rather than presented as universal casino rules.

- [Singapore GRA — RWS Baccarat drawing table](https://www.gra.gov.sg/docs/default-source/game-rules/rws/baccarat-games/rws-game-rules---rws-baccarat-v3.pdf). Official PDF is sometimes browser-verification gated; indexed table and independently enumerated rule checks agree.
- [New Zealand DIA — consolidated table-game rules](https://www.dia.govt.nz/diawebsite.nsf/wpg_URL/Services-Casino-and-Non-Casino-Gaming-Rules-of-Casino-Table-Games), including Blackjack, Tai Sai and Three Card Poker. The public directory links the current consolidated editions. Tai Sai payouts vary; this lab states its illustrative defaults.
- [Nevada Gaming Control Board — three-card game rules and paytables](https://www.gaming.nv.gov/siteassets/content/divisions/enforcement/rules-of-play/3_Card_Game_Rules_-_paytables.pdf), confirming the separate Ante bonus irrespective of the dealer’s hand.
- [Massachusetts Gaming Commission — Casino War](https://massgaming.com/wp-content/uploads/Rules-Casino-War-10-08-2020.pdf), especially dealing/burn procedures, surrender and second-tie payout.
- [OLG PlaySmart — Craps bets](https://www.playsmart.ca/table-games/craps/how-to-play/how-to-play-craps-details/), distinguishing line, Come and true-odds bets.
- [Ethier, Kim and Lee — Optimal conditional expectation at Jacks or Better](https://arxiv.org/abs/1602.04171), for the conditional enumeration method and 9/6 paytable.

## Verification

- Production build with indexability and consent-aware advertising enabled.
- Standalone TypeScript check and ESLint with zero warnings.
- **519 unit checks**, including **26 casino checks**: all Banker third-card rows; finite eight-deck benchmark; an independently written exhaustive small-shoe Baccarat oracle; exact peek conditioning; next-card risk; soft aces/split blackjack; all Sic Bo combinations; independently derived Craps edges; all poker categories; all 32 hold patterns; independent four-rank Casino War enumeration; overlapping roulette payouts; seeded reproducibility, exposure limits and discovery registration.
- **14 Playwright scenarios**: 22 desktop/mobile route visits; live game actions; worker calculations; malformed input; repeatable sessions; mobile controls; canonical links; combined sitemap/content-index discovery; and automated accessibility scans of the directory and four core game pages.
- Desktop/mobile screenshots visually inspected. Heavy calculations run in a worker rather than freezing page controls.
- Graphify bounded architecture graph refreshed. Merged graph: 1,257 nodes and 2,751 edges; zero dangling merged edges. **Diagnostic warning:** full raw AST extraction reports unresolved references and collapsed parallel relationship variants (621 unresolved references / 87 collapsed endpoint pairs). This is a partial architecture map, not a claim that every semantic relationship is represented.

No push or live Cloudflare deployment check. Browser checks cover Chromium with desktop/mobile viewports, not physical devices or all browser engines. Unrelated workspace changes and the uploaded archive are preserved.
