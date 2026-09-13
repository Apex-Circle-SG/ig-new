import {
  createRequestLimiter,
  issueRequestToken,
  privateJson,
  requestBucket,
  SECURITY_COOKIE,
} from '../../../../lib/request-security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allow = createRequestLimiter(60);
export function GET(request: Request) {
  if (request.headers.get('sec-fetch-site') === 'cross-site')
    return privateJson({ error: 'Use Ask on this site.' }, 403);
  if (!allow(requestBucket(request)))
    return privateJson({ error: 'Please try again shortly.' }, 429);
  const { nonce, token } = issueRequestToken();
  const response = privateJson({ token });
  const secure = (process.env.APP_SITE_ORIGIN ?? 'https://insightginie.com').startsWith('https:');
  response.headers.set(
    'Set-Cookie',
    `${SECURITY_COOKIE}=${nonce}; Path=/api/ask/; HttpOnly; SameSite=Strict; Max-Age=600${secure ? '; Secure' : ''}`,
  );
  return response;
}
