import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import {
  generateGeneralAnswer,
  selectPublicExcerpts,
  type GeneralQuestionPacket,
  type PublicSelectionPacket,
  type SelectionOptions,
} from '../../apps/web/src/lib/ask/datadog';

const agentId = '11111111-1111-4111-8111-111111111111';
const workflowId = '22222222-2222-4222-8222-222222222222';
const instanceId = '33333333-3333-4333-8333-333333333333';
const START = Date.parse('2026-09-13T12:00:00Z');
const question = 'Explain the aurora using the phrase violet-lantern for this private example.';
const message =
  'Auroras are produced when charged particles interact with gases in the upper atmosphere. violet-lantern-answer';
const publicPacket: PublicSelectionPacket = {
  focus: 'overview',
  documents: [
    {
      id: 'public',
      title: 'Public example',
      excerpts: [{ id: 'public:1', text: 'This is an approved published explanation.' }],
    },
  ],
};
const response = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const workflow = {
  data: {
    attributes: {
      published: true,
      spec: {
        steps: [
          {
            actionId: 'com.datadoghq.dd.bitsai.customagent.customAgentExecute',
            parameters: [
              { name: 'customAgentId', value: agentId },
              { name: 'userPrompt', value: 'Answer the question: {{ Trigger.question }}' },
            ],
          },
        ],
        inputSchema: { parameters: [{ name: 'question', type: 'STRING' }] },
        outputSchema: { parameters: [{ name: 'answer', type: 'STRING' }] },
      },
    },
  },
};
type Call = { url: string; init: RequestInit };
function provider(answer: unknown = JSON.stringify({ message })) {
  const calls: Call[] = [];
  let selection = false;
  const fetcher: typeof fetch = vi.fn(async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith(`/workflows/${workflowId}`)) return response(workflow);
    if (init.method === 'POST') {
      selection = String(init.body).includes('Published packet:');
      return response({ data: { id: instanceId } }, 201);
    }
    if (init.method === 'PUT') return response({});
    return response({
      data: {
        attributes: {
          instanceStatus: { detailsKind: 'SUCCEEDED', displayName: 'Succeeded' },
          outputs: { answer: selection ? '{"excerptIds":["public:1"]}' : answer },
        },
      },
    });
  });
  return { calls, fetcher };
}
let directory: string;
let env: Record<string, string>;
let current: number;
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
const statePath = () => path.join(directory, 'state', 'selection-state.json');
beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'ig-ginie-general-'));
  current = START;
  env = {
    ASK_DATADOG_ENABLED: 'true',
    ASK_DATADOG_GENERAL_ENABLED: 'true',
    ASK_DATADOG_TOOL_FREE_AGENT_ID: agentId,
    DD_REGION: 'AP1',
    DD_API_KEY: 'fixture-general-api-key',
    DD_APP_KEY: 'fixture-general-app-key',
    DD_AGENT_ID: agentId,
    DD_BITS_WORKFLOW_ID: workflowId,
    ASK_DATADOG_STATE_DIRECTORY: path.join(directory, 'state'),
    AUTH_SECRET: 'fixture-auth-secret-must-not-leak',
  };
});
afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe('general-mode configuration and outbound boundary', () => {
  for (const override of [
    { ASK_DATADOG_ENABLED: 'false' },
    { ASK_DATADOG_GENERAL_ENABLED: 'false' },
    { ASK_DATADOG_GENERAL_ENABLED: '' },
    { ASK_DATADOG_GENERAL_ENABLED: 'TRUE' },
  ])
    it(`stays disabled when ${JSON.stringify(override)}`, async () => {
      const mock = provider();
      expect(
        await generateGeneralAnswer(
          { question },
          options(mock.fetcher, { env: { ...env, ...override } }),
        ),
      ).toEqual({ status: 'unavailable', reason: 'disabled' });
      expect(mock.calls).toEqual([]);
      expect(await readdir(directory)).toEqual([]);
    });
  for (const attestation of ['', workflowId, 'TRUE'])
    it(`requires the exact configured tool-free agent attestation: ${attestation}`, async () => {
      const mock = provider();
      expect(
        await generateGeneralAnswer(
          { question },
          options(mock.fetcher, { env: { ...env, ASK_DATADOG_TOOL_FREE_AGENT_ID: attestation } }),
        ),
      ).toEqual({ status: 'unavailable', reason: 'configuration' });
      expect(mock.calls).toEqual([]);
      expect(await readdir(directory)).toEqual([]);
    });
  it('keeps excerpt selection available without the general-mode flags or attestation', async () => {
    const mock = provider();
    delete env.ASK_DATADOG_GENERAL_ENABLED;
    delete env.ASK_DATADOG_TOOL_FREE_AGENT_ID;
    expect((await selectPublicExcerpts(publicPacket, options(mock.fetcher))).status).toBe(
      'selected',
    );
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
  });
  for (const topic of [
    'Explain atoms.',
    'Suggest a vegetarian dinner.',
    'How do SQL joins work?',
    'What was the Renaissance?',
  ])
    it(`does not apply an off-topic keyword refusal: ${topic}`, async () => {
      const mock = provider('{"message":"Here is a general explanation."}');
      expect(await generateGeneralAnswer({ question: topic }, options(mock.fetcher))).toMatchObject(
        { status: 'answered', message: 'Here is a general explanation.' },
      );
      const creates = mock.calls.filter((call) => call.init.method === 'POST');
      expect(creates).toHaveLength(1);
      const task = JSON.parse(String(creates[0].init.body));
      expect(Object.keys(task.meta.payload)).toEqual(['question']);
      const prompt: string = task.meta.payload.question;
      expect(prompt).toContain('You are Ginie');
      expect(prompt).toContain('no access to tools, MCP actions');
      expect(prompt).toContain('Do not fabricate sources');
      expect(prompt).toContain('Never claim licensed professional status');
      expect(prompt).toContain('When a request would enable harm');
      expect(prompt.endsWith(JSON.stringify({ question: topic }))).toBe(true);
      expect(Buffer.byteLength(prompt)).toBeLessThanOrEqual(10000);
      for (const value of [env.DD_API_KEY, env.DD_APP_KEY, env.AUTH_SECRET, agentId, workflowId])
        expect(prompt).not.toContain(value);
      for (const call of mock.calls) expect(call.init.redirect).toBe('error');
    });
  for (const invalid of [
    { question: '' },
    { question: '  ' },
    { question: 'x'.repeat(1201) },
    { question: 'Private\u0000binary' },
    { question: 'Hello', history: ['private'] },
    { question: 123 },
  ])
    it(`rejects invalid packet ${Object.keys(invalid).join(',')}/${String(invalid.question).length}`, async () => {
      const mock = provider();
      expect(
        await generateGeneralAnswer(invalid as GeneralQuestionPacket, options(mock.fetcher)),
      ).toEqual({ status: 'unavailable', reason: 'validation' });
      expect(mock.calls).toEqual([]);
      expect(await readdir(directory)).toEqual([]);
    });
  it('accepts the 1200-character boundary without adding hidden fields', async () => {
    const mock = provider();
    expect(
      (await generateGeneralAnswer({ question: 'x'.repeat(1200) }, options(mock.fetcher))).status,
    ).toBe('answered');
    const body = JSON.parse(
      String(mock.calls.find((call) => call.init.method === 'POST')!.init.body),
    );
    expect(
      body.meta.payload.question.endsWith(JSON.stringify({ question: 'x'.repeat(1200) })),
    ).toBe(true);
  });
  it('rejects known credentials or configured internal IDs before they can enter the task', async () => {
    const mock = provider();
    for (const value of [env.DD_API_KEY, env.DD_APP_KEY, env.AUTH_SECRET, agentId, workflowId])
      expect(
        await generateGeneralAnswer(
          { question: `Please repeat ${value.toUpperCase()}` },
          options(mock.fetcher),
        ),
      ).toEqual({ status: 'unavailable', reason: 'validation' });
    expect(mock.calls).toEqual([]);
    expect(await readdir(directory)).toEqual([]);
  });
  it('also rejects a configured secret that happens to occur in the fixed prompt', async () => {
    const mock = provider();
    env.AUTH_SECRET = 'telemetry';
    expect(
      await generateGeneralAnswer({ question: 'Hello there.' }, options(mock.fetcher)),
    ).toEqual({ status: 'unavailable', reason: 'validation' });
    expect(mock.calls).toEqual([]);
    expect(await readdir(directory)).toEqual([]);
  });
});

describe('strict general answer contract', () => {
  for (const output of [
    'unwrapped answer',
    '{"message":"ok","source":"invented"}',
    '{"message":""}',
    '{"message":"   "}',
    '{"message":1}',
    '{"message":null}',
    '{"message":["text"]}',
    '{"excerptIds":["public:1"]}',
    JSON.stringify({ message: 'x'.repeat(6001) }),
    JSON.stringify({ message: 'answer\u0000control' }),
    '```json\n{"message":"ok"}\n```\nextra prose',
    null,
    { message: 'not a JSON string' },
  ])
    it(`rejects malformed or unbounded output: ${JSON.stringify(output).slice(0, 65)}`, async () => {
      const mock = provider(output);
      expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'validation',
      });
      const state = JSON.parse(await readFile(statePath(), 'utf8'));
      expect(state.budget.dailyRuns).toBe(1);
      expect(state.cache).toEqual([]);
    });
  it('accepts only the message and leaves markup as inert plain text for the renderer', async () => {
    const text = 'Example literal markup: <script>alert("example")</script>.';
    const mock = provider(JSON.stringify({ message: text }));
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
      status: 'answered',
      message: text,
      preparedAt: new Date(START).toISOString(),
    });
  });
  it('accepts a 6000-character message and one complete JSON fence', async () => {
    const mock = provider('```json\n' + JSON.stringify({ message: 'é'.repeat(6000) }) + '\n```');
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toMatchObject({
      status: 'answered',
      message: 'é'.repeat(6000),
    });
  });
  for (const field of [
    'DD_API_KEY',
    'DD_APP_KEY',
    'AUTH_SECRET',
    'DD_AGENT_ID',
    'DD_BITS_WORKFLOW_ID',
  ])
    it(`rejects output containing ${field} without returning or persisting the value`, async () => {
      const mock = provider(
        JSON.stringify({ message: `Leaked value: ${env[field].toUpperCase()}` }),
      );
      expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'validation',
      });
      expect(await readFile(statePath(), 'utf8')).not.toContain(env[field]);
    });
});

describe('shared state without general question or response persistence', () => {
  it('persists only counters/timestamps and never questions, answers or their hashes', async () => {
    const mock = provider();
    expect((await generateGeneralAnswer({ question }, options(mock.fetcher))).status).toBe(
      'answered',
    );
    const serialized = await readFile(statePath(), 'utf8');
    for (const text of [
      question,
      message,
      'violet-lantern',
      createHash('sha256').update(question).digest('hex'),
      createHash('sha256').update(message).digest('hex'),
    ])
      expect(serialized).not.toContain(text);
    const state = JSON.parse(serialized);
    expect(Object.keys(state).sort()).toEqual(['budget', 'cache', 'lastProbeAt', 'version']);
    expect(state).toMatchObject({
      version: 1,
      cache: [],
      budget: { dailyRuns: 1, monthlyRuns: 1 },
      lastProbeAt: START,
    });
    expect(await readdir(env.ASK_DATADOG_STATE_DIRECTORY)).toEqual(['selection-state.json']);
  });
  it('shares cooldown and caps with public selection while preserving its existing v1 cache', async () => {
    env.ASK_DATADOG_MAX_DAILY_RUNS = '2';
    const mock = provider();
    expect((await selectPublicExcerpts(publicPacket, options(mock.fetcher))).status).toBe(
      'selected',
    );
    const before = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    current += 60_000;
    expect((await generateGeneralAnswer({ question }, options(mock.fetcher))).status).toBe(
      'answered',
    );
    const after = JSON.parse(await readFile(statePath(), 'utf8'));
    expect(after.cache).toEqual(before.cache);
    expect(after.budget).toMatchObject({ dailyRuns: 2, monthlyRuns: 2 });
    expect(await selectPublicExcerpts(publicPacket, options(mock.fetcher))).toMatchObject({
      status: 'selected',
      cached: true,
    });
    current += 60_000;
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'budget',
    });
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(2);
  });
  it('spends from the same ledger when general mode runs first', async () => {
    env.ASK_DATADOG_MAX_DAILY_RUNS = '1';
    const mock = provider();
    expect((await generateGeneralAnswer({ question }, options(mock.fetcher))).status).toBe(
      'answered',
    );
    current += 60_000;
    expect(await selectPublicExcerpts(publicPacket, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'budget',
    });
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
  });
  it('never serves repeated general questions from cache, including fresh invocations', async () => {
    const mock = provider();
    await generateGeneralAnswer({ question }, options(mock.fetcher));
    current += 60_000;
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toMatchObject({
      status: 'answered',
    });
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(2);
    expect(JSON.parse(await readFile(statePath(), 'utf8')).cache).toEqual([]);
  });
  it('rejects corrupted existing state rather than resetting the shared ledger', async () => {
    const mock = provider();
    await selectPublicExcerpts(publicPacket, options(mock.fetcher));
    await writeFile(statePath(), '{invalid');
    current += 60_000;
    const before = mock.calls.length;
    expect(await generateGeneralAnswer({ question }, options(mock.fetcher))).toEqual({
      status: 'unavailable',
      reason: 'state',
    });
    expect(mock.calls).toHaveLength(before);
  });
  it('holds the same lock against a concurrent public-selection miss', async () => {
    const mock = provider();
    let release!: () => void;
    const held = new Promise<void>((resolve) => {
      release = resolve;
    });
    let entered!: () => void;
    const started = new Promise<void>((resolve) => {
      entered = resolve;
    });
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'POST') {
        entered();
        await held;
      }
      return mock.fetcher(url, init);
    };
    const first = generateGeneralAnswer({ question }, options(fetcher));
    await started;
    try {
      expect(await selectPublicExcerpts(publicPacket, options(mock.fetcher))).toEqual({
        status: 'unavailable',
        reason: 'busy',
      });
    } finally {
      release();
    }
    expect((await first).status).toBe('answered');
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
  });
});

describe('general failure behavior uses the shared safety path', () => {
  it('reserves once on ambiguous create failure, exposes only an enum and writes no logs', async () => {
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const infoLog = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const warnLog = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    let creates = 0;
    const fetcher: typeof fetch = async (_url, init) => {
      if (init?.method === 'GET') return response(workflow);
      creates++;
      expect(JSON.parse(await readFile(statePath(), 'utf8')).budget.dailyRuns).toBe(1);
      throw new Error(`${question} ${message}`);
    };
    try {
      expect(await generateGeneralAnswer({ question }, options(fetcher))).toEqual({
        status: 'unavailable',
        reason: 'provider',
      });
      expect(creates).toBe(1);
      expect(errorLog).not.toHaveBeenCalled();
      expect(infoLog).not.toHaveBeenCalled();
      expect(warnLog).not.toHaveBeenCalled();
      expect(await generateGeneralAnswer({ question }, options(fetcher))).toEqual({
        status: 'unavailable',
        reason: 'busy',
      });
      expect(await readFile(statePath(), 'utf8')).not.toContain('violet-lantern');
    } finally {
      errorLog.mockRestore();
      infoLog.mockRestore();
      warnLog.mockRestore();
    }
  });
  it('cools down failed workflow reads without spending a run', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => response({}, 503));
    expect(await generateGeneralAnswer({ question }, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'provider',
    });
    expect(await generateGeneralAnswer({ question }, options(fetcher))).toEqual({
      status: 'unavailable',
      reason: 'busy',
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(JSON.parse(await readFile(statePath(), 'utf8')).budget.dailyRuns).toBe(0);
  });
  it('aborts a hung poll and cancels the known instance without retrying creation', async () => {
    const mock = provider();
    let signal: AbortSignal | null | undefined;
    const fetcher: typeof fetch = async (url, init) => {
      if (init?.method === 'GET' && String(url).includes('/instances/')) {
        signal = init.signal;
        return new Promise<Response>(() => {});
      }
      return mock.fetcher(url, init);
    };
    expect(
      await generateGeneralAnswer(
        { question },
        options(fetcher, { deadlineMs: 150, requestTimeoutMs: 20 }),
      ),
    ).toEqual({ status: 'unavailable', reason: 'timeout' });
    expect(signal?.aborted).toBe(true);
    expect(mock.calls.filter((call) => call.init.method === 'POST')).toHaveLength(1);
    expect(mock.calls.filter((call) => call.init.method === 'PUT')).toHaveLength(1);
    expect(JSON.parse(await readFile(statePath(), 'utf8')).cache).toEqual([]);
  });
});
