import { FEED_CONFIG } from './feed-config.mjs';
export { FEEDS } from './feed-config.mjs';

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
  if (value == null || value === '') return null;
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
  const config = FEED_CONFIG[source];
  if (!config) throw new Error('Unknown source');
  if (['greenhouse', 'ashby', 'bounties'].includes(config.kind))
    return normalizeDirect(source, data, now);
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
      employment_type: employmentType(item.jobType?.[0] || item.job_types?.[0] || item.job_type),
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
  filters.push(
    "EXISTS (SELECT 1 FROM sources allowed_source WHERE allowed_source.id=o.source_id AND allowed_source.status='enabled')",
  );
  const values = [];
  if (terms.length) {
    filters.push(
      'o.rowid IN (SELECT rowid FROM opportunities_search WHERE opportunities_search MATCH ?)',
    );
    values.push(terms.map((term) => `"${term.replaceAll('"', '')}"*`).join(' AND '));
  }
  if (['jobs', 'bounties'].includes(params.get('category'))) {
    filters.push('o.category = ?');
    values.push(params.get('category'));
  }
  if (params.get('arrangement')) {
    filters.push('o.employment_type = ?');
    values.push(params.get('arrangement').slice(0, 40));
  }
  filters.push(
    "NOT EXISTS (SELECT 1 FROM opportunities duplicate WHERE duplicate.fingerprint=o.fingerprint AND duplicate.id<o.id AND duplicate.status='active' AND (duplicate.expires_at IS NULL OR julianday(duplicate.expires_at)>julianday('now')) AND julianday(duplicate.last_seen_at)>julianday('now','-7 days'))",
  );
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

export function employmentType(value) {
  const key = String(value || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
  return (
    {
      fulltime: 'Full-time',
      parttime: 'Part-time',
      contract: 'Contract',
      contractor: 'Contract',
      freelance: 'Freelance',
      temporary: 'Temporary',
      intern: 'Internship',
      internship: 'Internship',
    }[key] || 'Not specified'
  );
}

function normalizeDirect(source, data, now) {
  const config = FEED_CONFIG[source];
  const entries = config.kind === 'bounties' ? data.items : data.jobs;
  if (!Array.isArray(entries) || (config.kind === 'bounties' && data.incomplete_results === true))
    throw new Error('Unexpected or incomplete feed schema');
  const result = [];
  for (const item of entries) {
    const bounty = config.kind === 'bounties';
    if (
      !item ||
      item.deleted ||
      item.dead ||
      item.isListed === false ||
      (bounty && (item.state !== 'open' || item.pull_request))
    )
      continue;
    const location = text(
      typeof item.location === 'string' ? item.location : item.location?.name,
      180,
    );
    if (!bounty) {
      const remote =
        config.kind === 'ashby'
          ? item.workplaceType === 'Remote' || (item.isRemote === true && !item.workplaceType)
          : /\bremote\b|home[ -]based/i.test(location);
      if (!remote || /hybrid|on[ -]?site/i.test(item.workplaceType || location)) continue;
    }
    const rawUrl = bounty ? item.html_url : item.jobUrl || item.absolute_url;
    const url = sourceUrl(rawUrl, config.host);
    if (!url || (!bounty && !new URL(url).pathname.startsWith(`/${config.board}/`))) continue;
    const externalId = text(item.id, 160);
    const title = text(item.title, 220);
    const published = date(
      item.publishedAt || item.first_published || item.created_at || item.updated_at,
    );
    if (!externalId || !title || !published || Date.parse(published) > Date.parse(now) + 86400000)
      continue;
    if (bounty && (new URL(url).pathname.split('/')[1] !== 'tenstorrent' || item.assignees?.length))
      continue;
    const organization = bounty
      ? new URL(url).pathname.split('/').slice(1, 3).join('/')
      : config.name;
    const amount = bounty
      ? text(item.title).match(/(?:USD\s*|US\$|\$|€|£)\s*[1-9][\d,]*(?:\.\d{1,2})?[kKmM]?/)?.[0]
      : null;
    // Labels alone are not evidence that a funded reward exists.
    if (bounty && !amount) continue;
    const skills = bounty
      ? ['Open-source contribution']
      : [
          ...new Set(
            [item.department, item.team, ...(item.departments || []).map((d) => d.name)]
              .filter(Boolean)
              .map((v) => text(v, 50)),
          ),
        ].slice(0, 8);
    const expires = date(item.applicationDeadline || item.application_deadline);
    if (expires && Date.parse(expires) <= Date.parse(now)) continue;
    result.push({
      id: `${source}-${externalId}`,
      source_id: source,
      external_id: externalId,
      title,
      organization,
      category: bounty ? 'bounties' : 'jobs',
      location: bounty
        ? 'Online; country and payout eligibility depend on the maintainer'
        : location || 'Check employer location requirements',
      work_mode: 'remote',
      employment_type: bounty
        ? 'Project reward'
        : employmentType(
            item.employmentType ||
              item.metadata?.find((m) => m.name === 'Employment Length')?.value,
          ),
      reward: bounty
        ? `${amount} mentioned in issue title · funding unverified`
        : text(
            item.compensation?.scrapeableCompensationSalarySummary ||
              item.compensation?.compensationTierSummary,
            180,
          ) || 'Pay not supplied',
      skills: JSON.stringify(skills),
      excerpt: bounty
        ? 'An open issue carrying a bounty label and an amount in its title. Confirm the sponsor, funding, acceptance criteria and whether work is already claimed before starting. This is not an escrow verification.'
        : `Employer-listed remote opening in ${location || 'a source-specified location'}. Review the full role, required experience and application instructions on ${config.name}’s original careers page.`,
      source_url: url,
      published_at: published,
      last_seen_at: now,
      expires_at: expires,
      status: 'active',
      fingerprint: `${organization.toLowerCase()}|${title.toLowerCase()}|${location.toLowerCase()}`,
    });
  }
  return result;
}
