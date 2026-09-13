import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { tmpdir } from 'node:os';
import test from 'node:test';
import { datadogSite } from './config.mjs';
import { exportMetrics, metricPayload } from './metrics.mjs';
import { bitsTask, safeManualSpan, validateBitsAnswer, validateOperations } from './privacy.mjs';
import { runPrivateBitsTask, workflowExecutionStatus } from './bits.mjs';
import { requestJson } from './io.mjs';
import { configureManualApm, recordManualSpan } from './manual-apm.mjs';
import { denyBrowserRumEvent } from '../../deploy/datadog/rum-policy.mjs';

const now = Date.parse('2026-09-13T12:00:00Z');
const agentId = '11111111-1111-4111-8111-111111111111';
const workflowId = '22222222-2222-4222-8222-222222222222';
const instanceId = '33333333-3333-4333-8333-333333333333';
const aggregate = { day: '2026-09-13', counts: { ask_answer: 12, ask_error: 1 } };
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
              { name: 'userPrompt', value: '{{ Trigger.question }}' },
            ],
          },
        ],
        inputSchema: { parameters: [{ name: 'question', type: 'STRING' }] },
        outputSchema: { parameters: [{ name: 'answer', type: 'STRING' }] },
      },
    },
  },
};
const response = (data = {}, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const envBase = {
  DD_REGION: 'AP1',
  DD_API_KEY: 'fixture-api-key',
  DD_APP_KEY: 'fixture-app-key',
  DD_AGENT_ID: agentId,
  DD_BITS_WORKFLOW_ID: workflowId,
  DD_BITS_ENABLED: 'true',
  DD_BITS_WORKFLOW_REVIEWED: 'true',
  DD_BITS_BUDGET_CONFIRMED: 'true',
  DD_BITS_MAX_MONTHLY_RUNS: '2',
  DD_BITS_MONTHLY_CREDIT_BUDGET: '10',
  DD_BITS_RESERVED_CREDITS_PER_RUN: '5',
  DD_METRICS_ENABLED: 'true',
};
async function state(work) {
  const directory = await mkdtemp(path.join(tmpdir(), 'ig-observability-'));
  try {
    const operations = path.join(directory, 'operations');
    await mkdir(operations);
    const env = {
      ...envBase,
      OPERATIONS_DIRECTORY: operations,
      OBSERVABILITY_STATE_DIRECTORY: path.join(directory, 'private-state'),
    };
    await work(env);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('region aliases stay on the official site allowlist and conflicts fail closed', () => {
  assert.equal(datadogSite({ DD_REGION: 'AP1' }), 'ap1.datadoghq.com');
  assert.equal(datadogSite({ DD_REGION: 'ap1.datadoghq.com' }), 'ap1.datadoghq.com');
  assert.throws(() => datadogSite({ DD_SITE: 'api.attacker.example' }));
  assert.throws(() => datadogSite({ DD_SITE: 'datadoghq.com', DD_REGION: 'AP1' }));
});
test('counters reject unexpected data, invalid dates and arbitrary metric tags', () => {
  for (const value of [
    { ...aggregate, prompt: 'private question' },
    { ...aggregate, counts: { income: 137000 } },
    { ...aggregate, counts: { ask_answer: -1 } },
    { ...aggregate, day: '2026-02-30' },
  ])
    assert.throws(() => validateOperations(value));
  assert.throws(() =>
    metricPayload(aggregate, ['service:insightginie-web', 'url:/?income=137000'], now),
  );
  const body = metricPayload(aggregate, ['service:insightginie-web', 'env:production'], now);
  assert.equal(body.series.length, 13);
  assert(
    body.series.every(
      (series) => series.type === 3 && !series.tags.some((tag) => tag.startsWith('day:')),
    ),
  );
});
test('metrics are optional and never synthesize absent data', async () => {
  let calls = 0;
  assert.equal(
    (
      await exportMetrics({
        env: {},
        fetcher: () => {
          calls++;
        },
      })
    ).status,
    'disabled',
  );
  await state(async (env) =>
    assert.equal(
      (
        await exportMetrics({
          env,
          now: () => now,
          fetcher: () => {
            calls++;
          },
        })
      ).status,
      'no_data',
    ),
  );
  assert.equal(calls, 0);
});
test('metrics export retries once, persists rate limits and sends only reconstructed counters', async () =>
  state(async (env) => {
    await writeFile(
      path.join(env.OPERATIONS_DIRECTORY, '2026-09-13.json'),
      JSON.stringify(aggregate),
    );
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push({ url, options });
      return response({}, calls.length === 1 ? 503 : 202);
    };
    assert.equal(
      (await exportMetrics({ env, fetcher, now: () => now, sleep: async () => {} })).status,
      'delivered',
    );
    assert.equal(calls.length, 2);
    assert(calls.every(({ url }) => url === 'https://api.ap1.datadoghq.com/api/v2/series'));
    const body = JSON.parse(calls[0].options.body);
    assert.equal(body.series[0].points[0].value, 12);
    assert.equal(calls[0].options.headers['DD-API-KEY'], env.DD_API_KEY);
    assert.equal(calls[0].options.headers['DD-APPLICATION-KEY'], undefined);
    assert(!calls[0].options.body.includes('fixture-api-key'));
    assert.equal(
      (await exportMetrics({ env, fetcher, now: () => now + 1000 })).status,
      'rate_limited',
    );
    assert.equal(calls.length, 2);
    assert.equal(
      (await stat(path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'metrics-state.json'))).mode & 0o777,
      0o600,
    );
  }));
test('invalid source snapshots cannot make network calls', async () =>
  state(async (env) => {
    await writeFile(
      path.join(env.OPERATIONS_DIRECTORY, '2026-09-13.json'),
      JSON.stringify({ ...aggregate, cookie: 'private' }),
    );
    let called = false;
    await assert.rejects(
      exportMetrics({
        env,
        now: () => now,
        fetcher: () => {
          called = true;
        },
      }),
    );
    assert.equal(called, false);
  }));
test('transport caps responses, applies timeouts and discards raw provider errors', async () => {
  await assert.rejects(
    requestJson(
      async () => response({ data: 'x'.repeat(200) }),
      'https://api.ap1.datadoghq.com/test',
      {},
      { maxBytes: 30 },
    ),
    { code: 'response_too_large' },
  );
  await assert.rejects(
    requestJson(
      () => new Promise(() => {}),
      'https://api.ap1.datadoghq.com/test',
      {},
      { timeoutMs: 10 },
    ),
    { code: 'request_timeout' },
  );
  await assert.rejects(
    requestJson(
      async () => {
        throw new Error('secret key and question');
      },
      'https://api.ap1.datadoghq.com/test',
      {},
    ),
    { message: 'provider_request_failed' },
  );
});
test('private tasks reject arbitrary prompts even when disabled', async () => {
  assert.throws(() => bitsTask({ kind: 'synthetic-health', question: 'my income is private' }));
  await assert.rejects(
    runPrivateBitsTask({ kind: 'public-question', question: 'hello' }, { env: {} }),
  );
  assert.equal(
    (await runPrivateBitsTask({ kind: 'synthetic-health' }, { env: {} })).status,
    'disabled',
  );
});
test('workflow status reads the current machine field and rejects conflicting aliases', () => {
  assert.equal(
    workflowExecutionStatus({
      instanceStatus: { detailsKind: 'SUCCEEDED', displayName: 'Success' },
    }),
    'SUCCEEDED',
  );
  assert.equal(workflowExecutionStatus({ instanceStatus: 'RUNNING' }), 'RUNNING');
  assert.equal(workflowExecutionStatus({ status: 'PENDING' }), 'PENDING');
  assert.equal(
    workflowExecutionStatus({ instanceStatus: { detailsKind: 'CANCELED' }, status: 'CANCELLED' }),
    'CANCELED',
  );
  for (const value of [
    { instanceStatus: { displayName: 'Success' } },
    { instanceStatus: { detailsKind: 'SUCCEEDED' }, status: 'RUNNING' },
    { instanceStatus: { detailsKind: 'NOT_A_KNOWN_STATE' } },
    { instanceStatus: null, status: 'SUCCEEDED' },
    {},
  ])
    assert.throws(() => workflowExecutionStatus(value), { code: 'unknown_workflow_status' });
});
test('current API pending and success objects complete without unnecessary cancellation', async () =>
  state(async (env) => {
    const methods = [];
    let polls = 0;
    const fetcher = async (url, options) => {
      methods.push(options.method);
      if (url.endsWith(`/workflows/${workflowId}`)) return response(workflow);
      if (options.method === 'POST') return response({ data: { id: instanceId } });
      polls++;
      return response({
        data: {
          attributes: {
            instanceStatus: {
              detailsKind: polls === 1 ? 'IN_PROGRESS' : 'SUCCEEDED',
              displayName: 'Display label is not parsed',
            },
            ...(polls > 1 ? { outputs: { answer: 'INSIGHTGINIE_READY' } } : {}),
          },
        },
      });
    };
    const result = await runPrivateBitsTask(
      { kind: 'synthetic-health' },
      { env, fetcher, now: () => now, sleep: async () => {} },
    );
    assert.equal(result.status, 'succeeded');
    assert.equal(polls, 2);
    assert.equal(methods.filter((method) => method === 'POST').length, 1);
    assert.equal(methods.filter((method) => method === 'PUT').length, 0);
  }));
test('current API INSTANCE_ERROR is terminal and does not trigger cancellation', async () =>
  state(async (env) => {
    let canceled = false;
    const fetcher = async (url, options) => {
      if (url.endsWith(`/workflows/${workflowId}`)) return response(workflow);
      if (options.method === 'POST') return response({ data: { id: instanceId } });
      if (options.method === 'PUT') canceled = true;
      return response({
        data: {
          attributes: {
            instanceStatus: { detailsKind: 'INSTANCE_ERROR', displayName: 'Invalid inputs' },
          },
        },
      });
    };
    await assert.rejects(
      runPrivateBitsTask({ kind: 'synthetic-health' }, { env, fetcher, now: () => now }),
      { code: 'workflow_execution_failed' },
    );
    assert.equal(canceled, false);
  }));
for (const status of [200, 201])
  test(`private health accepts create HTTP ${status} and the verified outputs.answer contract`, async () =>
    state(async (env) => {
      const calls = [];
      const fetcher = async (url, options) => {
        calls.push({ url, options });
        if (url.endsWith(`/workflows/${workflowId}`)) return response(workflow);
        if (options.method === 'POST') return response({ data: { id: instanceId } }, status);
        return response({
          data: { attributes: { status: 'SUCCEEDED', outputs: { answer: 'INSIGHTGINIE_READY' } } },
        });
      };
      const result = await runPrivateBitsTask(
        { kind: 'synthetic-health' },
        { env, fetcher, now: () => now },
      );
      assert.deepEqual(result, { status: 'succeeded', result: { marker: 'INSIGHTGINIE_READY' } });
      assert.equal(calls.filter((call) => call.options.method === 'POST').length, 1);
      const budget = JSON.parse(
        await readFile(path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'bits-budget.json'), 'utf8'),
      );
      assert.equal(budget.reservedCredits, 5);
      assert.equal(budget.runs, 1);
      await assert.rejects(
        runPrivateBitsTask({ kind: 'synthetic-health' }, { env, fetcher, now: () => now + 1000 }),
        { code: 'private_execution_rate_limited' },
      );
    }));
test('credit reservations survive an ambiguous create failure; create is never retried', async () =>
  state(async (env) => {
    let creates = 0;
    const fetcher = async (_url, options) => {
      if (options.method === 'GET') return response(workflow);
      creates++;
      throw new Error('network dropped');
    };
    await assert.rejects(
      runPrivateBitsTask({ kind: 'synthetic-health' }, { env, fetcher, now: () => now }),
    );
    assert.equal(creates, 1);
    assert.equal(
      JSON.parse(
        await readFile(path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'bits-budget.json'), 'utf8'),
      ).reservedCredits,
      5,
    );
  }));
test('monthly run and credit caps stop further network calls and reset only in a later month', async () =>
  state(async (env) => {
    let calls = 0;
    const fetcher = async (url, options) => {
      calls++;
      if (url.endsWith(`/workflows/${workflowId}`)) return response(workflow);
      if (options.method === 'POST') return response({ data: { id: instanceId } });
      return response({
        data: { attributes: { status: 'SUCCEEDED', outputs: { answer: 'INSIGHTGINIE_READY' } } },
      });
    };
    for (const offset of [0, 60_000])
      await runPrivateBitsTask(
        { kind: 'synthetic-health' },
        { env, fetcher, now: () => now + offset },
      );
    const before = calls;
    // Each cap independently prevents creation before another workflow read.
    for (const overrides of [
      { DD_BITS_MONTHLY_CREDIT_BUDGET: '100' },
      { DD_BITS_MAX_MONTHLY_RUNS: '100' },
    ])
      await assert.rejects(
        runPrivateBitsTask(
          { kind: 'synthetic-health' },
          { env: { ...env, ...overrides }, fetcher, now: () => now + 120_000 },
        ),
        { code: 'credit_budget_exceeded' },
      );
    assert.equal(calls, before);
    await runPrivateBitsTask(
      { kind: 'synthetic-health' },
      { env, fetcher, now: () => Date.parse('2026-10-01T00:00:00Z') },
    );
    const ledger = JSON.parse(
      await readFile(path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'bits-budget.json'), 'utf8'),
    );
    assert.equal(ledger.month, '2026-10');
    assert.equal(ledger.runs, 1);
    assert.equal(ledger.reservedCredits, 5);
    await assert.rejects(
      runPrivateBitsTask({ kind: 'synthetic-health' }, { env, fetcher, now: () => now }),
    );
    assert.equal(calls, before + 3);
  }));
test('a concurrent private execution cannot race the persistent budget ledger', async () =>
  state(async (env) => {
    let releaseRead;
    let beganRead;
    const held = new Promise((resolve) => {
      releaseRead = resolve;
    });
    const began = new Promise((resolve) => {
      beganRead = resolve;
    });
    let creates = 0;
    const fetcher = async (url, options) => {
      if (url.endsWith(`/workflows/${workflowId}`)) {
        beganRead();
        await held;
        return response(workflow);
      }
      if (options.method === 'POST') {
        creates++;
        return response({ data: { id: instanceId } });
      }
      return response({
        data: { attributes: { status: 'SUCCEEDED', outputs: { answer: 'INSIGHTGINIE_READY' } } },
      });
    };
    const first = runPrivateBitsTask(
      { kind: 'synthetic-health' },
      { env, fetcher, now: () => now },
    );
    try {
      await began;
      await assert.rejects(
        runPrivateBitsTask({ kind: 'synthetic-health' }, { env, fetcher, now: () => now }),
        { code: 'operation_locked' },
      );
    } finally {
      releaseRead();
      await first;
    }
    assert.equal(creates, 1);
    const ledger = JSON.parse(
      await readFile(path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'bits-budget.json'), 'utf8'),
    );
    assert.equal(ledger.runs, 1);
    assert.equal(ledger.reservedCredits, 5);
  }));
test('poll deadlines cause one bounded cancellation', async () =>
  state(async (env) => {
    const methods = [];
    const fetcher = async (url, options) => {
      methods.push(options.method);
      if (url.endsWith(`/workflows/${workflowId}`)) return response(workflow);
      if (options.method === 'POST') return response({ data: { id: instanceId } });
      if (options.method === 'PUT') return response({});
      return response({ data: { attributes: { status: 'RUNNING' } } });
    };
    await assert.rejects(
      runPrivateBitsTask(
        { kind: 'synthetic-health' },
        { env, fetcher, now: () => now, sleep: async () => {}, deadlineMs: 20 },
      ),
      { code: 'workflow_deadline_exceeded' },
    );
    assert.equal(methods.filter((method) => method === 'POST').length, 1);
    assert.equal(methods.filter((method) => method === 'PUT').length, 1);
  }));
test('unreviewed workflows, missing budgets and unsafe model responses fail closed', async () =>
  state(async (env) => {
    let calls = 0;
    const fetcher = async () => {
      calls++;
      return response(workflow);
    };
    await assert.rejects(
      runPrivateBitsTask(
        { kind: 'synthetic-health' },
        { env: { ...env, DD_BITS_MONTHLY_CREDIT_BUDGET: '0' }, fetcher, now: () => now },
      ),
    );
    assert.equal(calls, 0);
    const wrong = structuredClone(workflow);
    wrong.data.attributes.spec.steps.push({ actionId: 'post-message' });
    await assert.rejects(
      runPrivateBitsTask(
        { kind: 'synthetic-health' },
        { env, fetcher: async () => response(wrong), now: () => now },
      ),
      { code: 'unreviewed_workflow_shape' },
    );
    assert.throws(() =>
      validateBitsAnswer(
        { kind: 'aggregate-triage' },
        JSON.stringify({
          severity: 'info',
          categories: [],
          nextChecks: ['no_action'],
          prompt: 'private',
        }),
      ),
    );
    assert.deepEqual(
      validateBitsAnswer(
        { kind: 'aggregate-triage' },
        JSON.stringify({
          severity: 'warning',
          categories: ['ask_error'],
          nextChecks: ['review_deployment'],
        }),
      ),
      { severity: 'warning', categories: ['ask_error'], nextChecks: ['review_deployment'] },
    );
  }));
test('manual tracing is optional and never accepts a request, raw error or financial value', () => {
  assert.throws(() =>
    safeManualSpan({
      category: 'ask',
      status: 'error',
      durationMs: 10,
      error: new Error('private'),
    }),
  );
  const tags = [];
  const tracer = {
    init() {
      throw new Error('must stay disabled');
    },
    startSpan(name, options) {
      tags.push({ name, options });
      return {
        setTag(key, value) {
          tags.push({ key, value });
        },
        finish() {},
      };
    },
  };
  assert.equal(configureManualApm(tracer, {}), undefined);
  recordManualSpan(tracer, { category: 'ask', status: 'error', durationMs: 12 }, now);
  assert(!JSON.stringify(tags).includes('private'));
  assert.equal(denyBrowserRumEvent({ message: 'private' }), false);
});
