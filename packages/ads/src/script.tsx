'use client';

import { useEffect } from 'react';

export function AdSenseScript({ clientId, nonce }: { clientId: string; nonce: string }) {
  useEffect(() => {
    if (document.getElementById('insightginie-adsense')) return;
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
  }, [clientId, nonce]);
  return null;
}
