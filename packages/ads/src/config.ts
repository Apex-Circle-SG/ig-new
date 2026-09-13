import { isPublicAdvertisingPath } from '@insightginie/seo';

export const ADSENSE_CLIENT_ID = 'ca-pub-8735749779872017';
export const AD_PREFERENCE_COOKIE = 'ig_advertising';

export function isAdvertisingPage(pathname: string): boolean {
  return isPublicAdvertisingPath(pathname);
}

export function advertisingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ADS_ENABLED === 'true';
}

export function adsenseClientId(): string {
  const value = process.env.ADSENSE_CLIENT_ID || ADSENSE_CLIENT_ID;
  if (!/^ca-pub-\d{16}$/.test(value)) throw new Error('Invalid AdSense publisher ID');
  return value;
}
