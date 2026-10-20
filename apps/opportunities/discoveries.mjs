import discoveries from './data/discoveries.json' with { type: 'json' };

export const DISCOVERY_TRIAL = {
  start: '2026-10-20',
  end: '2026-11-02',
  schedule: 'Daily 21:00 Asia/Singapore',
  posts: discoveries.length,
};

// Reviewed editorial queue. There is no unsupervised model making factual claims.
export async function chooseDiscovery(env, time) {
  const day = new Date(time + 8 * 3600000).toISOString().slice(0, 10);
  const item = discoveries.find((entry) => entry.publish_on === day);
  if (!item || item.reviewed_on > day || item.expires_on < day) return null;
  const used = await env.DB.prepare(
    "SELECT day FROM social_discovery_posts WHERE opportunity_id=? AND status IN ('published','publishing','uncertain')",
  )
    .bind(`discovery-${item.id}`)
    .first();
  if (used) return null;
  const method = await env.DB.prepare(
    "SELECT data FROM earning_methods WHERE id=? AND check_status='reachable' AND julianday(last_checked)>julianday(?,'-2 days')",
  )
    .bind(item.method_id, new Date(time).toISOString())
    .first();
  if (!method || JSON.parse(method.data).source_url !== item.source_url) return null;
  return { ...item, kind: 'discovery', fingerprint: `discovery-${item.id}` };
}
