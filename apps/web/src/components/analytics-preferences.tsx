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
    document.cookie = `ig_ga4=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    window.dispatchEvent(new Event(ANALYTICS_CHANGE_EVENT));
    setStatus(
      value === 'allow'
        ? 'Analytics allowed. Browser privacy signals still take precedence.'
        : 'Analytics disabled.',
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
            Optional first-party counts and Google Analytics help us understand website use. Google
            may use analytics cookies and process device information and IP addresses. We do not
            send calculator values, questions or search terms. Analytics stays off until you allow
            it. You can withdraw your choice here.
          </p>
          <button className="cookie-settings-button" type="button" onClick={() => choose('allow')}>
            Allow analytics
          </button>
          <button className="cookie-settings-button" type="button" onClick={() => choose('deny')}>
            Decline analytics
          </button>
          <p role="status">{status}</p>
        </div>
      )}
    </div>
  );
}
