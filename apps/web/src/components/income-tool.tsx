'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Info, LockKeyhole, Plus, Sparkles } from 'lucide-react';
import type { IncomeDistribution, IndividualIncomeResult } from '@insightginie/schema';
import { IncomeChart } from '@insightginie/charts';
import { track } from '@insightginie/analytics';
import { useHydrated } from './use-hydrated';
const money = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
function position(p: number) {
  return Math.floor(p * 10) / 10;
}
export function IncomeTool({
  distribution,
  initialOutput,
  compact = false,
}: {
  distribution: IncomeDistribution | null;
  initialOutput: IndividualIncomeResult;
  compact?: boolean;
}) {
  const ready = useHydrated();
  const [income, setIncome] = useState('75000');
  const [output, setOutput] = useState(initialOutput);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [hasRun, setHasRun] = useState(false);
  const [copied, setCopied] = useState(false);
  const started = useRef(false);
  const result = output.result;
  async function run(value: string, interaction: 'form' | 'example' | 'what-if' = 'form') {
    const cleaned = value.replace(/[$,\s]/g, '');
    if (
      !/^-?\d+(\.\d{1,2})?$/.test(cleaned) ||
      !Number.isFinite(Number(cleaned)) ||
      Number(cleaned) < -1_000_000_000 ||
      Number(cleaned) > 1_000_000_000
    ) {
      setError(
        'Enter an annual income from −$1 billion to $1 billion, using no more than two decimal places.',
      );
      return;
    }
    setBusy(true);
    try {
      const { calculateIndividualIncomePercentile } = await import('@insightginie/calculators');
      const next = calculateIndividualIncomePercentile(
        { annualIncome: Number(cleaned) },
        { distribution, calculatedAt: new Date().toISOString() },
      );
      setOutput(next);
      setIncome(cleaned);
      setError('');
      setHasRun(true);
      track('calculator_completed', { calculator_id: 'individual-income-percentile', interaction });
    } catch {
      setError('We could not load the calculation. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        'https://insightginie.com/calc/individual-income-percentile/',
      );
      setCopied(true);
      track('calculator_result_shared', {
        calculator_id: 'individual-income-percentile',
        interaction: 'copy-link',
      });
    } catch {
      setError('Copy this tool link: https://insightginie.com/calc/individual-income-percentile/');
    }
  }
  const percentile = result?.percentile;
  const range = result?.percentileRange;
  const percentText =
    percentile != null
      ? `${position(percentile)}%`
      : range
        ? `${position(range.lower)}–${Math.ceil(range.upper * 10) / 10}%`
        : '—';
  return (
    <div className={compact ? 'income-tool mini-tool' : 'income-tool full-tool'}>
      <section
        className="input-panel"
        aria-labelledby={compact ? 'preview-heading' : 'input-heading'}
      >
        <div className="panel-heading">
          <span className="step-number">01</span>
          <h2 id={compact ? 'preview-heading' : 'input-heading'}>
            {compact ? 'Your income. In perspective.' : 'Let’s start with your income'}
          </h2>
          {compact && (
            <span className="live-label">
              <i /> Live calculator
            </span>
          )}
        </div>
        <noscript>
          Enable JavaScript to calculate privately in your browser. The example and methodology
          remain available below.
        </noscript>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run(income);
          }}
          noValidate
        >
          <label htmlFor={compact ? 'preview-income' : 'annual-income'}>
            Annual individual income <span>before taxes</span>
          </label>
          <div className={'money-input' + (error ? ' invalid' : '')}>
            <span aria-hidden="true">$</span>
            <input
              id={compact ? 'preview-income' : 'annual-income'}
              type="text"
              disabled={!ready || busy}
              inputMode="decimal"
              onFocus={() => {
                void import('@insightginie/calculators').catch(() => {});
              }}
              autoComplete="off"
              maxLength={20}
              value={income}
              onChange={(e) => {
                setIncome(e.target.value);
                if (!started.current) {
                  track('calculator_started', {
                    calculator_id: 'individual-income-percentile',
                    interaction: 'form',
                  });
                  started.current = true;
                }
              }}
              aria-describedby={compact ? 'preview-help' : 'income-help'}
              aria-invalid={Boolean(error)}
              aria-errormessage={error ? 'income-error' : undefined}
            />
            <span className="input-unit">/ year</span>
          </div>
          <p id={compact ? 'preview-help' : 'income-help'} className="input-help">
            {compact
              ? 'Try your income to see how you compare.'
              : `Include wages, self-employment and other cash income. Compare in ${distribution?.datasetVersion.year ?? 'the source year'} dollars; no inflation adjustment is applied.`}
          </p>
          {!compact && (
            <div className="comparison-field">
              <span>Compare with</span>
              <div>
                United States <span className="country-badge">US</span>
              </div>
              <small>All people age 15 and over, including people with no income</small>
            </div>
          )}
          <button
            className="button primary calculate-button"
            type="submit"
            disabled={!ready || busy}
          >
            {busy ? 'Calculating…' : compact ? 'Reveal my insight' : 'See where I stand'}
            <ArrowRight size={18} />
          </button>
          {error && (
            <p id="income-error" className="form-error" role="alert">
              {error}
            </p>
          )}
          {!compact && (
            <div className="example-inputs">
              <span>Try an example</span>
              {[35000, 55000, 75000].map((value) => (
                <button
                  key={value}
                  type="button"
                  disabled={!ready || busy}
                  onClick={() => run(String(value), 'example')}
                >
                  {money(value)}
                </button>
              ))}
            </div>
          )}
        </form>
        {!compact && (
          <p className="privacy-note">
            <LockKeyhole size={14} />
            Private by design. Your income stays in this browser tab.
          </p>
        )}
      </section>
      <section
        className="result-panel"
        aria-labelledby={compact ? 'preview-result' : 'result-heading'}
      >
        <div className="result-kicker">
          <span>
            <Sparkles size={15} />
            {hasRun ? 'YOUR INCOME INSIGHT' : 'EXAMPLE INSIGHT'}
          </span>
          <span>{distribution?.datasetVersion.year ?? 'US'} DATA</span>
        </div>
        <div aria-live="polite" aria-atomic="true" className="result-primary">
          {result ? (
            <>
              <h2 id={compact ? 'preview-result' : 'result-heading'}>
                {money(result.annualIncome)} puts you{' '}
                {percentile != null ? 'ahead of approximately' : 'in a percentile range of'}
              </h2>
              <div className={'big-percent' + (percentile == null ? ' range-percent' : '')}>
                {percentText}
                <span>
                  {percentile != null
                    ? 'of the comparison population'
                    : 'of the comparison population'}
                </span>
              </div>
              <p className="result-summary">
                {percentile != null
                  ? 'Your estimated position among US people age 15 and over.'
                  : 'The source groups these incomes together, so it cannot support an exact rank.'}
              </p>
            </>
          ) : (
            <>
              <h2 id={compact ? 'preview-result' : 'result-heading'}>Data unavailable</h2>
              <p>
                A validated income distribution is unavailable. Please try again after the next data
                update.
              </p>
            </>
          )}
        </div>
        {result && (
          <>
            <div className="percentile-track" aria-hidden="true">
              <span style={{ width: `${percentile ?? range?.lower ?? 0}%` }} />
              {percentile != null ? (
                <i style={{ left: `${Math.min(98, Math.max(2, percentile))}%` }} />
              ) : (
                range && (
                  <span
                    className="range-indicator"
                    style={{ left: `${range.lower}%`, width: `${range.upper - range.lower}%` }}
                  />
                )
              )}
            </div>
            <div className="scale-labels">
              <span>0th percentile</span>
              <span>50th</span>
              <span>100th</span>
            </div>
            <IncomeChart data={output.chartData} income={result.annualIncome} compact={compact} />
          </>
        )}
        <div className="result-source">
          <span className="source-check">
            <Check size={13} />
          </span>
          <span>US Census Bureau · {distribution?.datasetVersion.year ?? '—'} income</span>
          <Link prefetch={false} href="/data/census-cps/">
            Source & method <ArrowRight size={12} />
          </Link>
        </div>
        {!compact && result && (
          <div className="what-if">
            <div>
              <h3>What if you earned a little more?</h3>
              <p>Explore a different income, with the same comparison.</p>
            </div>
            <div className="what-if-actions">
              {[5000, 10000].map((value) => (
                <button
                  key={value}
                  className="button small secondary"
                  type="button"
                  disabled={!ready || busy}
                  onClick={() => run(String(result.annualIncome + value), 'what-if')}
                >
                  <Plus size={14} />
                  {money(value)}
                </button>
              ))}
            </div>
          </div>
        )}
        {!compact && (
          <div className="result-actions">
            <button onClick={copyLink} type="button" className="text-button">
              <Copy size={15} />
              {copied ? 'Tool link copied' : 'Share this calculator'}
            </button>
            <span>Your income is never included in the link.</span>
          </div>
        )}
      </section>
      {!compact && (
        <aside className="calculation-note">
          <Info size={18} />
          <div>
            <strong>An estimate, with context.</strong> Published income bands do not reveal
            everyone’s exact income. We interpolate within closed bands and show ranges at open
            ends. A percentile is a comparison—not a measure of financial health.{' '}
            <Link prefetch={false} href="/methodology/individual-income/">
              See all assumptions
            </Link>
            .
          </div>
        </aside>
      )}
    </div>
  );
}
