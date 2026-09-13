'use client';

import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Send, Sparkles } from 'lucide-react';
import type { AskAnswer } from '../lib/ask/core';
import styles from './ask-chat.module.css';
import { track } from '@insightginie/analytics';

const suggestions = [
  'How do I calculate cash runway?',
  'What is an AI workflow’s payback period?',
  'Why does a drawdown need a larger recovery?',
  'How does my income percentile work?',
];
type Exchange = { question: string; answer: AskAnswer };

export function AskChat() {
  const id = useId();
  const [question, setQuestion] = useState('');
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const results = useRef<HTMLDivElement>(null);

  async function ask(value: string) {
    if (busy) return;
    const clean = value.trim();
    if (clean.length < 3 || clean.length > 1200) {
      setError('Enter a question between 3 and 1,200 characters.');
      return;
    }
    setBusy(true);
    setError('');
    setFeedback('');
    try {
      const signal = AbortSignal.timeout(15_000);
      const tokenResponse = await fetch('/api/ask/token/', {
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal,
      });
      if (!tokenResponse.ok) throw new Error('Ask is busy. Please try again in a minute.');
      const { token } = (await tokenResponse.json()) as { token: string };
      const response = await fetch('/api/ask/', {
        method: 'POST',
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, token, website: '' }),
        signal,
      });
      const data = (await response.json()) as AskAnswer & { error?: string };
      if (!response.ok)
        throw new Error(
          data.error ?? 'Ask is temporarily unavailable. Try the finance tools below.',
        );
      track(
        data.mode === 'answer'
          ? 'ask_answer_cited'
          : data.mode === 'refusal'
            ? 'ask_refusal'
            : 'ask_fallback',
        { calculator_id: 'ask' },
      );
      setExchanges((previous) => [...previous.slice(-5), { question: clean, answer: data }]);
      setQuestion('');
      requestAnimationFrame(() => results.current?.focus({ preventScroll: true }));
    } catch (failure) {
      setError(
        failure instanceof Error && failure.name !== 'TimeoutError'
          ? failure.message
          : 'The request timed out. Please try again.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function report(category: string) {
    try {
      const signal = AbortSignal.timeout(15_000);
      const tokenResponse = await fetch('/api/ask/token/', {
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal,
      });
      if (!tokenResponse.ok) throw new Error('Feedback unavailable');
      const { token } = (await tokenResponse.json()) as { token: string };
      const response = await fetch('/api/ask/feedback/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        referrerPolicy: 'no-referrer',
        body: JSON.stringify({ token, category }),
        signal,
      });
      setFeedback(
        response.ok
          ? 'Thank you. Only the issue category was recorded; your question and answer were not included.'
          : 'The report could not be recorded. You can use the Contact page.',
      );
    } catch {
      setFeedback('The report could not be recorded. You can use the Contact page.');
    }
  }

  return (
    <section className={styles.chat} aria-label="Ask InsightGinie">
      <div className={styles.intro}>
        <span className={styles.spark}>
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <div>
          <h2>What would you like to understand?</h2>
          <p>
            Ask about a calculation or the data behind it. Follow the sources, then explore your own
            scenario.
          </p>
        </div>
      </div>
      <div className={styles.suggestions} aria-label="Example questions">
        {suggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            disabled={busy}
            onClick={() => void ask(suggestion)}
          >
            {suggestion}
            <ArrowUpRight size={15} aria-hidden="true" />
          </button>
        ))}
      </div>
      <div
        className={styles.messages}
        ref={results}
        tabIndex={-1}
        role="region"
        aria-label="Answers"
        aria-live="polite"
        aria-busy={busy}
      >
        {exchanges.map((exchange, index) => (
          <div className={styles.exchange} key={index}>
            <p className={styles.question}>
              <span>You asked</span>
              {exchange.question}
            </p>
            <article className={styles.answer}>
              <h3>
                {exchange.answer.method === 'deterministic-calculator'
                  ? 'Calculated from your stated example'
                  : exchange.answer.mode === 'answer'
                    ? 'From the published sources'
                    : exchange.answer.mode === 'refusal'
                      ? 'What I can help with'
                      : 'Let’s use a reliable starting point'}
              </h3>
              {exchange.answer.message.split('\n\n').map((paragraph, n) => (
                <p key={n}>{paragraph}</p>
              ))}
              {exchange.answer.citations.length > 0 && (
                <div className={styles.sources}>
                  <h4>Sources & freshness</h4>
                  <ul>
                    {exchange.answer.citations.map((citation) => (
                      <li key={citation.path}>
                        <a href={citation.path}>{citation.title}</a>
                        <span>
                          Updated{' '}
                          {new Date(citation.updatedAt).toLocaleDateString('en-US', {
                            timeZone: 'UTC',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        {citation.sources.map((source) => (
                          <a
                            className={styles.primarySource}
                            key={source.url}
                            href={source.url}
                            rel="noopener noreferrer"
                          >
                            {source.name} ↗
                          </a>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {exchange.answer.assumptions.length > 0 && (
                <details>
                  <summary>How this answer was prepared</summary>
                  <ul>
                    {exchange.answer.assumptions.map((assumption) => (
                      <li key={assumption}>{assumption}</li>
                    ))}
                  </ul>
                </details>
              )}
              <nav className={styles.followups} aria-label="Explore this answer">
                {exchange.answer.followups.map((followup) => (
                  <a href={followup.path} key={followup.path}>
                    {followup.label}
                    <ArrowUpRight size={14} aria-hidden="true" />
                  </a>
                ))}
              </nav>
            </article>
          </div>
        ))}
        {busy && (
          <p role="status" className={styles.loading}>
            Checking the approved sources…
          </p>
        )}
      </div>
      <form
        className={styles.form}
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <label htmlFor={id}>Your question</label>
        <textarea
          id={id}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="For example: how do fees change the cost of a business loan?"
          maxLength={1200}
          rows={3}
          aria-describedby={`${id}-privacy${error ? ` ${id}-error` : ''}`}
          disabled={busy}
        />
        <div className={styles.formBottom}>
          <p id={`${id}-privacy`}>
            Please leave out personal details. Questions are processed on our server and are not
            saved to your account or analytics. <a href="/ai-disclosure/">How Ask works</a>
          </p>
          <button
            className={styles.submit}
            type="submit"
            disabled={busy || question.trim().length < 3}
          >
            {busy ? 'Checking…' : 'Ask Genie'}
            <Send size={17} aria-hidden="true" />
          </button>
        </div>
        {error && (
          <p id={`${id}-error`} role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </form>
      {exchanges.length > 0 && (
        <div className={styles.feedback}>
          <details>
            <summary>Report an answer</summary>
            <p>Send an issue category only. Your conversation will not be attached.</p>
            {['source-issue', 'unclear-answer', 'unsafe-answer'].map((category) => (
              <button type="button" key={category} onClick={() => void report(category)}>
                {category.replaceAll('-', ' ')}
              </button>
            ))}
          </details>
          <p role="status">{feedback}</p>
        </div>
      )}
      <p className={styles.disclaimer}>
        Educational information. Ask does not provide investment recommendations, lending decisions,
        tax conclusions or personalized professional advice.
      </p>
    </section>
  );
}
