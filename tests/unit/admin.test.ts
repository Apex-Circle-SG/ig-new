import { afterEach, describe, expect, it, vi } from 'vitest';
import { adminChallenge, authenticatedAdmin, htmlEscape } from '../../apps/web/src/lib/admin';

afterEach(() => vi.unstubAllEnvs());
const key = 'test-only-admin-key-not-for-production-use';
function request(value: string) {
  return new Request('https://insightginie.com/admin/', {
    headers: { authorization: `Basic ${Buffer.from(value).toString('base64')}` },
  });
}
describe('admin authentication boundary', () => {
  it('fails closed without a long configured secret', () => {
    vi.stubEnv('ADMIN_ACCESS_KEY', '');
    expect(authenticatedAdmin(request(`admin:${key}`))).toBe(false);
    expect(adminChallenge().status).toBe(503);
    vi.stubEnv('ADMIN_ACCESS_KEY', 'short');
    expect(authenticatedAdmin(request('admin:short'))).toBe(false);
  });
  it('requires both the configured user and secret', () => {
    vi.stubEnv('ADMIN_ACCESS_KEY', key);
    vi.stubEnv('ADMIN_USERNAME', 'admin');
    expect(authenticatedAdmin(request(`admin:${key}`))).toBe(true);
    expect(authenticatedAdmin(request(`somebody:${key}`))).toBe(false);
    expect(authenticatedAdmin(request('admin:wrong'))).toBe(false);
    expect(authenticatedAdmin(new Request('https://insightginie.com/admin/'))).toBe(false);
    expect(adminChallenge().headers.get('cache-control')).toContain('no-store');
    expect(adminChallenge().headers.get('x-robots-tag')).toContain('noindex');
  });
  it('escapes all source-derived values in the operational HTML', () => {
    expect(htmlEscape('<img src="x" onerror=\'alert(1)\'>&')).toBe(
      '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;',
    );
  });
});
