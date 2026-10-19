import { readFile } from 'node:fs/promises';
const config = JSON.parse(
  await readFile(new URL('../../apps/opportunities/cloudflare.json', import.meta.url), 'utf8'),
);
if (process.argv.includes('--preview')) {
  const secret = (await readFile('/root/.config/insightginie/ingest-secret', 'utf8')).trim();
  const response = await fetch(config.api_url + '/admin/social-preview', {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Preview HTTP ${response.status}`);
  console.log(JSON.stringify(await response.json(), null, 2));
} else {
  const paths = ['/v1/stats', '/v1/automation', '/v1/methods'];
  const [stats, automation, methods] = await Promise.all(
    paths.map(async (path) => {
      const r = await fetch(config.api_url + path, { signal: AbortSignal.timeout(15000) });
      if (!r.ok) throw new Error(`Status HTTP ${r.status}`);
      return r.json();
    }),
  );
  console.log(
    JSON.stringify(
      {
        checkedAt: new Date().toISOString(),
        listings: stats.opportunities,
        categories: stats.categories,
        ideas: stats.ideas,
        methods: stats.methods,
        sources: stats.sources.filter((s) => s.status === 'enabled'),
        methodLinks: methods.items.map((m) => ({
          id: m.id,
          status: m.check_status,
          last_checked: m.last_checked,
        })),
        automation,
      },
      null,
      2,
    ),
  );
}
