import { describe, it, expect, vi, afterEach } from 'vitest';
import { configureAnalytics, track } from '@insightginie/analytics';
import { safeJsonLd } from '@insightginie/seo';
describe('privacy boundary', () => {
  afterEach(() => configureAnalytics());
  it('drops income, arbitrary IDs and unapproved fields at runtime', () => {
    const provider = { track: vi.fn() };
    configureAnalytics(provider);
    const unsafe = {
      calculator_id: 'individual-income-percentile',
      income: 137000,
      profile_id: 'secret',
      url: 'https://example.com/?income=137000',
    };
    track('calculator_completed', unsafe);
    expect(provider.track).toHaveBeenCalledWith('calculator_completed', {
      calculator_id: 'individual-income-percentile',
    });
    track('calculator_completed', { calculator_id: 'private-person-123' });
    expect(provider.track).toHaveBeenLastCalledWith('calculator_completed', {
      calculator_id: 'unknown',
    });
  });
  it('analytics failure cannot break a calculator interaction', () => {
    configureAnalytics({
      track: () => {
        throw new Error('provider unavailable');
      },
    });
    expect(() =>
      track('calculator_completed', { calculator_id: 'individual-income-percentile' }),
    ).not.toThrow();
  });
  it('JSON-LD cannot terminate its script element', () => {
    expect(safeJsonLd({ value: '</script><script>alert(1)</script>' })).not.toContain('<');
  });
});
