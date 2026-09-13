# Deterministic finance tools

Six public tools live under `/tools/{slug}/`: `ai-workflow-roi`, `cash-runway`,
`break-even`, `business-loan`, `drawdown-recovery`, and `portfolio-concentration`.
The existing income tool remains at `/calc/individual-income-percentile/`.

## Engine contract

`packages/calculators/src/business.ts` exports:

- `FINANCE_TOOLS`: titles, descriptions, fields, public illustrative defaults,
  sources and methodology. No market rates or actual portfolio data are supplied.
- `FINANCE_INPUT_SCHEMAS`: strict Zod schemas for each tool. Missing, unexpected,
  non-finite and out-of-range inputs fail validation.
- `getFinanceTool(id)` and `getFinanceDefaultInputs(id)` for metadata and independent
  copies of example inputs.
- `calculateFinancialTool(id, inputs)`: deterministic result values, formatted-row
  descriptions, assumptions, source references, optional calculation tables and
  a formula version. This function performs no I/O and reads no clock.
- `formatFinanceValue(value, format)` for consistent display only. Intermediate
  calculations retain precision; missing or impossible results are explicit nulls.
- `compareBusinessLoanScenarios(keptInputs, currentInputs)` validates and calculates
  both loans with the same model, returns current-minus-kept metric deltas, cloned
  inputs and a month-aligned payment/balance table. A paid-off loan contributes zero
  payment and zero balance to later comparison months. It does not compute APR.

Amounts use one nominal currency, displayed as USD. Portfolio entries are
nonnegative position values, not symbols or allocation recommendations. Monetary
rates and growth assumptions are entered by the user. The public examples are
illustrative, not quotes or forecasts.

The loan implementation uses `log1p`/`expm1` for stable payments and remaining
balances at very small rates and the supported high-rate/long-term limits.
Scheduled payments, separately paid fees, extra principal and final settlement
remain distinct. Break-even whole units account for floating-point noise at an
integer boundary without silently adding an extra sale.

## Privacy and browser implementation

Public pages contain explanatory text, an independently calculated public example
and a private iframe. All editable fields and personalized results live inside
`/private-tools/{slug}/`. Both the iframe attribute and the response CSP omit
`allow-same-origin`, creating an opaque origin even though the URL uses the same
host. Parent scripts, including advertising, cannot read its financial DOM.

The route serves a complete HTML document containing only the required React UI,
calculator code and styles. Its policy denies outgoing connections and native
form submissions. `allow-forms` permits React's local submit handler;
`allow-downloads` permits deliberate local CSV exports, and `allow-modals` permits
printing. Public methodology links open a separate document with `noopener`.
There are no ads or external resource requests inside the tool.

The message protocol `insightginie:finance:v1` exposes only a static tool slug,
bounded layout height or an allowlisted `started`, `completed` or `exported` event.
The parent verifies the exact frame
window and the opaque `null` origin. Share buttons copy a public tool URL with no
financial values. CSV/print deliberately include the calculated scenario, remain
local, and are disabled after an input changes until it is recalculated.

The business-loan tool can keep one calculated scenario as a comparison. Kept
inputs exist only in React memory inside the opaque iframe; no browser storage,
query string, parent message or network request contains them. Change the current
inputs and calculate again to see both loans' input assumptions, scheduled payment,
interest, fee-inclusive borrowing cost, total paid and payoff months. Resetting the
example changes only the current scenario; clear, reload or navigation drops the
kept scenario. Explicit comparison downloads include both inputs, metric deltas,
both full amortization schedules and the aligned payment/balance table.

## Build and integration

Run `node scripts/build-finance-embeds.mjs` before Next.js build/development and
TypeScript checks. It generates the ignored
`apps/web/src/generated/finance-embeds.ts` from the current engine and UI. Missing
or failed generation blocks a build; previous production output remains intact.
The routes compress documents at the origin and use `private, no-store,
no-transform` to preserve nonce scripts through the edge.

Global integration must allow same-host iframe loading on public pages and exempt
`/private-tools/` from the application HTML proxy. The private route owns its CSP,
`SAMEORIGIN` framing restriction and `noindex, nofollow` headers. Add only the public
hub and six validated tool URLs to the canonical route/analytics inventory.

## Sources and limitations

- [SBA business finances](https://www.sba.gov/counseling/manage-your-business/)
  provides cash-flow and cost-benefit context. Runway and AI capacity-value models
  are the explicitly documented InsightGinie arithmetic models.
- [SBA break-even formula](https://legacy.sba.gov/business-guide/plan-your-business/calculate-your-startup-costs/break-even-point)
  supports the single-product contribution model. Profit targets and whole-unit
  rounding are explained alongside it.
- [CFPB amortization explanation](https://www.consumerfinance.gov/ask-cfpb/how-does-paying-down-a-mortgage-work-en-1943/)
  explains the fixed principal/interest structure. The tool models that mathematical
  loan structure; it does not claim mortgage rules apply to every business loan.
- [Investor.gov compound interest calculator](https://www.investor.gov/financial-tools-calculators/calculators/compound-interest-calculator)
  supplies compounding context. Recovery gains follow directly from percentage
  arithmetic; constant future growth is only a user-chosen illustration.
- [FINRA concentration risk](https://www.finra.org/investors/insights/concentration-risk)
  and [Investor.gov diversification](https://www.investor.gov/introduction-investing/getting-started/asset-allocation)
  explain why position size alone is not a complete risk assessment. The squared
  weight index and effective equal-sized positions are descriptive measures,
  without regulatory thresholds or buy/sell recommendations.
- [NIST human–AI interaction](https://airc.nist.gov/airmf-resources/airmf/appendices/app-c-ai-risk-management-and-human-ai-interaction/)
  supports accounting for human oversight. NIST does not certify this ROI model.

Source context was checked on September 13, 2026. No expert reviewer or individual
author is invented. Public pages use the shared organizational maintenance and
corrections infrastructure.

## Verification

`packages/calculators/src/business.test.ts` contains 39 known-example, invalid-input,
boundary and property tests. They cover negative/zero returns, zero burn,
nonpositive margins, total loss, concentration invariance, zero/near-zero loan
rates, extra principal, high-rate amortization, decimal unit rounding and loan
comparison fee/term tradeoffs, payoff alignment, delta symmetry and input isolation.

`tests/e2e/finance-tools.spec.ts` covers all six calculation flows, field errors,
opaque-origin privacy, local downloads, safe share links, mobile layout and axe
accessibility. A comparison flow also covers dirty-input guards, explicit two-loan
CSV, small-screen tables and clearing on reload. Run against the built candidate
with `PLAYWRIGHT_BASE_URL`.
An independent local browser verification also exercises all six opaque frames,
local CSV download and mobile WCAG checks; its transient evidence is in
`artifacts/finance-tools-verification.json`. Release-level evidence belongs in the
root deployment verification report.
