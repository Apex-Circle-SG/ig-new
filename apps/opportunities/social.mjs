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
export function postText(item) {
  const method = item.kind === 'method';
  const intro = method ? 'A creative way to earn worth exploring' : 'Remote opportunity to explore';
  const url = `https://insightginie.com/${method ? 'earn' : 'opportunities'}/${encodeURIComponent(item.id)}/`;
  return `${intro}: ${clean(item.title)}\n\n${method ? `${clean(item.description, 230)}\n\nThis is a method to explore, not an available paid assignment. Check platform eligibility, costs and demand before starting.` : `${clean(item.organization)} · ${clean(item.location)}\nArrangement: ${clean(item.employment_type || 'Not specified')}\nPay: ${clean(item.reward)}\nSource: ${clean(item.source_name || item.organization)}\n\nRemote does not always mean worldwide. Confirm current eligibility and availability with the original employer.`}\n\n${url}?utm_source=linkedin&utm_medium=social&utm_campaign=daily_discovery\n\n${method ? '#SideHustle #CreativeBusiness' : '#RemoteWork #RemoteJobs'}`;
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
  const methodDay = Math.floor(time / 86400000) % 2 === 1;
  const job = async () =>
    env.DB.prepare(
      "SELECT o.*,s.name AS source_name FROM opportunities o JOIN sources s ON o.source_id=s.id WHERE o.status='active' AND o.category='jobs' AND s.status='enabled' AND julianday(o.last_seen_at)>julianday('now','-1 day') AND julianday(s.last_success)>julianday('now','-1 day') AND julianday(o.published_at)>julianday('now','-30 days') AND (o.expires_at IS NULL OR julianday(o.expires_at)>julianday('now')) AND NOT EXISTS(SELECT 1 FROM social_posts p WHERE (p.opportunity_id=o.id OR p.fingerprint=o.fingerprint) AND p.status IN ('published','publishing','uncertain')) ORDER BY RANDOM() LIMIT 1",
    ).first();
  const method = async () => {
    const row = await env.DB.prepare(
      "SELECT m.* FROM earning_methods m WHERE m.check_status='reachable' AND julianday(m.last_checked)>julianday('now','-2 days') AND NOT EXISTS(SELECT 1 FROM social_posts p WHERE p.opportunity_id=('method-'||m.id) AND p.status IN ('published','publishing','uncertain')) ORDER BY RANDOM() LIMIT 1",
    ).first();
    return row
      ? { ...JSON.parse(row.data), id: row.id, kind: 'method', fingerprint: `method-${row.id}` }
      : null;
  };
  return methodDay ? (await method()) || (await job()) : (await job()) || (await method());
}
export async function publishDaily(env, time = Date.now(), { dryRun = false } = {}) {
  const day = singaporeDay(time);
  if (!dryRun && env.LINKEDIN_ENABLED !== 'true') return { status: 'disabled', day };
  if (
    !dryRun &&
    (await env.DB.prepare('SELECT day FROM social_posts WHERE day=?').bind(day).first())
  )
    return { status: 'already-recorded', day };
  const item = await choosePost(env, time);
  if (dryRun)
    return { status: item ? 'preview' : 'no-candidate', day, text: item ? postText(item) : null };
  const started = new Date().toISOString();
  const claim = await env.DB.prepare(
    "INSERT OR IGNORE INTO social_posts(day,opportunity_id,fingerprint,status,started_at) VALUES(?,?,?,'publishing',?)",
  )
    .bind(
      day,
      item ? (item.kind === 'method' ? `method-${item.id}` : item.id) : null,
      item?.fingerprint || null,
      started,
    )
    .run();
  if (!claim.meta.changes) return { status: 'already-recorded', day };
  if (!item) {
    await env.DB.prepare("UPDATE social_posts SET status='skipped',finished_at=? WHERE day=?")
      .bind(started, day)
      .run();
    return { status: 'skipped', day };
  }
  let sent = false;
  try {
    const value = await credentials(env);
    // Check our own public destination before an external post; never post broken pages.
    const destination = `https://insightginie.com/${item.kind === 'method' ? 'earn' : 'opportunities'}/${encodeURIComponent(item.id)}/`;
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
        commentary: postText(item),
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
      "UPDATE social_posts SET status='published',finished_at=?,post_id=? WHERE day=?",
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
    await env.DB.prepare('UPDATE social_posts SET status=?,finished_at=?,error_code=? WHERE day=?')
      .bind(status, new Date().toISOString(), code, day)
      .run();
    return { status, day, error: code };
  }
}
