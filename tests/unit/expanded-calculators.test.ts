import { describe, expect, it } from 'vitest';
import { CALCS } from '../../apps/web/src/lib/expanded-calculators';
import { GET } from '../../apps/web/src/app/private-expanded/route';
import { isCalculatorPage } from '@insightginie/seo';

describe('expanded calculators', () => {
  it('calculates salary and handles a zero-hour denominator', () => {
    const calc = CALCS.find((item) => item.id === 'salary-hourly')!;
    expect(calc.compute({ salary: 52000, hourlyRate: 25, hoursPerWeek: 40, weeksPerYear: 52 }).hourlyFromSalary).toBe(25);
    expect(calc.compute({ salary: 52000, hourlyRate: 25, hoursPerWeek: 0, weeksPerYear: 52 }).hourlyFromSalary).toBeNull();
  });

  it('isolates the editor and treats the public page as a calculator', async () => {
    const response = GET();
    expect(response.headers.get('content-security-policy')).toContain("connect-src 'none'");
    expect(response.headers.get('content-security-policy')).toContain('sandbox allow-scripts allow-forms');
    expect(await response.text()).toContain('id="root"');
    expect(isCalculatorPage('/calculators/expanded/')).toBe(true);
  });
});
