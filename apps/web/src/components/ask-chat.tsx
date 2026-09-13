'use client';

import { useId, useRef, useState } from 'react';
import { ArrowUpRight, Send, Sparkles } from 'lucide-react';
import type { AskAnswer } from '../lib/ask/core';
import styles from './ask-chat.module.css';
import { track } from '@insightginie/analytics';

const sourcedSuggestions = [
  'How do I calculate cash runway?',
  'What is an AI workflow’s payback period?',
  'Why does a drawdown need a larger recovery?',
  'How does InsightGinie protect my privacy?',
];
const generalSuggestions = [
  'Why is the sky blue?',
  'Explain a JavaScript promise with an example.',
  'Help me write a clear project update.',
  'How do I calculate cash runway?',
];
type Exchange = { question: string; answer: AskAnswer };

export function AskChat({ generalAvailable = false }: { generalAvailable?: boolean } = {}) {
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
      const signal = AbortSignal.timeout(35_000);
      const tokenResponse = await fetch('/api/ask/token/', {
        credentials: 'same-origin',
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal,
      });
      if (!tokenResponse.ok) throw new Error('Ginie is busy. Please try again in a minute.');
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
          data.error ?? 'Ginie is temporarily unavailable. Please try again or explore the tools.',
        );
      const event =
        data.mode === 'answer' && data.method === 'datadog-general-answer'
          ? 'ask_answer_generated'
          : data.mode === 'answer' && data.citations.length > 0
            ? 'ask_answer_cited'
            : data.mode === 'refusal'
              ? 'ask_refusal'
              : data.mode === 'fallback'
                ? 'ask_fallback'
                : null;
      if (event) track(event, { calculator_id: 'ask' });
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
    <section className={styles.chat} aria-label="Ask Ginie">
      <div className={styles.intro}>
        <span className={styles.spark}>
          <Sparkles size={22} aria-hidden="true" />
        </span>
        <div>
          <h2>What would you like to understand?</h2>
          <p>
            {generalAvailable
              ? 'Ask about any topic: explore an idea, work through a problem, or try a calculation. Each answer shows how it was prepared.'
              : 'Explore published explanations, understand a method, or find a useful tool. General AI answers are not enabled.'}
          </p>
        </div>
      </div>
      {generalAvailable && (
        <p className={styles.disclaimer} id={`${id}-general-disclosure`}>
          Questions without a supported calculation or source match are sent to Datadog for a
          general AI answer. Datadog may retain those questions and answers under its account
          policy. Avoid personal or confidential information.{' '}
          <a href="/privacy/">Privacy details</a>
        </p>
      )}
      <div className={styles.suggestions} aria-label="Example questions">
        {(generalAvailable ? generalSuggestions : sourcedSuggestions).map((suggestion) => (
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
                {exchange.answer.method === 'datadog-general-answer'
                  ? 'General AI answer'
                  : exchange.answer.method === 'deterministic-calculator'
                    ? 'Calculated from your stated example'
                    : exchange.answer.mode === 'answer' && exchange.answer.citations.length > 0
                      ? 'From the published sources'
                      : exchange.answer.mode === 'answer'
                        ? 'Ginie’s answer'
                        : exchange.answer.mode === 'refusal'
                          ? 'What I can help with'
                          : 'Let’s use a reliable starting point'}
              </h3>
              <p className={styles.provider} data-testid="answer-provider">
                {exchange.answer.method === 'datadog-general-answer'
                  ? 'Datadog · general answer'
                  : exchange.answer.provider?.id === 'datadog'
                    ? exchange.answer.provider.status === 'cached'
                      ? 'Datadog · cached source selection'
                      : 'Datadog · source selection'
                    : exchange.answer.method === 'deterministic-calculator'
                      ? 'InsightGinie · deterministic calculation'
                      : exchange.answer.provider?.status === 'fallback' &&
                          exchange.answer.citations.length > 0
                        ? 'InsightGinie · local source fallback'
                        : 'InsightGinie · local response'}
              </p>
              {exchange.answer.method === 'datadog-general-answer' && (
                <p>
                  This general AI answer has not been verified against published sources. It may be
                  incorrect or out of date.
                </p>
              )}
              {exchange.answer.message.split('\n\n').map((paragraph, n) => (
                <p key={n} style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {paragraph}
                </p>
              ))}
              {exchange.answer.method !== 'datadog-general-answer' &&
                exchange.answer.citations.length > 0 && (
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
            {generalAvailable ? 'Preparing your answer…' : 'Checking the approved sources…'}
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
          placeholder={
            generalAvailable
              ? 'For example: explain how solar panels work.'
              : 'For example: how do your calculators protect my privacy?'
          }
          maxLength={1200}
          rows={3}
          aria-describedby={`${id}-privacy${generalAvailable ? ` ${id}-general-disclosure` : ''}${error ? ` ${id}-error` : ''}`}
          disabled={busy}
        />
        <div className={styles.formBottom}>
          <p id={`${id}-privacy`}>
            {generalAvailable
              ? 'Checking for identifiers and removing detected financial amounts cannot guarantee removal of private information. Only your current question is sent for a general answer; your chat history is not forwarded.'
              : 'Please leave out personal or confidential details. Your question is processed on our server; Datadog receives only approved public excerpts and a general topic for source selection.'}{' '}
            <a href="/ai-disclosure/">How Ginie works</a>
          </p>
          <button
            className={styles.submit}
            type="submit"
            disabled={busy || question.trim().length < 3}
          >
            {busy ? 'Working…' : 'Ask Ginie'}
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
        AI can be wrong. Check important claims. Ginie provides educational information and is not a
        substitute for qualified professional advice.
      </p>
    </section>
  );
}
