import { chooseDiscovery, DISCOVERY_TRIAL } from './discoveries.mjs';

const API_VERSION = '202609';
const encoder = new TextEncoder();
const clean = (value, length = 180) =>
  String(value || '')
    .replace(/[\r\n@{}|<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, length);
export function singaporeDay(time) {
  return new Date(time + 8 * 3600000).toISOString().slice(0, 10);
}
function skillsOf(item) {
  try {
    const skills = Array.isArray(item.skills) ? item.skills : JSON.parse(item.skills || '[]');
    return Array.isArray(skills)
      ? skills
          .map((s) => clean(s, 45))
          .filter(Boolean)
          .slice(0, 4)
      : [];
  } catch {
    return [];
  }
}
function excerptOf(item) {
  const text = clean(
    String(item.excerpt || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/https?:\/\/\S+/g, ''),
    700,
  );
  const match =
    /(?:responsibilit(?:y|ies)|requirements|qualifications|what you(?:'|’)ll do|you will|you(?:'|’)ll|your role|the role|we(?:'|’)re looking for|we are looking for|you have|work with|build (?:customer|services)|design and|develop and|experience (?:in|with))/i.exec(
      text,
    );
  if (!match) return '';
  const start = Math.max(text.lastIndexOf('. ', match.index), text.lastIndexOf('! ', match.index));
  const excerpt = text.slice(start >= 0 ? start + 2 : match.index).trim();
  return excerpt.length > 520 ? `${excerpt.slice(0, 517).trimEnd()}…` : excerpt;
}
function hasPay(item) {
  return (
    /\d/.test(item.reward || '') && !/not supplied|not disclosed|unspecified/i.test(item.reward)
  );
}
export function postScore(item, time = Date.now()) {
  const excerpt = excerptOf(item);
  if (excerpt.length < 100 || !clean(item.location) || !clean(item.organization)) return -1;
  const age = Math.max(0, (time - Date.parse(item.published_at)) / 86400000);
  return (
    (hasPay(item) ? 35 : 0) +
    (/worldwide|anywhere|global/i.test(item.location) ? 20 : 0) +
    Math.min(20, excerpt.length / 25) +
    skillsOf(item).length * 3 +
    Math.max(0, 20 - (Number.isFinite(age) ? age : 30))
  );
}
// LinkedIn commentary uses little text grammar, not raw plain text.
export function linkedinCommentary(text) {
  return String(text).replace(/[\\|{}@\[\]()<>#*_~]/g, '\\$&');
}
export function postDestination(item) {
  const path = item.kind === 'discovery' || item.kind === 'method' ? 'earn' : 'opportunities';
  return `https://insightginie.com/${path}/${encodeURIComponent(item.kind === 'discovery' ? item.method_id : item.id)}/`;
}
export function postText(item) {
  if (item.kind === 'discovery')
    return [
      clean(item.hook, 220),
      `The practical guide on InsightGinie:\n${postDestination(item)}`,
      clean(item.explanation, 600),
      `Try this: ${clean(item.takeaway, 300)}`,
      clean(item.caveat, 320),
      `${item.type === 'calculation' ? 'Illustrative calculation' : 'Source'}: ${clean(item.source_name)}. Reviewed ${clean(item.reviewed_on, 10)}; original reference is in the guide.`,
      'Evening Money Discovery · #WaysToEarn #FutureOfWork',
    ].join('\n\n');
  const method = item.kind === 'method';
  const url = postDestination(item);
  if (method)
    return [
      `Who would pay for this? ${clean(item.title)}`,
      `Explore the guide on InsightGinie:\n${url}`,
      clean(item.description, 300),
      `Potential buyer: ${clean(item.buyer, 220)}`,
      `Your first step: ${clean(item.first_step, 300)}`,
      `Reality check: ${clean(item.risks, 300)}`,
      'This is a method to explore, not an available paid assignment. Earnings depend on eligibility, selection or demand.',
      `See the steps, requirements and original platform:\n${url}`,
      '#SideHustle #CreativeBusiness',
    ].join('\n\n');
  const skills = skillsOf(item);
  return [
    `${clean(item.organization)} is hiring: ${clean(item.title)}${hasPay(item) ? ` — ${clean(item.reward)}` : ''}`,
    `Full details and how to apply on InsightGinie:\n${url}`,
    `From the job listing:\n${excerptOf(item)}`,
    skills.length ? `Skills listed: ${skills.join(' · ')}` : null,
    `🌍 Remote eligibility: ${clean(item.location)}\n🕒 ${clean(item.employment_type || 'Arrangement not specified')}\n💰 ${hasPay(item) ? clean(item.reward) : 'Salary not disclosed'}`,
    item.expires_at ? `Listed deadline: ${clean(item.expires_at, 40)}` : null,
    `Source: ${clean(item.source_name || item.organization)}. Remote does not always mean worldwide; confirm requirements and availability with the employer.`,
    `See the full brief and application link:\n${url}`,
    'Know someone suited to this role? Send it their way.',
    '#RemoteWork #RemoteJobs',
  ]
    .filter(Boolean)
    .join('\n\n');
}
async function key(secret) {
  return crypto.subtle.importKey(
    'raw',
    await crypto.subtle.digest('SHA-256', encoder.encode(secret)),
    'AES-GCM',
    false,
    ['encrypt', 'decrypt'],
  );
}
function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}
export async function encryptState(value, secret) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await key(secret),
    encoder.encode(JSON.stringify(value)),
  );
  return JSON.stringify({ iv: bytesToBase64(iv), data: bytesToBase64(encrypted) });
}
export async function decryptState(value, secret) {
  const data = JSON.parse(value);
  return JSON.parse(
    new TextDecoder().decode(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: base64ToBytes(data.iv) },
        await key(secret),
        base64ToBytes(data.data),
      ),
    ),
  );
}
async function credentials(env) {
  if (!env.LINKEDIN_CREDENTIALS || !env.LINKEDIN_STATE_KEY)
    throw new Error('linkedin_not_configured');
  const stored = await env.DB.prepare(
    "SELECT data FROM automation_state WHERE id='linkedin_credentials'",
  ).first();
  let value = stored
    ? await decryptState(stored.data, env.LINKEDIN_STATE_KEY)
    : JSON.parse(env.LINKEDIN_CREDENTIALS);
  if (!/^urn:li:person:[a-zA-Z0-9_-]+$/.test(value.person_urn || ''))
    throw new Error('personal_profile_missing');
  if (Number(value.refresh_token_expires_at) < Date.now() / 1000 + 86400)
    throw new Error('linkedin_reauthorization_required');
  if (!value.access_token || Number(value.access_token_expires_at) < Date.now() / 1000 + 86400) {
    const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: value.refresh_token,
        client_id: value.client_id,
        client_secret: value.client_secret,
      }),
      signal: AbortSignal.timeout(15000),
      redirect: 'manual',
    });
    if (!response.ok) throw new Error(`linkedin_refresh_http_${response.status}`);
    const result = await response.json();
    if (!result.access_token) throw new Error('linkedin_refresh_invalid');
    value = {
      ...value,
      access_token: result.access_token,
      access_token_expires_at: Math.floor(Date.now() / 1000) + Number(result.expires_in || 0),
      refresh_token: result.refresh_token || value.refresh_token,
      refresh_token_expires_at: result.refresh_token_expires_in
        ? Math.floor(Date.now() / 1000) + Number(result.refresh_token_expires_in)
        : value.refresh_token_expires_at,
    };
    await env.DB.prepare(
      "INSERT INTO automation_state VALUES('linkedin_credentials',?,?) ON CONFLICT(id) DO UPDATE SET data=excluded.data,updated_at=excluded.updated_at",
    )
      .bind(await encryptState(value, env.LINKEDIN_STATE_KEY), new Date().toISOString())
      .run();
  }
  return value;
}
export async function choosePost(env, time) {
  // Singapore weekdays: jobs Mon/Tue/Thu/Sat; creative methods Wed/Fri/Sun.
  const methodDay = [0, 3, 5].includes(new Date(time + 8 * 3600000).getUTCDay());
  const job = async () => {
    const rows = await env.DB.prepare(
      "SELECT o.*,s.name AS source_name FROM opportunities o JOIN sources s ON o.source_id=s.id WHERE o.status='active' AND o.category='jobs' AND s.status='enabled' AND julianday(o.last_seen_at)>julianday('now','-1 day') AND julianday(s.last_success)>julianday('now','-1 day') AND julianday(o.published_at)>julianday('now','-30 days') AND (o.expires_at IS NULL OR julianday(o.expires_at)>julianday('now')) AND NOT EXISTS(SELECT 1 FROM social_posts p WHERE (p.opportunity_id=o.id OR p.fingerprint=o.fingerprint) AND p.status IN ('published','publishing','uncertain')) ORDER BY o.published_at DESC LIMIT 100",
    ).all();
    return (
      rows.results
        .map((row) => ({ row, score: postScore(row, time) }))
        .filter((item) => item.score >= 0)
        .sort((a, b) => b.score - a.score || a.row.id.localeCompare(b.row.id))[0]?.row || null
    );
  };
  const method = async () => {
    const row = await env.DB.prepare(
      "SELECT m.* FROM earning_methods m WHERE m.check_status='reachable' AND julianday(m.last_checked)>julianday('now','-2 days') AND NOT EXISTS(SELECT 1 FROM social_posts p WHERE p.opportunity_id=('method-'||m.id) AND p.status IN ('published','publishing','uncertain')) AND length(json_extract(m.data,'$.first_step'))>30 AND length(json_extract(m.data,'$.buyer'))>10 AND length(json_extract(m.data,'$.risks'))>30 ORDER BY m.id LIMIT 1",
    ).first();
    return row
      ? { ...JSON.parse(row.data), id: row.id, kind: 'method', fingerprint: `method-${row.id}` }
      : null;
  };
  return methodDay ? (await method()) || (await job()) : (await job()) || (await method());
}
export async function publishDaily(
  env,
  time = Date.now(),
  { dryRun = false, slot = 'morning' } = {},
) {
  if (!['morning', 'evening'].includes(slot)) throw new Error('Invalid posting slot');
  const table = slot === 'evening' ? 'social_discovery_posts' : 'social_posts';
  const day = singaporeDay(time);
  if (slot === 'evening' && !dryRun && env.LINKEDIN_EVENING_ENABLED !== 'true')
    return { status: 'disabled', day };
  if (!dryRun && env.LINKEDIN_ENABLED !== 'true') return { status: 'disabled', day };
  if (slot === 'evening' && !dryRun && (day < DISCOVERY_TRIAL.start || day > DISCOVERY_TRIAL.end))
    return { status: 'outside-trial', day };
  if (!dryRun && (await env.DB.prepare(`SELECT day FROM ${table} WHERE day=?`).bind(day).first()))
    return { status: 'already-recorded', day };
  const item = await (slot === 'evening' ? chooseDiscovery(env, time) : choosePost(env, time));
  if (dryRun)
    return { status: item ? 'preview' : 'no-candidate', day, text: item ? postText(item) : null };
  const started = new Date().toISOString();
  const claim = await env.DB.prepare(
    `INSERT OR IGNORE INTO ${table}(day,opportunity_id,fingerprint,status,started_at) VALUES(?,?,?,'publishing',?)`,
  )
    .bind(
      day,
      item
        ? item.kind === 'method'
          ? `method-${item.id}`
          : item.kind === 'discovery'
            ? `discovery-${item.id}`
            : item.id
        : null,
      item?.fingerprint || null,
      started,
    )
    .run();
  if (!claim.meta.changes) return { status: 'already-recorded', day };
  if (!item) {
    await env.DB.prepare(`UPDATE ${table} SET status='skipped',finished_at=? WHERE day=?`)
      .bind(started, day)
      .run();
    return { status: 'skipped', day };
  }
  let sent = false;
  try {
    const value = await credentials(env);
    // Check our own public destination before an external post; never post broken pages.
    const destination = postDestination(item);
    if (item.kind === 'discovery' && !(await sourceReachable(item.source_url)))
      throw new Error('destination_source_unavailable');
    const commentary = linkedinCommentary(postText(item));
    if (!commentary.includes(destination) || commentary.length > 2900)
      throw new Error('destination_invalid_commentary');
    const page = await fetch(destination, {
      method: 'HEAD',
      signal: AbortSignal.timeout(10000),
      redirect: 'manual',
    });
    if (page.status !== 200) throw new Error(`destination_http_${page.status}`);
    sent = true;
    const response = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${value.access_token}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': API_VERSION,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: value.person_urn,
        commentary,
        visibility: 'PUBLIC',
        distribution: {
          feedDistribution: 'MAIN_FEED',
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: 'PUBLISHED',
        isReshareDisabledByAuthor: false,
      }),
      signal: AbortSignal.timeout(20000),
      redirect: 'manual',
    });
    if (response.status !== 201) {
      sent = response.status >= 500;
      throw new Error(`linkedin_post_http_${response.status}`);
    }
    const postId = response.headers.get('x-restli-id');
    if (!postId) throw new Error('linkedin_post_missing_receipt');
    await env.DB.prepare(
      `UPDATE ${table} SET status='published',finished_at=?,post_id=? WHERE day=?`,
    )
      .bind(new Date().toISOString(), postId, day)
      .run();
    return { status: 'published', day };
  } catch (error) {
    const code = /^(linkedin_|personal_|destination_)[a-z0-9_]+$/.test(error.message || '')
      ? error.message
      : 'request_failed';
    // A timeout/5xx may have published. Never retry it automatically and risk duplicate posts.
    const status = sent ? 'uncertain' : 'failed';
    await env.DB.prepare(`UPDATE ${table} SET status=?,finished_at=?,error_code=? WHERE day=?`)
      .bind(status, new Date().toISOString(), code, day)
      .run();
    return { status, day, error: code };
  }
}

async function sourceReachable(url) {
  let response = await fetch(url, {
    method: 'HEAD',
    redirect: 'manual',
    signal: AbortSignal.timeout(8000),
  });
  if ([403, 404, 405, 410].includes(response.status)) {
    response = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1023' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
    });
    await response.body?.cancel();
  }
  return response.status === 200 || response.status === 206;
}
