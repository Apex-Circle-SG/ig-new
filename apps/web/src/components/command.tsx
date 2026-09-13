'use client';
import { useState } from 'react';
import { SiteLink as Link } from '@insightginie/ui';
import { ArrowRight, Search } from 'lucide-react';
import { useHydrated } from './use-hydrated';
const intents = [
  {
    label: 'How does my income compare?',
    terms: 'income percentile salary earn earnings compare stand',
    href: '/calc/individual-income-percentile/',
    tag: 'Income calculator',
  },
  {
    label: 'How are the numbers calculated?',
    terms: 'data census source method calculated accuracy',
    href: '/methodology/',
    tag: 'Our methodology',
  },
  {
    label: 'What does an AI workflow cost?',
    terms: 'ai automation workflow roi payback cost',
    href: '/tools/ai-workflow-roi/',
    tag: 'AI economics',
  },
  {
    label: 'How long will my business cash last?',
    terms: 'cash runway burn business founder startup',
    href: '/tools/cash-runway/',
    tag: 'Cash runway planner',
  },
  {
    label: 'When does a business break even?',
    terms: 'break even margin contribution revenue profit',
    href: '/tools/break-even/',
    tag: 'Break-even calculator',
  },
  {
    label: 'How much does a loan actually cost?',
    terms: 'loan interest borrow fees payment amortization',
    href: '/tools/business-loan/',
    tag: 'Loan cost calculator',
  },
  {
    label: 'What does recovering from a loss require?',
    terms: 'drawdown recovery loss gain risk',
    href: '/tools/drawdown-recovery/',
    tag: 'Risk education',
  },
  {
    label: 'How concentrated is a portfolio?',
    terms: 'portfolio concentration diversification holdings position risk',
    href: '/tools/portfolio-concentration/',
    tag: 'Concentration explainer',
  },
  {
    label: 'Explore published insights',
    terms: 'insights articles editorial guides',
    href: '/insights/',
    tag: 'Insights',
  },
  {
    label: 'Explore research and downloadable data',
    terms: 'research data csv studies distribution',
    href: '/research/',
    tag: 'Research',
  },
];
export function Command() {
  const ready = useHydrated();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const matches = intents.filter(
    (item) =>
      !query ||
      query
        .toLowerCase()
        .split(/\s+/)
        .some((word) => word.length > 2 && item.terms.includes(word)),
  );
  return (
    <div className="command-wrap">
      <form
        action="/tools/"
        onSubmit={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        role="search"
      >
        <Search size={21} aria-hidden="true" />
        <input
          disabled={!ready}
          aria-label="What do you want to understand?"
          placeholder="What do you want to understand?"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
          autoComplete="off"
          aria-controls={open ? 'intent-results' : undefined}
        />
        <button disabled={!ready} type="submit" aria-label="Find an insight">
          <ArrowRight size={20} />
        </button>
      </form>
      {open && (
        <div className="command-results" id="intent-results">
          <div className="command-results-top">
            <span>Explore an insight</span>
            <button aria-label="Close search suggestions" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {matches.length ? (
            matches.map((item) => (
              <Link prefetch={false} href={item.href} key={item.href}>
                <span>
                  {item.label}
                  <small>{item.tag}</small>
                </span>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <p>
              Find a source-linked starting point.{' '}
              <Link prefetch={false} href="/ask/">
                Ask Ginie <ArrowRight size={14} />
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
