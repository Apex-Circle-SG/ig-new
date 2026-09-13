'use client';

import { useEffect } from 'react';

export function AdSenseScript({
  clientId,
  nonce,
  nonPersonalized = false,
}: {
  clientId: string;
  nonce: string;
  nonPersonalized?: boolean;
}) {
  useEffect(() => {
    if (document.getElementById('insightginie-adsense')) return;
    const adWindow = window as Window & {
      adsbygoogle?: unknown[] & { requestNonPersonalizedAds?: number };
    };
    const privacySignal = (navigator as Navigator & { globalPrivacyControl?: boolean })
      .globalPrivacyControl;
    adWindow.adsbygoogle ??= [];
    if (nonPersonalized || privacySignal) adWindow.adsbygoogle.requestNonPersonalizedAds = 1;
    // Google may insert elements immediately; start only after React has hydrated.
    const script = document.createElement('script');
    script.id = 'insightginie-adsense';
    script.async = true;
    script.nonce = nonce;
    script.setAttribute('data-cfasync', 'false');
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
    script.crossOrigin = 'anonymous';
    document.head.appendChild(script);
    // Native navigation/withdrawal replaces the document and all provider code.
  }, [clientId, nonce, nonPersonalized]);
  return null;
}
