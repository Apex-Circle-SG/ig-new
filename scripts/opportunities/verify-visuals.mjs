// Read-only public checks by default. --upload additionally uploads one image to
// the owner's LinkedIn media storage; it never creates or edits a feed post.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { decryptState, uploadPostImage, postVisual } from '../../apps/opportunities/social.mjs';
import discoveries from '../../apps/opportunities/data/discoveries.json' with { type: 'json' };
const root = resolve(import.meta.dirname, '../..');
const base = 'https://insightginie.com';
const config = JSON.parse(
  await readFile(resolve(root, 'apps/opportunities/cloudflare.json'), 'utf8'),
);
const report = {
  checkedAt: new Date().toISOString(),
  feedPostsCreated: 0,
  checks: [],
  upload: null,
};
const response = await fetch(base);
const html = await response.text();
if (!response.ok || !html.includes('Find your next') || !html.includes('way to'))
  throw new Error('Homepage verification failed');
report.checks.push({ page: '/', status: response.status, earningHomepage: true });
for (const path of [
  '/api/social-card/method/website-user-testing/',
  '/api/social-card/discovery/think-out-loud/',
]) {
  const image = await fetch(base + path);
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (
    !image.ok ||
    !image.headers.get('content-type')?.includes('image/png') ||
    bytes.length > 4000000 ||
    bytes[0] !== 137
  )
    throw new Error('Public PNG verification failed');
  report.checks.push({
    page: path,
    status: image.status,
    bytes: bytes.length,
    noindex: image.headers.get('x-robots-tag'),
  });
}
if (process.argv.includes('--upload')) {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID)
    throw new Error('Private Cloudflare environment required');
  const d1 = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/d1/database/${config.database_id}/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sql: "SELECT data FROM automation_state WHERE id='linkedin_credentials'",
      }),
    },
  );
  if (!d1.ok) throw new Error('Credential state lookup failed');
  const json = await d1.json();
  const encrypted = json.result?.[0]?.results?.[0]?.data;
  const privateRoot = resolve(process.env.HOME, '.config/insightginie');
  const value = encrypted
    ? await decryptState(
        encrypted,
        (await readFile(resolve(privateRoot, 'linkedin-state-key'), 'utf8')).trim(),
      )
    : JSON.parse(await readFile(resolve(privateRoot, 'linkedin.json'), 'utf8'));
  if (!value.access_token || Number(value.access_token_expires_at) < Date.now() / 1000 + 300)
    throw new Error('Current access token needs renewal');
  const visual = postVisual({ ...discoveries[0], kind: 'discovery' });
  const imageUrn = await uploadPostImage(value, visual);
  report.upload = {
    status: 'accepted',
    imageUrn,
    visualUrl: visual.url,
    feedPostCreated: false,
    temporaryFilesCreated: 0,
  };
}
await writeFile(
  resolve(root, 'docs/verification/earning-visuals-live.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report));
