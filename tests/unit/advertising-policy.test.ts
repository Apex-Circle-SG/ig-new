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
  it.each([
    '/ask/',
    '/ask',
    '/tools/income/',
    '/private-tools/cash-runway/',
    '/private-tools/portfolio-concentration/',
    '/admin/',
    '/me/',
    '/missing/',
    '/insights/connecting-openclaw-to-qq-a-guide-to-the-onebot-adapter-skill/',
  ])('never monetizes %s', (pathname) => {
    expect(advertisingPolicy({ ...base, pathname, preference: 'allow' })).toMatchObject({
      eligible: false,
      load: false,
    });
  });
  it('honors withdrawal, global opt-out signals, and the integration kill switch', () => {
    expect(advertisingPolicy({ ...base, preference: 'deny' }).load).toBe(false);
    expect(advertisingPolicy({ ...base, globalPrivacyControl: true }).nonPersonalized).toBe(true);
    expect(advertisingPolicy({ ...base, enabled: false }).load).toBe(false);
  });
  it('allows the public tool hub and organizational profile without exposing their private descendants', () => {
    expect(advertisingPolicy({ ...base, pathname: '/tools/' })).toMatchObject({
      eligible: true,
      load: true,
    });
    expect(advertisingPolicy({ ...base, pathname: '/authors/insightginie/' })).toMatchObject({
      eligible: true,
      load: true,
    });
    expect(advertisingPolicy({ ...base, pathname: '/tools/income/' })).toMatchObject({
      eligible: false,
      load: false,
    });
  });
});
