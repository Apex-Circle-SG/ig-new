import { describe, expect, it } from 'vitest';
import { advertisingPolicy } from '../../packages/ads/src/policy';
import { PUBLIC_AD_PATHS } from '@insightginie/seo';

describe('regional advertising policy', () => {
  const base = { enabled: true, pathname: '/', country: 'US', preference: undefined };
  it.each(PUBLIC_AD_PATHS)('makes %s eligible without a worldwide opt-in gate', (pathname) => {
    expect(advertisingPolicy({ ...base, pathname }).load).toBe(true);
  });
  it.each(['DE', 'FR', 'GB', 'CH', 'NO', null, 'XX', 'T1'])(
    'waits for a choice for country %s',
    (country) => {
      expect(advertisingPolicy({ ...base, country }).load).toBe(false);
      expect(advertisingPolicy({ ...base, country, preference: 'allow' })).toMatchObject({
        load: true,
        nonPersonalized: true,
      });
    },
  );
  it.each(['/authors/', '/tools/income/', '/admin/', '/me/', '/missing/'])(
    'never monetizes %s',
    (pathname) => {
      expect(advertisingPolicy({ ...base, pathname, preference: 'allow' }).load).toBe(false);
    },
  );
  it('honors withdrawal, global opt-out signals, and the integration kill switch', () => {
    expect(advertisingPolicy({ ...base, preference: 'deny' }).load).toBe(false);
    expect(advertisingPolicy({ ...base, globalPrivacyControl: true }).nonPersonalized).toBe(true);
    expect(advertisingPolicy({ ...base, enabled: false }).load).toBe(false);
  });
});
