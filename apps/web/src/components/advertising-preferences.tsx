'use client';

import { useState } from 'react';
import { AD_PREFERENCE_COOKIE } from '@insightginie/ads';
import { useHydrated } from './use-hydrated';

export function AdvertisingPreferences({
  preference,
  showNotice,
}: {
  preference: string | undefined;
  showNotice: boolean;
}) {
  const ready = useHydrated();
  const [open, setOpen] = useState(false);
  const visible = open || (showNotice && preference !== 'allow' && preference !== 'deny');

  function choose(value: 'allow' | 'deny') {
    document.cookie = `${AD_PREFERENCE_COOKIE}=${value}; Path=/; Max-Age=15552000; SameSite=Lax${location.protocol === 'https:' ? '; Secure' : ''}`;
    // Reloading also removes any already-loaded advertising scripts on withdrawal.
    window.location.reload();
  }

  return (
    <>
      <button
        disabled={!ready}
        className="cookie-settings-button"
        type="button"
        onClick={() => setOpen(true)}
      >
        Cookie settings
      </button>
      {visible && (
        <section className="advertising-preferences" aria-label="Advertising preferences">
          <div>
            <h2>A choice about advertising</h2>
            <p>
              Google may use cookies and device information for advertising. Your calculator inputs
              remain private. You can change your choice anytime.{' '}
              <a href="/privacy/#cookies">Privacy details</a>
            </p>
          </div>
          <div className="advertising-preference-actions">
            <button
              disabled={!ready}
              className="button secondary"
              type="button"
              onClick={() => choose('deny')}
            >
              Continue without ads
            </button>
            <button
              disabled={!ready}
              className="button secondary"
              type="button"
              onClick={() => choose('allow')}
            >
              Allow advertising
            </button>
            {open && (
              <button type="button" className="text-link" onClick={() => setOpen(false)}>
                Close
              </button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
