import { getIndividualIncomeDistribution, incomeOverviewGroups } from '@insightginie/datasets';

export function GET() {
  const distribution = getIndividualIncomeDistribution();
  if (!distribution) return new Response('Data unavailable', { status: 503 });
  const escape = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const version = distribution.datasetVersion;
  const rows = incomeOverviewGroups(distribution)
    .map(
      (group) =>
        `<tr><th scope="row">${group.label}</th><td><div class="track"><div style="width:${group.share}%"></div></div></td><td>${group.share.toFixed(1)}%</td></tr>`,
    )
    .join('');
  return new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>US individual income distribution, ${version.year}</title><style>body{font:15px system-ui,sans-serif;color:#17243c;margin:0;padding:18px;box-sizing:border-box}h1{font-size:21px;margin:0 0 12px}p{line-height:1.5}table{width:100%;border-collapse:collapse}th{text-align:left;font-weight:500}th,td{padding:9px 4px;font-size:13px}td:nth-child(2){width:30%}.track{background:#eef1f7;height:12px;border-radius:4px;overflow:hidden}.track div{height:100%;background:#6347d9}a{color:#5138bf}caption{text-align:left;margin-bottom:10px;font-size:13px}small{font-size:12px}</style></head><body><h1>US individual income distribution, ${version.year}</h1><table><caption>Share of US people age 15 and over, including people with no income. Survey estimates.</caption><thead><tr><th scope="col">Income</th><th scope="col">Distribution</th><th scope="col">Share</th></tr></thead><tbody>${rows}</tbody></table><p><small>Source: <a href="${escape(version.sourceUrl)}" target="_blank" rel="noopener">US Census Bureau</a> · ${version.year} income · Chart: <a href="https://insightginie.com/data/us-income-distribution/" target="_blank" rel="noopener">InsightGinie — data and methodology</a></small></p></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600, no-transform',
        'Content-Security-Policy':
          "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors https: http://localhost:* http://127.0.0.1:*",
      },
    },
  );
}
