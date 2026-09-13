import path from 'node:path';
import {
  configuredUuid,
  datadogConfig,
  ObservabilityError,
  requiredPositiveInteger,
} from './config.mjs';
import { bitsTask, exactKeys, validateBitsAnswer } from './privacy.mjs';
import { atomicJson, readSmallJson, requestJson, withStateLock } from './io.mjs';

export function verifyWorkflow(payload, agentId) {
  const attributes = payload?.data?.attributes;
  const steps = attributes?.spec?.steps;
  if (
    attributes?.published !== true ||
    !Array.isArray(steps) ||
    steps.length !== 1 ||
    steps[0].actionId !== 'com.datadoghq.dd.bitsai.customagent.customAgentExecute'
  )
    throw new ObservabilityError('unreviewed_workflow_shape');
  const parameters = steps[0].parameters;
  if (
    !Array.isArray(parameters) ||
    parameters.find((parameter) => parameter.name === 'customAgentId')?.value !== agentId ||
    !parameters.some(
      (parameter) =>
        parameter.name === 'userPrompt' &&
        typeof parameter.value === 'string' &&
        parameter.value.includes('Trigger.question'),
    )
  )
    throw new ObservabilityError('workflow_agent_mismatch');
  const inputs = attributes.spec.inputSchema?.parameters;
  const outputs = attributes.spec.outputSchema?.parameters;
  if (
    !Array.isArray(inputs) ||
    !inputs.some((input) => input.name === 'question' && input.type === 'STRING') ||
    !Array.isArray(outputs) ||
    !outputs.some((output) => output.name === 'answer' && output.type === 'STRING')
  )
    throw new ObservabilityError('workflow_contract_mismatch');
}

/** Importable only by private server operations. There is deliberately no public endpoint or CLI loop. */
export async function runPrivateBitsTask(
  task,
  {
    env = process.env,
    fetcher = fetch,
    now = Date.now,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
    deadlineMs = 30_000,
    requestTimeoutMs = 5000,
  } = {},
) {
  const question = bitsTask(task); // Reject free text even when disabled.
  if (env.DD_BITS_ENABLED !== 'true') return { status: 'disabled' };
  if (env.DD_BITS_WORKFLOW_REVIEWED !== 'true' || env.DD_BITS_BUDGET_CONFIRMED !== 'true')
    throw new ObservabilityError('private_execution_not_reviewed');
  const config = datadogConfig(env, true);
  const agentId = configuredUuid(env.DD_BITS_AGENT_ID ?? env.DD_AGENT_ID, 'missing_bits_agent');
  if (env.DD_BITS_AGENT_ID && env.DD_AGENT_ID && env.DD_BITS_AGENT_ID !== env.DD_AGENT_ID)
    throw new ObservabilityError('conflicting_agent_configuration');
  const workflowId = configuredUuid(env.DD_BITS_WORKFLOW_ID, 'missing_bits_workflow');
  const runLimit = requiredPositiveInteger(
    env.DD_BITS_MAX_MONTHLY_RUNS,
    'missing_execution_budget',
    1000,
  );
  const creditLimit = requiredPositiveInteger(
    env.DD_BITS_MONTHLY_CREDIT_BUDGET,
    'missing_credit_budget',
  );
  const reservedPerRun = requiredPositiveInteger(
    env.DD_BITS_RESERVED_CREDITS_PER_RUN,
    'missing_credit_reservation',
  );
  if (reservedPerRun > creditLimit) throw new ObservabilityError('credit_budget_exceeded');
  const timeout = Math.max(1, Math.min(5000, requestTimeoutMs));
  const maxRuntime = Math.max(1, Math.min(30_000, deadlineMs));
  const base = `${config.origin}/api/v2/workflows/${workflowId}`;
  return withStateLock(env.OBSERVABILITY_STATE_DIRECTORY, 'bits', async () => {
    const timestamp = now();
    const month = new Date(timestamp).toISOString().slice(0, 7);
    const statePath = path.join(env.OBSERVABILITY_STATE_DIRECTORY, 'bits-budget.json');
    let budget = await readSmallJson(
      statePath,
      { month, runs: 0, reservedCredits: 0, lastAttemptAt: 0 },
      2048,
    );
    if (
      !exactKeys(budget, ['month', 'runs', 'reservedCredits', 'lastAttemptAt']) ||
      !/^\d{4}-\d{2}$/.test(budget.month) ||
      [budget.runs, budget.reservedCredits, budget.lastAttemptAt].some(
        (value) => !Number.isSafeInteger(value) || value < 0,
      )
    )
      throw new ObservabilityError('invalid_budget_state');
    if (timestamp - budget.lastAttemptAt < 60_000)
      throw new ObservabilityError('private_execution_rate_limited');
    if (budget.month > month) throw new ObservabilityError('budget_clock_regression');
    if (budget.month !== month)
      budget = { month, runs: 0, reservedCredits: 0, lastAttemptAt: budget.lastAttemptAt };
    if (budget.runs >= runLimit || budget.reservedCredits + reservedPerRun > creditLimit)
      throw new ObservabilityError('credit_budget_exceeded');
    const workflow = await requestJson(
      fetcher,
      base,
      { method: 'GET', headers: config.headers },
      { timeoutMs: timeout },
    );
    if (workflow.status !== 200) throw new ObservabilityError('workflow_read_failed');
    verifyWorkflow(workflow.data, agentId);
    // Reserve before POST; a timeout never refunds or retries an ambiguous execution.
    await atomicJson(statePath, {
      month,
      runs: budget.runs + 1,
      reservedCredits: budget.reservedCredits + reservedPerRun,
      lastAttemptAt: timestamp,
    });
    const started = Date.now();
    let instanceId;
    let terminal = false;
    try {
      const created = await requestJson(
        fetcher,
        `${base}/instances`,
        {
          method: 'POST',
          headers: config.headers,
          body: JSON.stringify({ meta: { payload: { question } } }),
        },
        { timeoutMs: timeout },
      );
      if (![200, 201].includes(created.status))
        throw new ObservabilityError('workflow_create_rejected');
      instanceId = configuredUuid(created.data?.data?.id, 'missing_workflow_instance');
      for (let poll = 0; poll < 15 && Date.now() - started < maxRuntime; poll++) {
        const remaining = maxRuntime - (Date.now() - started);
        const result = await requestJson(
          fetcher,
          `${base}/instances/${instanceId}`,
          { method: 'GET', headers: config.headers },
          { timeoutMs: Math.max(1, Math.min(timeout, remaining)) },
        );
        if (result.status !== 200) throw new ObservabilityError('workflow_result_failed');
        const state = result.data?.data?.attributes;
        if (state?.status === 'SUCCEEDED') {
          terminal = true;
          return { status: 'succeeded', result: validateBitsAnswer(task, state.outputs?.answer) };
        }
        if (['FAILED', 'CANCELED', 'CANCELLED', 'TIMED_OUT'].includes(state?.status)) {
          terminal = true;
          throw new ObservabilityError('workflow_execution_failed');
        }
        if (!['RUNNING', 'PENDING', 'QUEUED'].includes(state?.status))
          throw new ObservabilityError('unknown_workflow_status');
        await sleep(Math.min(1000, Math.max(0, maxRuntime - (Date.now() - started))));
      }
      throw new ObservabilityError('workflow_deadline_exceeded');
    } finally {
      if (instanceId && !terminal) {
        await requestJson(
          fetcher,
          `${base}/instances/${instanceId}/cancel`,
          { method: 'PUT', headers: config.headers },
          { timeoutMs: timeout },
        ).catch(() => undefined);
      }
    }
  });
}
