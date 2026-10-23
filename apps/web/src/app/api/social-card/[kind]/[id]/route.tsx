import { ImageResponse } from 'next/og';
import { catalog, opportunityRecord, type EarningMethod } from '../../../../../lib/opportunities';
import socialHooks from '../../../../../../../opportunities/data/social-hooks.json';
import discoveries from '../../../../../../../opportunities/data/discoveries.json';

export const runtime = 'nodejs';
const clipped = (value: string, max: number) =>
  value.length > max ? `${value.slice(0, max - 1).trim()}…` : value;
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  const { kind, id } = await params;
  const headers = {
    'X-Robots-Tag': 'noindex, noimageindex',
    'Cache-Control': 'public, max-age=300',
  };
  if (!['job', 'method', 'discovery'].includes(kind) || !/^[a-zA-Z0-9_-]{1,150}$/.test(id))
    return new Response('Not found', { status: 404, headers });
  let label = '',
    title = '',
    detail = '',
    context = '',
    caveat = '';
  if (kind === 'job') {
    const job = await opportunityRecord(id);
    if (job === undefined)
      return new Response('Temporarily unavailable', {
        status: 503,
        headers: { ...headers, 'Cache-Control': 'no-store' },
      });
    if (
      !job ||
      job.status !== 'active' ||
      (job.expires_at && Date.parse(job.expires_at) <= Date.now())
    )
      return new Response('Not found', { status: 404, headers });
    label = `REMOTE ROLE · ${job.organization}`;
    title = job.title;
    detail = /\d/.test(job.reward) ? job.reward : 'Salary not disclosed';
    context = `${job.location} · ${job.employment_type || 'Arrangement not supplied'}`;
    caveat = 'Source-listed details. Check location eligibility and availability.';
  } else {
    const data = await catalog<{ items: EarningMethod[] }>('/v1/methods');
    if (!data)
      return new Response('Temporarily unavailable', {
        status: 503,
        headers: { ...headers, 'Cache-Control': 'no-store' },
      });
    const discovery = kind === 'discovery' ? discoveries.find((d) => d.id === id) : null;
    const method = data.items.find(
      (m) => m.id === (kind === 'discovery' ? discovery?.method_id : id),
    );
    if (!method) return new Response('Not found', { status: 404, headers });
    label =
      discovery?.type === 'calculation'
        ? 'MONEY EXPERIMENT · ILLUSTRATIVE MATH'
        : discovery
          ? 'AN UNEXPECTED WAY TO EARN'
          : `WAYS TO EARN · ${method.category}`;
    title = discovery?.hook || (socialHooks as Record<string, string>)[method.id] || method.title;
    detail = discovery?.takeaway || method.first_step;
    context = `Explore the guide · ${method.source_name}`;
    caveat =
      discovery?.type === 'calculation'
        ? 'Hypothetical example, not reported earnings.'
        : 'An earning method to explore. Selection, demand and earnings vary.';
  }
  const mint = kind !== 'job';
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#181b30',
          color: 'white',
          padding: 76,
          fontFamily: 'sans-serif',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 40, letterSpacing: -2 }}>
            <svg width="38" height="38" viewBox="0 0 32 32" style={{ marginRight: 14 }}>
              <path
                d="M16 2c1.4 8.8 5.2 12.6 14 14-8.8 1.4-12.6 5.2-14 14C14.6 21.2 10.8 17.4 2 16 10.8 14.6 14.6 10.8 16 2Z"
                fill="#c3b2ff"
              />
            </svg>
            insightginie.
          </div>
          <div
            style={{
              display: 'flex',
              height: 18,
              width: 100,
              borderRadius: 20,
              background: mint ? '#b9ebce' : '#c3b2ff',
            }}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 22,
              color: mint ? '#b9ebce' : '#c3b2ff',
              letterSpacing: 2,
              marginBottom: 32,
            }}
          >
            {clipped(label, 85)}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: title.length > 100 ? 66 : 82,
              lineHeight: 1.08,
              letterSpacing: -3,
              fontWeight: 700,
              marginBottom: 42,
            }}
          >
            {clipped(title, 180)}
          </div>
          <div
            style={{
              display: 'flex',
              background: mint ? '#b9ebce' : '#c3b2ff',
              color: '#181b30',
              padding: 28,
              borderRadius: 18,
              fontSize: kind === 'job' ? 38 : 30,
              lineHeight: 1.35,
            }}
          >
            {clipped(detail, 210)}
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 26,
              color: '#d4d4e6',
              marginTop: 28,
              lineHeight: 1.4,
            }}
          >
            {clipped(context, 140)}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            borderTop: '1px solid #45465b',
            paddingTop: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 26 }}>
            <span>See the first step. Know the catch.</span>
            <span style={{ color: mint ? '#b9ebce' : '#c3b2ff' }}>insightginie.com ↗</span>
          </div>
          <div style={{ display: 'flex', color: '#c2c3d2', fontSize: 19, marginTop: 18 }}>
            {caveat}
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 1200, headers },
  );
}
