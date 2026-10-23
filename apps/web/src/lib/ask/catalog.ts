import {
  catalog,
  type EarningMethod,
  type Idea,
  type OpportunityResults,
  type Platform,
} from '../opportunities';
import { askOutputSchema, questionPrivacyNotice, type AskAnswer } from './core';
import { type CatalogQuery } from './conversation';
import { prepareGeneralQuestion } from './general-question';

const locationNames: [RegExp, string][] = [
  [/\bworldwide\b/i, 'Worldwide'],
  [/\banywhere\b/i, 'Anywhere'],
  [/\bglobal\b/i, 'Global'],
  [/\bsingapore\b/i, 'Singapore'],
  [/\bmalaysia\b/i, 'Malaysia'],
  [/\bphilippines\b/i, 'Philippines'],
  [/\bindonesia\b/i, 'Indonesia'],
  [/\bindia\b/i, 'India'],
  [/\bpakistan\b/i, 'Pakistan'],
  [/\bthailand\b/i, 'Thailand'],
  [/\bvietnam\b/i, 'Vietnam'],
  [/\baustralia\b/i, 'Australia'],
  [/\bnew zealand\b/i, 'New Zealand'],
  [/\bjapan\b/i, 'Japan'],
  [/\bhong kong\b/i, 'Hong Kong'],
  [/\bcanada\b/i, 'Canada'],
  [/\bUS\b/, 'USA'],
  [/\b(?:united states|usa|u\.s\.|us only)\b/i, 'USA'],
  [/\b(?:united kingdom|uk|u\.k\.)\b/i, 'UK'],
  [/\beurope\b/i, 'Europe'],
  [/\bemea\b/i, 'EMEA'],
  [/\bapac\b/i, 'APAC'],
  [/\bgermany\b/i, 'Germany'],
  [/\bfrance\b/i, 'France'],
  [/\bireland\b/i, 'Ireland'],
  [/\bnetherlands\b/i, 'Netherlands'],
  [/\bbrazil\b/i, 'Brazil'],
  [/\bmexico\b/i, 'Mexico'],
];
const arrangements: [RegExp, CatalogQuery['arrangement']][] = [
  [/\bpart[ -]?time\b/i, 'Part-time'],
  [/\bfull[ -]?time\b/i, 'Full-time'],
  [/\bcontract(?:or|s)?\b/i, 'Contract'],
  [/\bfreelanc(?:e|ing)\b/i, 'Freelance'],
  [/\btemporary\b/i, 'Temporary'],
  [/\bintern(?:ship|ships)?\b/i, 'Internship'],
];
function intent(text: string): CatalogQuery['kind'] | undefined {
  if (/\b(bount(?:y|ies)|open.source rewards?)\b/i.test(text)) return 'bounties';
  if (/\b(business ideas?|idea lab|funny|unusual|playful|weird)\b/i.test(text)) return 'ideas';
  if (/\b(jobs?|roles?|hiring|vacancies|remote work|remote contracts?)\b/i.test(text))
    return 'jobs';
  if (/\b(platforms?|earning sites|task sites)\b/i.test(text)) return 'platforms';
  if (
    /\b(ways? to earn|earn(?:ing)? money|make money|side hustles?|paid research|research interviews|mock jur(?:y|ies)|test(?:ing)? websites|website testing|sell(?:ing)? spreadsheets?|notion templates?|digital products?|creative services?|pet portraits?|voiceovers?|audiobooks?|stock photos?|tutoring|usertesting|onlineverdict|prolific|respondent|printables?|game assets?|3d (?:models?|assets?)|wedding speeches|podcast clips?|slide decks?|workbooks?|expert consulting|preply|acx|kdp|99designs)\b/i.test(
      text,
    )
  )
    return 'methods';
  if (/\b(opportunities|opportunity tracker)\b/i.test(text)) return 'jobs';
}
const continuation =
  /^(?:and\b|also\b|only\b|remove\b|next\b|what about\b|how about\b|any\b|those\b|these\b|more\b|other\b|instead\b|show (?:me )?(?:more|those|these)\b)|\b(?:those|these|them|instead|same filters)\b/i;
function keywords(text: string) {
  let value = text;
  for (const [regex] of [...locationNames, ...arrangements])
    value = value.replace(new RegExp(regex.source, 'gi'), ' ');
  return (
    value
      .toLowerCase()
      .replace(
        /\b(?:find|show|search|list|browse|explore|recommend|suggest|tell|give|help|look|looking|want|need|please|can|could|would|should|there|are|any|some|all|only|with|without|what|which|how|about|for|from|that|this|those|these|them|more|other|instead|also|and|the|a|an|to|of|in|on|at|me|my|i|am|us|is|it|do|does|have|has|as|by|be|get|start|started|available|currently|current|latest|today|online|remote|work|working|jobs?|roles?|opportunities|hiring|vacancies|websites?|website|site|listed|source|listed|salary|salaries|pay|paid|range|ranges|disclosed|entry|level|beginners?|beginner|no|experience|ways?|earn|earning|money|make|side|hustles?|business|ideas?|idea|lab|platforms?|task|sites|creative|services?|digital|products?)\b/g,
        ' ',
      )
      .replace(/[^a-z0-9+#.\s-]/g, ' ')
      .match(/[a-z0-9][a-z0-9+#.-]*/g)
      ?.join(' ')
      .slice(0, 160) || ''
  );
}
export function resolveCatalogQuery(
  question: string,
  previous?: CatalogQuery,
): CatalogQuery | null {
  const kind = intent(question);
  const followup = Boolean(
    previous &&
      (continuation.test(question.trim()) ||
        (!kind &&
          (locationNames.some(([r]) => r.test(question)) ||
            arrangements.some(([r]) => r.test(question))))),
  );
  if (!kind && !followup) return null;
  const query: CatalogQuery =
    followup && previous
      ? { ...previous }
      : { kind: kind!, q: '', location: '', arrangement: '', paid: false, page: 1 };
  if (kind && kind !== query.kind) {
    query.kind = kind;
    query.q = '';
    query.location = '';
    query.arrangement = '';
    query.paid = false;
  }
  const words = keywords(question);
  if (
    words &&
    (!followup ||
      /\b(?:python|javascript|react|sql|design|marketing|sales|customer|support|engineer|writing|writer|developer|analyst)\b/i.test(
        words,
      ))
  )
    query.q = words;
  // Semantic routes use searchable terms rather than generic intent words.
  if (query.kind === 'methods' && /paid research/i.test(question)) query.q = 'research';
  if (query.kind === 'methods' && /creative services/i.test(question))
    query.q = 'creative services';
  if (query.kind === 'methods' && /digital products/i.test(question)) query.q = 'creative products';
  if (query.kind === 'methods' && /test(?:ing)? websites|website testing/i.test(question))
    query.q = 'test websites';
  if (query.kind === 'ideas' && /funny|unusual|playful|weird/i.test(question)) query.q = 'playful';
  for (const [regex, name] of locationNames) if (regex.test(question)) query.location = name;
  for (const [regex, name] of arrangements) if (regex.test(question)) query.arrangement = name;
  if (
    /\b(?:salary|pay|paid)\s+(?:range|listed|disclosed)|\bwith (?:a )?(?:salary|pay)|\bonly paid\b/i.test(
      question,
    )
  )
    query.paid = true;
  if (/\b(?:any|all) (?:countries|locations)|remove (?:the )?location/i.test(question))
    query.location = '';
  if (/\b(?:any|all) arrangements?|remove (?:the )?arrangement/i.test(question))
    query.arrangement = '';
  if (/\b(?:include undisclosed|any salary|any pay)\b/i.test(question)) query.paid = false;
  const more = /^(?:show (?:me )?)?more\b|^next (?:page|results|ones)\b/i.test(question.trim());
  query.page = more && previous ? Math.min(100, (previous.page || 1) + 1) : 1;
  return query;
}
const clean = (value: string, max = 650) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const safeId = (id: string) => /^[a-z0-9_-]{1,150}$/.test(id);
function score(query: string, title: string, text: string) {
  const words = [...new Set(query.split(/\s+/).filter(Boolean))];
  if (!words.length) return 1;
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/spreadsheets/g, 'spreadsheet')
      .replace(/photographs/g, 'photos')
      .replace(/templates/g, 'template')
      .replace(/testing/g, 'test');
  return words.reduce(
    (sum, w) =>
      sum +
      (normalize(title).includes(normalize(w))
        ? 4
        : normalize(text).includes(normalize(w))
          ? 1
          : 0),
    0,
  );
}
export async function answerCatalogQuestion(
  question: string,
  previous?: CatalogQuery,
  load: typeof catalog = catalog,
): Promise<AskAnswer | null> {
  if (
    questionPrivacyNotice(question) ||
    questionPrivacyNotice(`${previous?.q || ''} ${previous?.location || ''}`)
  )
    return null;
  const publicQuestion = prepareGeneralQuestion(question).question.replace(
    /\[(?:amount|number) omitted\]/g,
    '',
  );
  const query = resolveCatalogQuery(publicQuestion, previous);
  if (!query) return null;
  const params = new URLSearchParams();
  if (query.kind === 'jobs' || query.kind === 'bounties') {
    params.set('category', query.kind);
    if (query.q) params.set('q', query.q);
    if (query.location) params.set('location', query.location);
    if (query.arrangement) params.set('arrangement', query.arrangement);
    if (query.paid) params.set('paid', '1');
    params.set('page', String(query.page));
  }
  const index =
    query.kind === 'methods'
      ? 'earn'
      : query.kind === 'ideas'
        ? 'ideas'
        : query.kind === 'platforms'
          ? 'platforms'
          : 'opportunities';
  const browseParams = new URLSearchParams(params);
  browseParams.delete('page');
  const browsePath = `/${index}/${browseParams.size ? `?${browseParams}` : ''}`;
  const base = {
    method: 'live-catalog-search' as const,
    provider: { id: 'local' as const, status: 'not-needed' as const },
    citations: [],
    assumptions: [],
    followups: [
      { label: 'Browse remote opportunities', path: '/opportunities/' },
      { label: 'Explore earning guides', path: '/earn/' },
      { label: 'Visit the idea lab', path: '/ideas/' },
    ],
    catalog: { query, total: 0, browsePath, retrievedAt: new Date().toISOString(), items: [] },
  };
  const unavailable = () =>
    askOutputSchema.parse({
      ...base,
      mode: 'fallback',
      message:
        'The opportunity catalog is temporarily unavailable. Open the directory below or try again shortly. I have not invented matching opportunities.',
      provider: { id: 'local', status: 'fallback' },
    });
  try {
    if (query.kind === 'jobs' || query.kind === 'bounties') {
      const data = await load<OpportunityResults>(`/v1/opportunities?${params}&limit=5`);
      if (!data) return unavailable();
      const items = data.items
        .filter(
          (j) =>
            safeId(j.id) &&
            j.status === 'active' &&
            (!j.expires_at || Date.parse(j.expires_at) > Date.now()),
        )
        .slice(0, 5)
        .map((j) => ({
          title: clean(j.title, 220),
          path: `/opportunities/${j.id}/`,
          summary: clean(j.excerpt, 450),
          location: clean(j.location, 240),
          reward: clean(j.reward, 240),
          arrangement: clean(j.employment_type, 60),
          source: clean(j.source_name, 180),
          sourceUrl: j.source_url,
          checkedAt: j.last_seen_at,
        }));
      return askOutputSchema.parse({
        ...base,
        mode: 'answer',
        message: items.length
          ? `Here are ${items.length} of ${data.total} matching source-listed opportunities.${query.q ? ` Search: ${query.q}.` : ''}${query.location ? ` Listed location: ${query.location}.` : ''}${query.arrangement ? ` Arrangement: ${query.arrangement}.` : ''}`
          : `No source-listed opportunities matched these filters.${query.q ? ` Search: ${query.q}.` : ''}${query.location ? ` Listed location: ${query.location}.` : ''}${query.arrangement ? ` Arrangement: ${query.arrangement}.` : ''} Try a broader role or location.`,
        catalog: { ...base.catalog, total: data.total, items },
        assumptions: [
          'Results come from the current opportunity catalog, which may be cached for up to two minutes. Matching locations are source text, not a guarantee of eligibility.',
          'Remote does not always mean worldwide. Confirm current pay, requirements and availability with the original provider. Experience, degree and minimum-pay requirements are not automatically verified.',
        ],
      });
    }
    const path =
      query.kind === 'methods'
        ? '/v1/methods'
        : query.kind === 'ideas'
          ? '/v1/ideas'
          : '/v1/platforms';
    const data = await load<{ items: (EarningMethod | Idea | Platform)[] }>(path);
    if (!data) return unavailable();
    const ranked = data.items
      .filter((item) => {
        if (query.kind !== 'methods') return true;
        if (/research|interviews?|mock jur|test websites/i.test(query.q))
          return item.category === 'Paid participation';
        if (query.q === 'creative services') return item.category === 'Creative services';
        if (query.q === 'creative products') return item.category === 'Creative products';
        return true;
      })
      .filter((item) => !('check_status' in item) || item.check_status === 'reachable')
      .map((item) => ({
        item,
        score: score(query.q, 'name' in item ? item.name : item.title, JSON.stringify(item)),
      }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score || a.item.id.localeCompare(b.item.id));
    const items = ranked
      .slice((query.page - 1) * 5, query.page * 5)
      .filter(({ item }) => safeId(item.id))
      .map(({ item }) => ({
        title: clean('name' in item ? item.name : item.title, 220),
        path: 'name' in item ? '/platforms/' : `/${index}/${item.id}/`,
        summary: clean(
          `${item.description}${'first_step' in item ? ` First step: ${item.first_step}` : 'experiment' in item ? ` First experiment: ${item.experiment}` : ''}`,
        ),
        source: clean(
          'source_name' in item
            ? item.source_name
            : 'name' in item
              ? item.name
              : 'InsightGinie idea lab',
          180,
        ),
        sourceUrl:
          'source_url' in item
            ? item.source_url
            : 'url' in item
              ? item.url
              : `https://insightginie.com/ideas/${item.id}/`,
        ...('last_checked' in item && item.last_checked ? { checkedAt: item.last_checked } : {}),
      }));
    return askOutputSchema.parse({
      ...base,
      mode: 'answer',
      message: items.length
        ? `Here are ${items.length} matching ${query.kind === 'methods' ? 'earning guides' : query.kind === 'ideas' ? 'business experiments' : 'earning platforms'}.${query.q ? ` Search: ${query.q}.` : ''}`
        : `No matching ${query.kind} were found. Try a broader topic.`,
      catalog: { ...base.catalog, total: ranked.length, items },
      assumptions: [
        query.kind === 'ideas'
          ? 'These are ideas to validate, not proven businesses or available paid assignments.'
          : 'These are earning routes to explore, not available paid assignments or guaranteed income. Check selection, eligibility and demand with the provider.',
        ...(query.location || query.arrangement
          ? [
              'Location and employment-arrangement filters apply to job listings, not these guides. Check the provider’s eligibility requirements.',
            ]
          : []),
      ],
    });
  } catch {
    return unavailable();
  }
}
