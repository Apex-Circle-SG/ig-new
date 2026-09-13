'use client';
import { useState } from 'react';
import { ANALYTICS_CHANGE_EVENT, ANALYTICS_COOKIE } from '@insightginie/analytics';
import { useHydrated } from './use-hydrated';

export function AnalyticsPreferences() {
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('');
  function choose(value: 'allow' | 'deny') {
    document.cookie = `${ANALYTICS_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    window.dispatchEvent(new Event(ANALYTICS_CHANGE_EVENT));
    setStatus(
      value === 'allow'
        ? 'Anonymous usage counts allowed. Browser privacy signals still take precedence.'
        : 'Anonymous usage counts disabled.',
    );
  }
  return (
    <div>
      <button
        className="cookie-settings-button"
        type="button"
        disabled={!ready}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        Analytics settings
      </button>
      {open && (
        <div className="analytics-preferences">
          <p>
            Optional daily usage counts help us improve these tools. No financial values,
            identifiers, questions or browsing history are collected. Counts are off until you allow
            them.
          </p>
          <button className="cookie-settings-button" type="button" onClick={() => choose('allow')}>
            Allow anonymous counts
          </button>
          <button className="cookie-settings-button" type="button" onClick={() => choose('deny')}>
            Decline anonymous counts
          </button>
          <p role="status">{status}</p>
        </div>
      )}
    </div>
  );
}
