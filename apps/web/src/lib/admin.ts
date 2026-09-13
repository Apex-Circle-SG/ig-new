import { createHash, timingSafeEqual } from 'node:crypto';
import { privateJson } from './request-security';

export function authenticatedAdmin(request: Request) {
  const configured = process.env.ADMIN_ACCESS_KEY;
  if (!configured || configured.length < 32) return false;
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ') || header.length > 1024) return false;
  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
    const separator = decoded.indexOf(':');
    if (separator < 0) return false;
    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    const hash = (value: string) => createHash('sha256').update(value).digest();
    return (
      timingSafeEqual(hash(username), hash(process.env.ADMIN_USERNAME ?? 'admin')) &&
      timingSafeEqual(hash(password), hash(configured))
    );
  } catch {
    return false;
  }
}
export function adminChallenge() {
  const response = privateJson(
    {
      error: process.env.ADMIN_ACCESS_KEY
        ? 'Admin authentication required.'
        : 'Admin access is not configured.',
    },
    process.env.ADMIN_ACCESS_KEY ? 401 : 503,
  );
  if (process.env.ADMIN_ACCESS_KEY)
    response.headers.set(
      'WWW-Authenticate',
      'Basic realm="InsightGinie operations", charset="UTF-8"',
    );
  return response;
}
export function htmlEscape(value: unknown) {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}
