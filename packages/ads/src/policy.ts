import { isAdvertisingPage } from './config';

const consentCountries = new Set([
  'AT',
  'BE',
  'BG',
  'HR',
  'CY',
  'CZ',
  'DK',
  'EE',
  'FI',
  'FR',
  'DE',
  'GR',
  'HU',
  'IS',
  'IE',
  'IT',
  'LI',
  'LV',
  'LT',
  'LU',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'SK',
  'SI',
  'ES',
  'SE',
  'GB',
  'CH',
]);

/** Country comes from the hosting edge, never browser locale or a URL parameter. */
export function advertisingPolicy(input: {
  enabled: boolean;
  pathname: string;
  country: string | null;
  preference: string | undefined;
  globalPrivacyControl?: boolean;
}) {
  const country = input.country?.toUpperCase();
  const consentRequired =
    !country ||
    !/^[A-Z]{2}$/.test(country) ||
    country === 'XX' ||
    country === 'T1' ||
    consentCountries.has(country);
  const eligible = input.enabled && isAdvertisingPage(input.pathname);
  return {
    eligible,
    consentRequired,
    load:
      eligible && input.preference !== 'deny' && (!consentRequired || input.preference === 'allow'),
    nonPersonalized: consentRequired || Boolean(input.globalPrivacyControl),
  };
}
