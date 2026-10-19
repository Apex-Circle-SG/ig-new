'use client';
import { useEffect } from 'react';
import { ANALYTICS_CHANGE_EVENT, analyticsConsentGranted } from '@insightginie/analytics';
import { publicRouteId } from '@insightginie/seo';

export const GA4_ID = 'G-4HQVZL3586';
export const GA4_COOKIE = 'ig_ga4';
type GoogleWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  __igGa4Ready?: boolean;
  __igGa4LastPage?: string;
  [key: `ga-disable-${string}`]: boolean | undefined;
};

export function GoogleAnalytics({ pathname, nonce }: { pathname: string; nonce: string }) {
  useEffect(() => {
    const runtime = window as unknown as GoogleWindow;
    function update() {
      const publicPage =
        Boolean(publicRouteId(pathname)) ||
        /^\/(?:ideas|opportunities)\/[a-z0-9-]+\/$/.test(pathname);
      const privatePage =
        pathname === '/ask/' || pathname === '/opportunities/saved/' || Boolean(location.search);
      const consent =
        analyticsConsentGranted() &&
        document.cookie.split(';').some((part) => part.trim() === `${GA4_COOKIE}=allow`);
      const enabled = publicPage && !privatePage && consent;
      runtime[`ga-disable-${GA4_ID}`] = !enabled;
      if (!enabled) {
        runtime.__igGa4LastPage = undefined;
        runtime.gtag?.('consent', 'update', {
          analytics_storage: 'denied',
        });
        if (!consent) {
          for (const entry of document.cookie.split(';')) {
            const name = entry.trim().split('=')[0];
            if (name !== '_ga' && !name.startsWith('_ga_')) continue;
            document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
            const labels = location.hostname.split('.');
            for (let i = 0; i < labels.length - 1; i++)
              document.cookie = `${name}=; Max-Age=0; Path=/; Domain=${labels.slice(i).join('.')}; SameSite=Lax`;
          }
        }
        return;
      }
      runtime.dataLayer ??= [];
      runtime.gtag ??= function () {
        // Match Google's documented command-queue format.
        // eslint-disable-next-line prefer-rest-params
        runtime.dataLayer?.push(arguments);
      };
      const locationWithoutQuery = `${location.origin}${pathname}`;
      if (!runtime.__igGa4Ready) {
        runtime.gtag('consent', 'default', {
          analytics_storage: 'denied',
        });
        runtime.gtag('js', new Date());
        runtime.__igGa4Ready = true;
      }
      runtime.gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
      runtime.gtag('config', GA4_ID, {
        send_page_view: false,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        page_location: locationWithoutQuery,
        page_referrer: '',
        ignore_referrer: true,
      });
      if (runtime.__igGa4LastPage !== pathname) {
        runtime.gtag('event', 'page_view', {
          send_to: GA4_ID,
          page_location: locationWithoutQuery,
          page_referrer: '',
          page_title: document.title,
        });
        runtime.__igGa4LastPage = pathname;
      }
      if (!document.getElementById('insightginie-ga4')) {
        const script = document.createElement('script');
        script.id = 'insightginie-ga4';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
        script.nonce = nonce;
        script.referrerPolicy = 'no-referrer';
        document.head.appendChild(script);
      }
    }
    update();
    window.addEventListener(ANALYTICS_CHANGE_EVENT, update);
    return () => window.removeEventListener(ANALYTICS_CHANGE_EVENT, update);
  }, [pathname, nonce]);
  return null;
}
