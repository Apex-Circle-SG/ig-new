'use client';
import { useEffect, useRef, useState } from 'react';
import type { FinanceToolId } from '@insightginie/calculators';
import { track } from '@insightginie/analytics';
import styles from './finance-tool.module.css';
const channel = 'insightginie:finance:v1';
export function PrivateFinanceTool({ toolId }: { toolId: FinanceToolId }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState<number>();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [shareStatus, setShareStatus] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setFailed(true), 10000);
    function receive(event: MessageEvent) {
      if (
        event.source !== frame.current?.contentWindow ||
        event.origin !== 'null' ||
        event.data?.channel !== channel ||
        event.data?.toolId !== toolId
      )
        return;
      if (
        event.data.type === 'resize' &&
        Number.isInteger(event.data.height) &&
        event.data.height >= 320 &&
        event.data.height <= 5000
      ) {
        window.clearTimeout(timer);
        setReady(true);
        setFailed(false);
        setHeight(event.data.height);
      } else if (event.data.type === 'completed') {
        track('calculator_completed', { calculator_id: toolId, interaction: 'form' });
      } else if (event.data.type === 'started') {
        track('calculator_started', { calculator_id: toolId, interaction: 'form' });
      } else if (event.data.type === 'exported') {
        track('tool_exported', { calculator_id: toolId });
      }
    }
    window.addEventListener('message', receive);
    frame.current?.contentWindow?.postMessage({ channel, type: 'measure' }, '*');
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('message', receive);
    };
  }, [toolId, generation]);
  async function share() {
    try {
      await navigator.clipboard.writeText(`https://insightginie.com/tools/${toolId}/`);
      track('calculator_result_shared', { calculator_id: toolId, interaction: 'copy-link' });
      setShareStatus('Tool link copied. Your inputs are not included.');
    } catch {
      setShareStatus(`Copy this public link: https://insightginie.com/tools/${toolId}/`);
    }
  }
  return (
    <div className={styles.private} data-finance-tool={toolId} data-ready={ready}>
      {!ready && !failed && (
        <p className={styles.loading} role="status">
          Loading private calculator…
        </p>
      )}
      <iframe
        key={generation}
        ref={frame}
        className={styles.frame}
        data-private-finance="true"
        title="Private financial calculator"
        src={`/private-tools/${toolId}/`}
        sandbox="allow-scripts allow-forms allow-downloads allow-modals allow-popups allow-popups-to-escape-sandbox"
        referrerPolicy="no-referrer"
        style={height ? { height } : undefined}
        onLoad={() => frame.current?.contentWindow?.postMessage({ channel, type: 'measure' }, '*')}
      />
      {failed && (
        <div className={styles.error} role="alert">
          <p>Calculator could not load. Check your connection and try again.</p>
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setReady(false);
              setHeight(undefined);
              setGeneration((value) => value + 1);
            }}
          >
            Reload calculator
          </button>
        </div>
      )}
      <div className={styles.share}>
        <button type="button" onClick={share}>
          Copy tool link
        </button>
        <span role="status">
          {shareStatus ||
            'Inputs stay in this browser. Sharing the tool link never includes your scenario.'}
        </span>
      </div>
      <noscript>
        Enable JavaScript to calculate. The public example and methodology remain available below.
      </noscript>
    </div>
  );
}
