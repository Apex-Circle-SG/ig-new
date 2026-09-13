'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@insightginie/analytics';
import { ArrowRight } from 'lucide-react';
import { useHydrated } from './use-hydrated';
import {
  INCOME_EMBED_CHANNEL,
  PUBLIC_INCOME_TOOL_URL,
  SAFE_CALCULATOR_EVENTS,
  SAFE_INTERACTIONS,
} from '../embed/protocol';

/** A sandbox without allow-same-origin keeps financial DOM inaccessible to parent scripts. */
export function PrivateIncomeTool({
  compact = false,
  preview = null,
}: {
  compact?: boolean;
  preview?: { incomeLabel: string; percentileLabel: string; year: number } | null;
}) {
  const hydrated = useHydrated();
  const frame = useRef<HTMLIFrameElement>(null);
  const [active, setActive] = useState(!compact);
  const [height, setHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timeout = window.setTimeout(() => setFailed(true), 8000);
    function receive(event: MessageEvent) {
      const child = frame.current?.contentWindow;
      if (
        !child ||
        event.source !== child ||
        event.origin !== 'null' ||
        event.data?.channel !== INCOME_EMBED_CHANNEL
      )
        return;
      const message = event.data;
      if (
        message.type === 'resize' &&
        Number.isInteger(message.height) &&
        message.height >= 320 &&
        message.height <= 5000
      ) {
        window.clearTimeout(timeout);
        setHeight(message.height);
        setReady(true);
        setFailed(false);
      } else if (message.type === 'share-tool') {
        Promise.resolve()
          .then(() => navigator.clipboard.writeText(PUBLIC_INCOME_TOOL_URL))
          .then(() => {
            child.postMessage(
              { channel: INCOME_EMBED_CHANNEL, type: 'share-result', ok: true },
              '*',
            );
          })
          .catch(() => {
            child.postMessage(
              { channel: INCOME_EMBED_CHANNEL, type: 'share-result', ok: false },
              '*',
            );
          });
      } else if (message.type === 'event') {
        const name = SAFE_CALCULATOR_EVENTS.find((allowed) => allowed === message.event);
        const interaction = SAFE_INTERACTIONS.find((allowed) => allowed === message.interaction);
        if (name) track(name, { calculator_id: 'individual-income-percentile', interaction });
      }
    }
    window.addEventListener('message', receive);
    frame.current?.contentWindow?.postMessage(
      { channel: INCOME_EMBED_CHANNEL, type: 'measure' },
      '*',
    );
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('message', receive);
    };
  }, [active, generation]);

  function retry() {
    setFailed(false);
    setReady(false);
    setHeight(undefined);
    setGeneration((previous) => previous + 1);
  }

  if (!active) {
    return (
      <div className="private-income-tool is-compact">
        <section
          className="income-tool mini-tool public-income-preview"
          aria-labelledby="public-preview-heading"
        >
          <div className="input-panel">
            <div className="panel-heading">
              <h2 id="public-preview-heading">Your income. In perspective.</h2>
            </div>
            <p className="public-preview-label">AN EXAMPLE, USING REAL US DATA</p>
            <p className="public-preview-income">{preview?.incomeLabel ?? 'Data unavailable'}</p>
            <p className="input-help">Annual individual income before taxes</p>
            <button
              type="button"
              className="button primary calculate-button"
              disabled={!hydrated}
              onClick={() => setActive(true)}
            >
              Try your income <ArrowRight size={18} />
            </button>
          </div>
          <div className="result-panel">
            <div className="result-kicker">
              <span>EXAMPLE INSIGHT</span>
              {preview && <span>{preview.year} DATA</span>}
            </div>
            {preview ? (
              <div className="result-primary">
                <h2>Higher than approximately</h2>
                <div className="big-percent">
                  {preview.percentileLabel}
                  <span>of US people age 15 and over</span>
                </div>
                <p className="result-summary">
                  Includes people with no income. Your own calculation stays private in your
                  browser.
                </p>
              </div>
            ) : (
              <p>A validated income comparison is currently unavailable.</p>
            )}
            <div className="result-source">
              <span>US Census Bureau{preview ? ` · ${preview.year} income` : ''}</span>
              <a href="/data/census-cps/">
                Source & method <ArrowRight size={12} />
              </a>
            </div>
          </div>
        </section>
        <noscript>
          Enable JavaScript to try your income, or{' '}
          <a href="/calc/individual-income-percentile/">read the calculator and methodology</a>.
        </noscript>
      </div>
    );
  }

  return (
    <div
      className={`private-income-tool${compact ? ' is-compact' : ''}`}
      data-ready={ready}
      aria-busy={!ready && !failed}
    >
      {!ready && !failed && (
        <p className="sr-only" role="status">
          Loading private calculator…
        </p>
      )}
      <iframe
        key={generation}
        ref={frame}
        className="private-income-frame"
        title="Private individual income percentile calculator"
        src={`/tools/income/?view=${compact ? 'compact' : 'full'}`}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={height ? { height } : undefined}
        loading="eager"
        onLoad={() =>
          frame.current?.contentWindow?.postMessage(
            { channel: INCOME_EMBED_CHANNEL, type: 'measure' },
            '*',
          )
        }
      />
      {failed && (
        <div className="private-income-error" role="alert">
          <p>Calculator could not load. Check your connection and try again.</p>
          <button className="button secondary" type="button" onClick={retry}>
            Reload calculator
          </button>
        </div>
      )}
      <noscript>
        The calculator shows a public example. Enable JavaScript to enter your income and calculate
        privately in this browser.
      </noscript>
    </div>
  );
}
