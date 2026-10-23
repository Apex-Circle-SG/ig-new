import { describe, it, expect, vi } from 'vitest';
import { answerCatalogQuestion, resolveCatalogQuery } from '../../apps/web/src/lib/ask/catalog';
import { askInputSchema } from '../../apps/web/src/lib/ask/core';
import { answerQuestion } from '../../apps/web/src/lib/ask/orchestrate';
import { prepareConversation } from '../../apps/web/src/lib/ask/general-question';
import type { catalog } from '../../apps/web/src/lib/opportunities';
const job = {
  id: 'job-1',
  title: 'Customer Support Associate',
  organization: 'Example',
  category: 'jobs',
  location: 'Singapore',
  work_mode: 'remote',
  employment_type: 'Contract',
  expires_at: null,
  reward: 'USD 30000 / year',
  skills: ['Support'],
  excerpt: 'Answer customer questions and help resolve product problems.',
  source_url: 'https://example.com/careers/1',
  source_name: 'Example careers',
  source_id: 'example',
  published_at: '2026-10-20',
  last_seen_at: '2026-10-23',
  status: 'active',
};
function loader(data: unknown) {
  const paths: string[] = [];
  const load: typeof catalog = async <T>(path: string) => {
    paths.push(path);
    return data as T;
  };
  return { load, paths };
}

describe('live website copilot catalog retrieval', () => {
  it('extracts public role, country, arrangement and listed-pay filters without sending the sentence', async () => {
    const mock = loader({ items: [job], total: 1, page: 1, pages: 1 });
    const result = await answerCatalogQuestion(
      'Find remote customer support jobs in Singapore with salary listed',
      undefined,
      mock.load,
    );
    expect(result?.method).toBe('live-catalog-search');
    expect(mock.paths[0]).toContain('q=customer+support');
    expect(mock.paths[0]).toContain('location=Singapore');
    expect(mock.paths[0]).toContain('paid=1');
    expect(result?.catalog?.items[0]).toMatchObject({
      path: '/opportunities/job-1/',
      location: 'Singapore',
      reward: 'USD 30000 / year',
    });
    expect(result?.catalog?.browsePath).toContain('/opportunities/?');
  });
  it('retains role and country across several bounded filter follow-ups, and resets on a fresh query', () => {
    const first = resolveCatalogQuery('Find remote customer support jobs')!;
    const second = resolveCatalogQuery('Only in Singapore', first)!;
    const third = resolveCatalogQuery('What about contract roles?', second)!;
    expect(third).toMatchObject({
      q: 'customer support',
      location: 'Singapore',
      arrangement: 'Contract',
    });
    expect(resolveCatalogQuery('Show marketing jobs in UK', third)).toMatchObject({
      q: 'marketing',
      location: 'UK',
      arrangement: '',
    });
    expect(resolveCatalogQuery('Why is the sky blue?', third)).toBeNull();
  });
  it('distinguishes earning guides, unvalidated ideas, platforms and bounties', async () => {
    expect(resolveCatalogQuery('Show me paid research opportunities')).toMatchObject({
      kind: 'methods',
      q: 'research',
    });
    expect(resolveCatalogQuery('Suggest funny business ideas')).toMatchObject({
      kind: 'ideas',
      q: 'playful',
    });
    expect(resolveCatalogQuery('Find open-source bounties')).toMatchObject({ kind: 'bounties' });
    const mock = loader({
      items: [
        {
          id: 'research',
          title: 'Join paid research',
          category: 'Paid participation',
          description: 'Participate in research interviews.',
          first_step: 'Check eligibility with the provider.',
          source_name: 'Example research',
          source_url: 'https://example.com/research',
          check_status: 'reachable',
          last_checked: '2026-10-23',
        },
      ],
    });
    const answer = await answerCatalogQuestion(
      'Show me paid research opportunities',
      undefined,
      mock.load,
    );
    expect(answer?.catalog?.items).toHaveLength(1);
    expect(answer?.assumptions.join(' ')).toContain('not available paid assignments');
    expect(answer?.catalog?.items[0].path).toBe('/earn/research/');
    const platforms = loader({
      items: [
        {
          id: 'example',
          name: 'Example testing',
          description: 'Website testing platform',
          category: 'testing',
          url: 'https://example.com',
          eligibility: 'Provider rules',
          payment: 'Provider rules',
        },
      ],
    });
    expect(
      (await answerCatalogQuestion('Show earning platforms', undefined, platforms.load))?.catalog
        ?.items[0].sourceUrl,
    ).toBe('https://example.com');
  });
  it('does not invent opportunities on no results, outages or malformed data', async () => {
    for (const data of [{ items: [], total: 0, page: 1, pages: 0 }, null, { items: 'bad' }]) {
      const result = await answerCatalogQuestion('Find remote jobs', undefined, loader(data).load);
      expect(result?.catalog?.items).toEqual([]);
      expect(result?.mode).toBe(data && Array.isArray(data.items) ? 'answer' : 'fallback');
    }
  });
  it('never displays closed, expired or invalid-path records and never fetches credential queries', async () => {
    const mock = loader({
      items: [
        { ...job, status: 'closed' },
        { ...job, id: '../private' },
        { ...job, expires_at: '2020-01-01' },
      ],
      total: 3,
      page: 1,
      pages: 1,
    });
    expect(
      (await answerCatalogQuestion('Find remote jobs', undefined, mock.load))?.catalog?.items,
    ).toEqual([]);
    mock.paths.length = 0;
    expect(
      await answerCatalogQuestion('Find jobs for visitor@example.com', undefined, mock.load),
    ).toBeNull();
    expect(mock.paths).toEqual([]);
  });
  it('retains the exact configured budget and accepts only bounded conversation and filter fields', () => {
    const base = { question: 'Find remote jobs', token: 'a'.repeat(40) };
    expect(
      askInputSchema.safeParse({
        ...base,
        history: [{ question: 'Remote jobs', answer: 'Here are roles' }],
        context: { kind: 'jobs', q: 'support' },
      }).success,
    ).toBe(true);
    expect(
      askInputSchema.safeParse({
        ...base,
        history: Array(3).fill({ question: 'A job', answer: 'A role' }),
      }).success,
    ).toBe(false);
    expect(
      askInputSchema.safeParse({ ...base, context: { kind: 'jobs', url: 'https://evil.example' } })
        .success,
    ).toBe(false);
  });
});
describe('transient general follow-up context', () => {
  it('removes identifier-bearing turns and minimizes amounts in both questions and answers', () => {
    const history = prepareConversation([
      { question: 'My email is private@example.com', answer: 'Contact me' },
      { question: 'My income is $137823', answer: 'Your stated balance is $98000' },
    ]);
    expect(history).toHaveLength(1);
    expect(JSON.stringify(history)).not.toMatch(/137823|98000|private@example/);
  });
  it('passes bounded minimized history only to general generation, with no invented citations', async () => {
    const generate = vi.fn(async () => ({
      status: 'answered' as const,
      message: 'It scatters light.',
      preparedAt: '2026-10-23T00:00:00.000Z',
    }));
    const result = await answerQuestion(
      'Can you explain that more simply?',
      [],
      vi.fn(),
      generate,
      [{ question: 'Why is the sky blue?', answer: 'The atmosphere scatters light.' }],
    );
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        history: [{ question: 'Why is the sky blue?', answer: 'The atmosphere scatters light.' }],
      }),
    );
    expect(result.citations).toEqual([]);
    expect(result.assumptions.join(' ')).toContain('two recent');
  });
});

it('keeps personal financial values out of public search URLs and advances more-results requests', async () => {
  const mock = loader({ items: [], total: 0, page: 1, pages: 0 });
  await answerCatalogQuestion('I earn $137823 and want remote jobs', undefined, mock.load);
  expect(mock.paths.join(' ')).not.toContain('137823');
  const first = resolveCatalogQuery('Find remote customer support jobs')!;
  const more = resolveCatalogQuery('Show me more', first)!;
  expect(more.page).toBe(2);
  await answerCatalogQuestion('Show me more', first, mock.load);
  expect(mock.paths.at(-1)).toContain('page=2');
  expect(
    resolveCatalogQuery('Remove location', { ...first, location: 'Singapore' })?.location,
  ).toBe('');
});

it('keeps paid-research suggestions inside participation methods', async () => {
  const methods = loader({
    items: [
      {
        id: 'study',
        title: 'Join paid research',
        category: 'Paid participation',
        description: 'Participate in research interviews.',
        first_step: 'Check selection criteria.',
        source_name: 'Study provider',
        source_url: 'https://example.com',
        check_status: 'reachable',
      },
      {
        id: 'workbook',
        title: 'Publish workbooks',
        category: 'Creative products',
        description: 'Research a market for your workbook.',
        first_step: 'Research readers.',
        source_name: 'Publisher',
        source_url: 'https://example.com',
        check_status: 'reachable',
      },
    ],
  });
  const result = await answerCatalogQuestion(
    'Show paid research opportunities',
    undefined,
    methods.load,
  );
  expect(result?.catalog?.items.map((item) => item.path)).toEqual(['/earn/study/']);
});
