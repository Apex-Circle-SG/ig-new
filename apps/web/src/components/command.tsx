'use client';
import { useState } from 'react';
import Link from 'next/link';
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
        action="/calc/"
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
              We’re starting with income comparisons.{' '}
              <Link prefetch={false} href="/calc/individual-income-percentile/">
                Try the income calculator <ArrowRight size={14} />
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
