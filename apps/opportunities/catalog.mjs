export const FEEDS = {
  jobicy: 'https://jobicy.com/api/v2/remote-jobs?count=100',
  arbeitnow: 'https://www.arbeitnow.com/api/job-board-api',
  remoteok: 'https://remoteok.com/api',
};

export function text(value, limit = 1200) {
  return String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => (Number(n) <= 0x10ffff ? String.fromCodePoint(Number(n)) : ''))
    .replace(
      /&(?:amp|lt|gt|quot|apos|nbsp|hellip|rsquo|lsquo|ndash|mdash);/g,
      (x) =>
        ({
          '&amp;': '&',
          '&lt;': '<',
          '&gt;': '>',
          '&quot;': '"',
          '&apos;': "'",
          '&nbsp;': ' ',
          '&hellip;': '…',
          '&rsquo;': "'",
          '&lsquo;': "'",
          '&ndash;': '–',
          '&mdash;': '—',
        })[x],
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, limit);
}

export function sourceUrl(value, host) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== 'https:' ||
      ![host, `www.${host}`].includes(url.hostname.toLowerCase()) ||
      url.username ||
      url.password
    )
      return null;
    return url.href;
  } catch {
    return null;
  }
}

function date(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function salary(low, high, currency, period) {
  if (!(Number(low) > 0) || !/^[A-Z]{3}$/.test(String(currency))) return 'Pay not supplied';
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  });
  return `${amount.format(Number(low))}${Number(high) > Number(low) ? ` – ${amount.format(Number(high))}` : ''}${period ? ` / ${text(period, 30)}` : ''} · source-listed`;
}

export function normalize(source, data, now = new Date().toISOString()) {
  const entries = source === 'jobicy' ? data.jobs : source === 'arbeitnow' ? data.data : data;
  if (!Array.isArray(entries)) throw new Error('Unexpected feed schema');
  const result = [];
  for (const item of entries) {
    if (!item || typeof item !== 'object') continue;
    if (source === 'remoteok' && !item.id) continue;
    if (source === 'arbeitnow' && item.remote !== true) continue;
    const externalId = text(source === 'arbeitnow' ? item.slug : item.id, 160);
    const title = text(item.jobTitle ?? item.position ?? item.title, 220);
    const organization = text(item.companyName ?? item.company_name ?? item.company, 160);
    const url = sourceUrl(
      item.url,
      source === 'jobicy'
        ? 'jobicy.com'
        : source === 'arbeitnow'
          ? 'arbeitnow.com'
          : 'remoteok.com',
    );
    if (!externalId || !title || !organization || !url) continue;
    const published = date(
      source === 'arbeitnow' ? Number(item.created_at) * 1000 : (item.pubDate ?? item.date),
    );
    if (
      !published ||
      Date.parse(published) > Date.parse(now) + 86400000 ||
      Date.parse(published) < Date.parse(now) - 45 * 86400000
    )
      continue;
    const location =
      text(item.jobGeo ?? item.location, 180) || 'Eligibility not specified — check source';
    const skills = (
      Array.isArray(item.jobIndustry) ? item.jobIndustry : Array.isArray(item.tags) ? item.tags : []
    )
      .map((s) => text(s, 50))
      .filter(Boolean)
      .slice(0, 8);
    const excerpt = text(item.jobExcerpt ?? item.description, 700);
    result.push({
      id: `${source}-${externalId}`,
      source_id: source,
      external_id: externalId,
      title,
      organization,
      category: 'jobs',
      location,
      work_mode: 'remote',
      reward:
        source === 'jobicy'
          ? salary(item.salaryMin, item.salaryMax, item.salaryCurrency, item.salaryPeriod)
          : source === 'remoteok'
            ? salary(item.salary_min, item.salary_max, 'USD', 'year')
            : 'Pay not supplied',
      skills: JSON.stringify(skills),
      excerpt,
      source_url: url,
      published_at: published,
      last_seen_at: now,
      expires_at: null,
      status: 'active',
      fingerprint: `${organization.toLowerCase()}|${title.toLowerCase()}|${location.toLowerCase()}`,
    });
  }
  return result;
}

export function searchQuery(params) {
  const terms =
    (params.get('q') ?? '')
      .slice(0, 160)
      .match(/[\p{L}\p{N}+#.-]+/gu)
      ?.slice(0, 8) ?? [];
  const filters = [
    "o.status = 'active'",
    "julianday(o.last_seen_at) > julianday('now', '-7 days')",
    "(o.expires_at IS NULL OR julianday(o.expires_at) > julianday('now'))",
  ];
  const values = [];
  if (terms.length) {
    filters.push(
      'o.rowid IN (SELECT rowid FROM opportunities_search WHERE opportunities_search MATCH ?)',
    );
    values.push(terms.map((term) => `"${term.replaceAll('"', '')}"*`).join(' AND '));
  }
  if (params.get('source')) {
    filters.push('o.source_id = ?');
    values.push(params.get('source').slice(0, 50));
  }
  if (params.get('location')) {
    filters.push('LOWER(o.location) LIKE ?');
    values.push(
      `%${params
        .get('location')
        .toLowerCase()
        .replace(/[\\%_]/g, '')
        .slice(0, 80)}%`,
    );
  }
  if (params.get('paid') === '1') filters.push("o.reward != 'Pay not supplied'");
  const limit = Math.max(1, Math.min(50, Number.parseInt(params.get('limit') ?? '24', 10) || 24));
  const page = Math.max(1, Math.min(100, Number.parseInt(params.get('page') ?? '1', 10) || 1));
  return { where: filters.join(' AND '), values, limit, page, offset: (page - 1) * limit };
}

export function publicOpportunity(row) {
  return { ...row, skills: JSON.parse(row.skills || '[]') };
}
