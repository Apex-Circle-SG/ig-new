import { describe, expect, it } from 'vitest';
import { metricStatus, plannerDefaults } from '../../apps/web/src/deal-embed/planners';
import culture from '../../apps/web/src/lib/deal-materials/culture.json';
import diligence from '../../apps/web/src/lib/deal-materials/diligence.json';
describe('planning semantics', () => {
  it('distinguishes unreported from zero and applies direction-specific absolute tolerance', () => {
    expect(metricStatus(null, 10, 'higher', 0)).toBe('Not reported');
    expect(metricStatus(0, 10, 'higher', 0)).toBe('Off plan');
    expect(metricStatus(0, 0, 'higher', 0)).toBe('On plan');
    expect(metricStatus(9, 10, 'higher', 1)).toBe('Within stated tolerance');
    expect(metricStatus(11, 10, 'lower', 1)).toBe('Within stated tolerance');
    expect(metricStatus(8, 10, 'lower', 0)).toBe('On plan');
  });
  it('retains all culture dimensions, source request positions and blank personal fields', () => {
    expect(culture.length).toBe(46);
    expect(new Set(culture.map((i) => i.group)).size).toBe(11);
    const v = plannerDefaults('culture-comparison');
    for (const i of culture) {
      expect(v[i.id + '.a']).toBe('');
      expect(v[i.id + '.b']).toBe('');
    }
    expect(diligence.length).toBe(469);
    expect(new Set(diligence.map((i) => i.id)).size).toBe(469);
    const tasks = plannerDefaults('due-diligence');
    for (const i of diligence) {
      expect(i.sources.length).toBeGreaterThan(0);
      expect(tasks[i.id + '.owner']).toBe('');
      expect(tasks[i.id + '.finding']).toBe('Unknown');
    }
    expect(
      diligence.flatMap((i) => i.sources).filter((s) => s.startsWith('M&A study notes')).length,
    ).toBe(370);
  });
});
