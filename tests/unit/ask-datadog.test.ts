import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  mkdtemp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  symlink,
  writeFile,
  chmod,
} from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  buildPublicSelectionPrompt,
  selectPublicExcerpts,
  type PublicSelectionPacket,
  type SelectionOptions,
} from '../../apps/web/src/lib/ask/datadog';

const agentId = '11111111-1111-4111-8111-111111111111';
const workflowId = '22222222-2222-4222-8222-222222222222';
const instanceId = '33333333-3333-4333-8333-333333333333';
const START = Date.parse('2026-09-13T12:00:00Z');
const packet: PublicSelectionPacket = {
  focus: 'formula',
  documents: [
    {
      id: 'cash-runway',
      title: 'Cash runway',
      excerpts: [
        { id: 'cash-runway:1', text: 'Monthly net cash burn is expenses minus revenue.' },
        { id: 'cash-runway:2', text: 'Divide spendable cash by positive monthly net cash burn.' },
      ],
    },
  ],
};
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const workflow = () => ({
  data: {
    attributes: {
      published: true,
      spec: {
        steps: [
          {
            actionId: 'com.datadoghq.dd.bitsai.customagent.customAgentExecute',
            parameters: [
              { name: 'customAgentId', value: agentId },
              { name: 'userPrompt', value: '{{ Trigger.question }}' },
            ],
          },
        ],
        inputSchema: { parameters: [{ name: 'question', type: 'STRING' }] },
        outputSchema: { parameters: [{ name: 'answer', type: 'STRING' }] },
      },
    },
  },
});
type Call = { url: string; init: RequestInit };
function provider(
  overrides: {
    answer?: unknown;
    status?: string;
    createStatus?: number;
    definition?: ReturnType<typeof workflow>;
  } = {},
) {
  const calls: Call[] = [];
  const fetcher: typeof fetch = vi.fn(async (url, init) => {
    const call = { url: String(url), init: init ?? {} };
    calls.push(call);
    if (call.url.endsWith(`/workflows/${workflowId}`))
      return response(overrides.definition ?? workflow());
    if (call.init.method === 'POST')
      return response({ data: { id: instanceId } }, overrides.createStatus ?? 201);
    if (call.init.method === 'PUT') return response({});
    return response({
      data: {
        attributes: {
          instanceStatus: {
            detailsKind: overrides.status ?? 'SUCCEEDED',
            displayName: 'Cosmetic label ignored',
          },
          outputs: { answer: overrides.answer ?? '{"excerptIds":["cash-runway:2"]}' },
        },
      },
    });
  });
  return { fetcher, calls };
}
let directory: string;
let current: number;
let env: Record<string, string>;
const options = (
  fetcher: typeof fetch,
  extra: Partial<SelectionOptions> = {},
): SelectionOptions => ({
  env,
  fetcher,
  now: () => current,
  sleep: async (ms) => {
    current += Math.ceil(ms);
  },
  ...extra,
});
const statePath = () => path.join(directory, 'private', 'selection-state.json');
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'ig-ask-datadog-'));
  current = START;
  env = {
    ASK_DATADOG_ENABLED: 'true',
    DD_REGION: 'AP1',
    DD_API_KEY: 'fixture-api-key',
    DD_APP_KEY: 'fixture-app-key',
    DD_AGENT_ID: agentId,
    DD_BITS_WORKFLOW_ID: workflowId,
    ASK_DATADOG_STATE_DIRECTORY: path.join(directory, 'private'),
  };
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('public packet and strict selected IDs', () => {
  it('accepts the public packet only and sends no arbitrary caller fields', async () => {
    const prompt = buildPublicSelectionPrompt(packet);
    expect(prompt).toContain('You are Ginie');
    expect(prompt).toContain('Do not use tools, access telemetry');
    expect(prompt.endsWith(JSON.stringify(packet))).toBe(true);
    const extra = { ...packet, question: 'private question must not leave' };
    expect(() => buildPublicSelectionPrompt(extra)).toThrow('validation');
    const mock = provider();
    expect(await selectPublicExcerpts(extra, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'validation',
    });
    expect(mock.calls).toEqual([]);
  });
  it('bounds document/excerpt counts, UTF-8 bytes, duplicate IDs and extra nested keys', () => {
    const invalid = [
      { ...packet, focus: 'private question' },
      { ...packet, documents: Array(4).fill(packet.documents[0]) },
      { ...packet, documents: [packet.documents[0], packet.documents[0]] },
      {
        ...packet,
        documents: [
          { ...packet.documents[0], excerpts: Array(25).fill(packet.documents[0].excerpts[0]) },
        ],
      },
      {
        ...packet,
        documents: [
          {
            ...packet.documents[0],
            excerpts: [packet.documents[0].excerpts[0], packet.documents[0].excerpts[0]],
          },
        ],
      },
      {
        ...packet,
        documents: [
          {
            ...packet.documents[0],
            excerpts: Array.from({ length: 4 }, (_, i) => ({
              id: `e:${i}`,
              text: 'é'.repeat(2500),
            })),
          },
        ],
      },
      { ...packet, documents: [{ ...packet.documents[0], privateData: 'never send' }] },
    ];
    for (const value of invalid)
      expect(() => buildPublicSelectionPrompt(value as PublicSelectionPacket)).toThrow(
        'validation',
      );
  });
  for (const answer of [
    'The answer is 45%.',
    '{"excerptIds":["unpublished:1"]}',
    '{"excerptIds":["cash-runway:1"],"text":"invented advice"}',
    '{"excerptIds":[]}',
    '{"excerptIds":["cash-runway:1","cash-runway:1"]}',
    '{"excerptIds":[1]}',
    'Here is JSON: {"excerptIds":["cash-runway:1"]}',
    '```json\n{"excerptIds":["cash-runway:1"]}\n```\nAnother statement',
    JSON.stringify({ excerptIds: Array.from({ length: 5 }, (_, i) => `e:${i}`) }),
  ])
    it(`rejects output outside the excerpt-ID contract: ${answer.slice(0, 50)}`, async () => {
      const mock = provider({ answer });
      expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'validation',
      });
      expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
      expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(0);
    });
  for (const createStatus of [200, 201])
    it(`executes exactly once for HTTP ${createStatus}, accepts one JSON fence, and persists no prose`, async () => {
      const mock = provider({
        createStatus,
        answer: '```json\n{"excerptIds":["cash-runway:1","cash-runway:2"]}\n```',
      });
      const result = await selectPublicExcerpts(packet, options(mock.fetcher));
      expect(result).toEqual({
        status: 'selected',
        excerptIds: ['cash-runway:1', 'cash-runway:2'],
        cached: false,
        preparedAt: new Date(START).toISOString(),
      });
      const creates = mock.calls.filter((call) => call.init.method === 'POST');
      expect(creates).toHaveLength(1);
      expect(mock.calls[0].url).toBe(
        `https://api.ap1.datadoghq.com/api/v2/workflows/${workflowId}`,
      );
      expect(JSON.parse(String(creates[0].init.body))).toEqual({
        meta: { payload: { question: buildPublicSelectionPrompt(packet) } },
      });
      for (const call of mock.calls) expect(call.init.redirect).toBe('error');
      const contents = await readFile(statePath(), 'utf8');
      expect(contents).not.toContain('Monthly net cash burn');
      expect(contents).not.toContain('fixture-api-key');
      expect(contents).not.toContain(workflowId);
      expect((await stat(env.ASK_DATADOG_STATE_DIRECTORY)).mode & 0o777).toBe(0o700);
      expect((await stat(statePath())).mode & 0o777).toBe(0o600);
      expect(await readdir(env.ASK_DATADOG_STATE_DIRECTORY)).toEqual(['selection-state.json']);
    });
});

describe('configuration and workflow validation', () => {
  it('disabled and missing configuration do not call Datadog', async () => {
    const mock = provider();
    expect(await selectPublicExcerpts(packet, options(mock.fetcher, { env: {} }))).toEqual({
      status: 'unavailable',
      reason: 'disabled',
    });
    expect(
      await selectPublicExcerpts(
        packet,
        options(mock.fetcher, { env: { ASK_DATADOG_ENABLED: 'true' } }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'configuration' });
    expect(mock.calls).toEqual([]);
  });
  for (const override of [
    { DD_REGION: 'https://attacker.example' },
    { DD_SITE: 'datadoghq.com' },
    { DD_AGENT_ID: '../another-agent' },
    { DD_APP_KEY: '' },
    { ASK_DATADOG_MAX_DAILY_RUNS: '101' },
    { ASK_DATADOG_MAX_MONTHLY_RUNS: '1001' },
    { ASK_DATADOG_MAX_DAILY_RUNS: '-1' },
    { ASK_DATADOG_STATE_DIRECTORY: './relative' },
  ])
    it(`rejects invalid config: ${Object.keys(override)[0]}=${Object.values(override)[0]}`, async () => {
      const mock = provider();
      expect(
        await selectPublicExcerpts(packet, options(mock.fetcher, { env: { ...env, ...override } })),
      ).toEqual({ status: 'unavailable', reason: 'configuration' });
      expect(mock.calls).toEqual([]);
    });
  it('accepts bounded static text around one question binding', async () => {
    const definition = workflow();
    definition.data.attributes.spec.steps[0].parameters[1].value =
      'Select from the following published excerpts.\n{{ Trigger.question }}\nReturn JSON only.';
    const mock = provider({ definition });
    expect((await selectPublicExcerpts(packet, options(mock.fetcher))).status).toBe('selected');
  });
  it('persists the miss cooldown even when workflow validation fails without consuming a run', async () => {
    const definition = workflow();
    definition.data.attributes.published = false;
    const mock = provider({ definition });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'validation',
    });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    expect(mock.calls).toHaveLength(1);
    const state = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(state.budget.dailyRuns).toBe(0);
    expect(state.lastProbeAt).toBe(START);
    current += 60_000;
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'validation',
    });
    expect(mock.calls).toHaveLength(2);
  });
  for (const change of [
    'unpublished',
    'extra-step',
    'wrong-agent',
    'wrong-binding',
    'extra-binding',
    'conversation',
    'wrong-input',
    'wrong-output',
  ])
    it(`does not execute a ${change} workflow`, async () => {
      const definition = workflow();
      const spec = definition.data.attributes.spec;
      if (change === 'unpublished') definition.data.attributes.published = false;
      if (change === 'extra-step') spec.steps.push(spec.steps[0]);
      if (change === 'wrong-agent') spec.steps[0].parameters[0].value = workflowId;
      if (change === 'wrong-binding') spec.steps[0].parameters[1].value = 'Trigger.question';
      if (change === 'extra-binding')
        spec.steps[0].parameters[1].value = '{{ Trigger.question }} {{ Steps.private.result }}';
      if (change === 'conversation')
        spec.steps[0].parameters.push({ name: 'conversationId', value: 'old-session' });
      if (change === 'wrong-input') spec.inputSchema.parameters[0].type = 'OBJECT';
      if (change === 'wrong-output') spec.outputSchema.parameters[0].name = 'privateAccount';
      const mock = provider({ definition });
      expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'validation',
      });
      expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(0);
    });
});

describe('durable caps, cache and private state', () => {
  it('returns a cache hit after a fresh invocation without rechecking or spending', async () => {
    const mock = provider();
    expect((await selectPublicExcerpts(packet, options(mock.fetcher))).status).toBe('selected');
    const never = vi.fn<typeof fetch>(async () => {
      throw new Error('Cache must not fetch');
    });
    const cached = await selectPublicExcerpts(
      packet,
      options(never, {
        env: { ...env, ASK_DATADOG_MAX_DAILY_RUNS: '0', ASK_DATADOG_MAX_MONTHLY_RUNS: '0' },
      }),
    );
    expect(cached).toMatchObject({
      status: 'selected',
      cached: true,
      excerptIds: ['cash-runway:2'],
    });
    expect(never).not.toHaveBeenCalled();
  });
  it('invalidates changed focus, changed text, workflow or agent and the 14-day expiry', async () => {
    const mock = provider();
    await selectPublicExcerpts(packet, options(mock.fetcher));
    for (const changed of [
      { ...packet, focus: 'example' as const },
      { ...packet, documents: [{ ...packet.documents[0], title: 'Revised public title' }] },
      {
        ...packet,
        documents: [
          {
            ...packet.documents[0],
            excerpts: packet.documents[0].excerpts.map((excerpt) => ({
              ...excerpt,
              text: `${excerpt.text} Revised public methodology.`,
            })),
          },
        ],
      },
    ]) {
      current += 60_000;
      expect(await selectPublicExcerpts(changed, options(mock.fetcher))).toMatchObject({
        status: 'selected',
        cached: false,
      });
    }
    const before = mock.calls.length;
    current += 60_000;
    expect(
      await selectPublicExcerpts(
        packet,
        options(mock.fetcher, { env: { ...env, DD_AGENT_ID: instanceId } }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'validation' });
    expect(mock.calls.length).toBe(before + 1);
    current += 60_000;
    expect(
      await selectPublicExcerpts(
        packet,
        options(mock.fetcher, { env: { ...env, DD_BITS_WORKFLOW_ID: instanceId } }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'validation' });
    current = START + 14 * 24 * 60 * 60_000;
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toMatchObject({
      status: 'selected',
      cached: false,
    });
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(5);
  });
  it('keeps the prior budget consistent when a workflow GET fails after UTC rollover', async () => {
    const mock = provider();
    await selectPublicExcerpts(packet, options(mock.fetcher));
    current = Date.parse('2026-09-14T00:00:00Z');
    const other = { ...packet, focus: 'overview' as const };
    const rejected: typeof fetch = async () => response({}, 503);
    expect(await selectPublicExcerpts(other, options(rejected))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
    const state = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(state.budget.day).toBe('2026-09-13');
    expect(state.budget.lastAttemptAt).toBe(START);
    expect(state.lastProbeAt).toBe(current);
    current += 60_000;
    expect(await selectPublicExcerpts(other, options(mock.fetcher))).toMatchObject({
      status: 'selected',
      cached: false,
    });
    const after = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(after.budget).toMatchObject({ day: '2026-09-14', dailyRuns: 1, monthlyRuns: 2 });
  });
  it('enforces daily/monthly run caps across invocations and UTC resets', async () => {
    env.ASK_DATADOG_MAX_DAILY_RUNS = '1';
    env.ASK_DATADOG_MAX_MONTHLY_RUNS = '2';
    const mock = provider();
    await selectPublicExcerpts(packet, options(mock.fetcher));
    const second = { ...packet, focus: 'example' as const };
    current += 60_000;
    expect(await selectPublicExcerpts(second, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'budget',
    });
    current = Date.parse('2026-09-14T00:00:00Z');
    expect((await selectPublicExcerpts(second, options(mock.fetcher))).status).toBe('selected');
    const third = { ...packet, focus: 'assumptions' as const };
    current = Date.parse('2026-09-15T00:00:00Z');
    expect(await selectPublicExcerpts(third, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'budget',
    });
    current = Date.parse('2026-10-01T00:00:00Z');
    expect((await selectPublicExcerpts(third, options(mock.fetcher))).status).toBe('selected');
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(3);
  });
  it('reserves before an ambiguous POST failure, never refunds/retries, and spaces misses', async () => {
    let creates = 0;
    const fetcher: typeof fetch = async (_url, init) => {
      if (init?.method === 'GET') return response(workflow());
      creates++;
      const state = JSON.parse(await readFile(statePath(), 'utf8'));
      expect(state.budget.dailyRuns).toBe(1);
      throw new Error('ambiguous transport failure');
    };
    expect(await selectPublicExcerpts(packet, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
    expect(creates).toBe(1);
    expect(await selectPublicExcerpts(packet, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    current += 60_000;
    env.ASK_DATADOG_MAX_DAILY_RUNS = '1';
    expect(await selectPublicExcerpts(packet, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'budget',
    });
    expect(creates).toBe(1);
  });
  it('bounds cache entries to 64 and evicts old entries', async () => {
    env.ASK_DATADOG_MAX_DAILY_RUNS = '100';
    const mock = provider();
    for (let index = 0; index < 65; index++) {
      const changed = {
        ...packet,
        documents: [{ ...packet.documents[0], title: `Public revision ${index}` }],
      };
      expect((await selectPublicExcerpts(changed, options(mock.fetcher))).status).toBe('selected');
      current += 60_000;
    }
    const state = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(state.cache).toHaveLength(64);
    expect(state.budget.dailyRuns).toBe(65);
    const first = {
      ...packet,
      documents: [{ ...packet.documents[0], title: 'Public revision 0' }],
    };
    expect(await selectPublicExcerpts(first, options(mock.fetcher))).toMatchObject({
      status: 'selected',
      cached: false,
    });
  });
  for (const kind of ['json', 'permissions', 'unknown-id', 'future-clock'])
    it(`fails closed on ${kind} state corruption`, async () => {
      const mock = provider();
      await selectPublicExcerpts(packet, options(mock.fetcher));
      if (kind === 'json') await writeFile(statePath(), '{broken');
      if (kind === 'permissions') await chmod(statePath(), 0o644);
      if (kind === 'unknown-id') {
        const state = JSON.parse(await readFile(statePath(), 'utf8'));
        state.cache[0].excerptIds = ['not-published:1'];
        await writeFile(statePath(), JSON.stringify(state));
      }
      if (kind === 'future-clock') current = START - 1;
      const before = mock.calls.length;
      expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'state',
      });
      expect(mock.calls).toHaveLength(before);
    });
  it('does not follow state symlinks and leaves a stale lock closed', async () => {
    await mkdir(env.ASK_DATADOG_STATE_DIRECTORY, { mode: 0o700 });
    await writeFile(path.join(directory, 'private-target'), '{}', { mode: 0o600 });
    await symlink(path.join(directory, 'private-target'), statePath());
    const mock = provider();
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'state',
    });
    await rm(statePath());
    await writeFile(path.join(env.ASK_DATADOG_STATE_DIRECTORY, '.selection.lock'), '', {
      mode: 0o600,
    });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    expect(mock.calls).toEqual([]);
  });
  it('refuses concurrent misses without a second provider execution', async () => {
    let release!: () => void;
    const pending = new Promise<void>((resolve) => {
      release = resolve;
    });
    const mock = provider();
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'POST') {
        entered();
        await pending;
      }
      return mock.fetcher(url, init);
    };
    const first = selectPublicExcerpts(packet, options(fetcher));
    await started;
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    release();
    expect((await first).status).toBe('selected');
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
  });
});

describe('bounded workflow polling and cancellation', () => {
  it('follows actual IN_PROGRESS to SUCCEEDED detailsKind and ignores cosmetic displayName', async () => {
    const mock = provider();
    let polls = 0;
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'GET' && String(url).includes('/instances/')) {
        polls++;
        return response({
          data: {
            attributes: {
              instanceStatus: {
                detailsKind: polls === 1 ? 'IN_PROGRESS' : 'SUCCEEDED',
                displayName: 'Ignored prose',
              },
              ...(polls === 1 ? {} : { outputs: { answer: '{"excerptIds":["cash-runway:2"]}' } }),
            },
          },
        });
      }
      return mock.fetcher(url, init);
    };
    expect(await selectPublicExcerpts(packet, options(fetcher))).toMatchObject({
      status: 'selected',
      excerptIds: ['cash-runway:2'],
    });
    expect(polls).toBe(2);
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(0);
  });
  for (const statusFields of [
    { status: 'SUCCEEDED' },
    { instanceStatus: 'SUCCEEDED' },
    { instanceStatus: { detailsKind: 'SUCCEEDED' }, status: 'SUCCEEDED' },
  ])
    it(`accepts unambiguous status compatibility: ${JSON.stringify(statusFields)}`, async () => {
      const mock = provider();
      const fetcher: typeof fetch = async (url, init) => {
        if (init?.method === 'GET' && String(url).includes('/instances/'))
          return response({
            data: {
              attributes: {
                ...statusFields,
                outputs: { answer: '{"excerptIds":["cash-runway:1"]}' },
              },
            },
          });
        return mock.fetcher(url, init);
      };
      expect(await selectPublicExcerpts(packet, options(fetcher))).toMatchObject({
        status: 'selected',
        excerptIds: ['cash-runway:1'],
      });
    });
  it('rejects conflicting actual and legacy statuses and cancels the known instance', async () => {
    const mock = provider();
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'GET' && String(url).includes('/instances/'))
        return response({
          data: {
            attributes: {
              instanceStatus: { detailsKind: 'RUNNING' },
              status: 'SUCCEEDED',
              outputs: { answer: '{"excerptIds":["cash-runway:1"]}' },
            },
          },
        });
      return mock.fetcher(url, init);
    };
    expect(await selectPublicExcerpts(packet, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'validation',
    });
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(1);
  });
  it('treats observed INSTANCE_ERROR as terminal without attempting cancellation', async () => {
    const mock = provider({ status: 'INSTANCE_ERROR' });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(0);
  });
  it('polls at most 20 times and cancels a known unfinished instance within the overall budget', async () => {
    const mock = provider({ status: 'IN_PROGRESS' });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'timeout',
    });
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
    expect(
      mock.calls.filter((call) => call.init.method === 'GET' && call.url.includes('/instances/')),
    ).toHaveLength(20);
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(1);
    expect(current - START).toBeLessThanOrEqual(25_000);
  });
  it('aborts a hung request and still attempts cancellation with reserved time', async () => {
    const mock = provider();
    let hungSignal: AbortSignal | null | undefined;
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'GET' && String(url).includes('/instances/')) {
        hungSignal = init.signal;
        return new Promise<Response>(() => {});
      }
      return mock.fetcher(url, init);
    };
    const start = performance.now();
    expect(
      await selectPublicExcerpts(
        packet,
        options(fetcher, { deadlineMs: 150, requestTimeoutMs: 20 }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'timeout' });
    expect(hungSignal?.aborted).toBe(true);
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(1);
    expect(performance.now() - start).toBeLessThan(250);
  });
  it('counts time used by reads and cancels before the 25-second deadline', async () => {
    const mock = provider({ status: 'RUNNING' });
    const fetcher: typeof fetch = async (url, init) => {
      const result = await mock.fetcher(url, init);
      current += 3000;
      return result;
    };
    expect(await selectPublicExcerpts(packet, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'timeout',
    });
    expect(current - START).toBeLessThanOrEqual(25_000);
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(1);
  });
  it('keeps cancellation inside the total deadline even when both poll and cancel hang', async () => {
    const mock = provider();
    const cancellationSignals: AbortSignal[] = [];
    const fetcher: typeof fetch = async (url, init) => {
      if (String(url).includes(`/instances/${instanceId}`)) {
        if (init?.method === 'PUT') cancellationSignals.push(init.signal!);
        return new Promise<Response>(() => {});
      }
      return mock.fetcher(url, init);
    };
    const start = performance.now();
    expect(
      await selectPublicExcerpts(
        packet,
        options(fetcher, { deadlineMs: 80, requestTimeoutMs: 5000 }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'timeout' });
    expect(cancellationSignals).toHaveLength(1);
    expect(cancellationSignals[0].aborted).toBe(true);
    expect(performance.now() - start).toBeLessThan(180);
  });
  it('does not cancel a terminal failed run and rejects oversized response bodies', async () => {
    const mock = provider({ status: 'FAILED' });
    expect(await selectPublicExcerpts(packet, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(0);
    current += 60_000;
    const oversized: typeof fetch = async () => response({ padding: 'x'.repeat(70000) });
    expect(await selectPublicExcerpts(packet, options(oversized))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
  });
});
