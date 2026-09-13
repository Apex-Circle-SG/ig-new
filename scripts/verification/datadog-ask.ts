/** Explicit, bounded verification against the configured workflow. Never prints keys or remote bodies. */
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parse } from 'dotenv';
import {
  selectPublicExcerpts,
  buildPublicSelectionPrompt,
} from '../../apps/web/src/lib/ask/datadog';
import { publicSelectionPacket } from '../../apps/web/src/lib/ask/orchestrate';
import { getAskKnowledge } from '../../apps/web/src/lib/ask/knowledge';

if (!process.argv.includes('--execute')) {
  process.stdout.write(
    'No remote execution. Use --execute only for an authorized bounded provider check.\n',
  );
  process.exit(0);
}
const local = parse(await readFile('.env'));
const env: Record<string, string> = {};
for (const key of ['DD_REGION', 'DD_API_KEY', 'DD_APP_KEY', 'DD_AGENT_ID', 'DD_BITS_WORKFLOW_ID'])
  if (local[key]) env[key] = local[key];
Object.assign(env, {
  ASK_DATADOG_ENABLED: 'true',
  ASK_DATADOG_STATE_DIRECTORY: '/var/lib/insightginie/datadog-ask',
  ASK_DATADOG_MAX_DAILY_RUNS: '20',
  ASK_DATADOG_MAX_MONTHLY_RUNS: '120',
});
const { packet } = publicSelectionPacket('How do I calculate cash runway?', getAskKnowledge());
const expected = buildPublicSelectionPrompt(packet);
const calls: { operation: string; status: number; stateField?: string; executionState?: string }[] =
  [];
let payloadVerified = false;
const fetcher: typeof fetch = async (url, options) => {
  const method = options?.method ?? 'GET';
  if (method === 'POST') {
    const body = JSON.parse(String(options?.body));
    if (body?.meta?.payload?.question !== expected) throw new Error('Unexpected provider packet');
    payloadVerified = true;
  }
  const response = await fetch(url, options);
  let stateField: string | undefined;
  let executionState: string | undefined;
  if (method === 'GET' && String(url).includes('/instances/')) {
    const data = await response
      .clone()
      .json()
      .catch(() => null);
    const attributes = data?.data?.attributes;
    stateField =
      attributes?.instanceStatus !== undefined
        ? 'instanceStatus'
        : attributes?.status !== undefined
          ? 'status'
          : 'absent';
    const status = attributes?.instanceStatus?.detailsKind ?? attributes?.status;
    executionState =
      typeof status === 'string' && /^[A-Z][A-Z_]{0,39}$/.test(status) ? status : 'unrecognized';
  }
  calls.push({
    operation:
      method === 'POST'
        ? 'create'
        : method === 'PUT'
          ? 'cancel'
          : String(url).includes('/instances/')
            ? 'poll'
            : 'workflow-read',
    status: response.status,
    ...(stateField ? { stateField, executionState } : {}),
  });
  return response;
};
const started = Date.now();
const result = await selectPublicExcerpts(packet, { env, fetcher });
const afterFirst = calls.length;
const cached =
  result.status === 'selected' ? await selectPublicExcerpts(packet, { env, fetcher }) : null;
const receipt = {
  checkedAt: new Date().toISOString(),
  status:
    result.status === 'selected' &&
    cached?.status === 'selected' &&
    cached.cached &&
    calls.length === afterFirst
      ? 'passed'
      : 'failed',
  provider: 'Datadog Workflow Automation / configured Agent Builder agent',
  input: 'Fixed public cash-runway explanations and formula category only',
  payloadVerified,
  privateQuestionOrValuesSent: false,
  credentialsRecorded: false,
  remoteBodiesRecorded: false,
  calls,
  elapsedMs: Date.now() - started,
  result,
  cacheRead: cached,
  cacheAdditionalRequests: calls.length - afterFirst,
  persistentRunBudget: { daily: 20, monthly: 120 },
  note: 'Run caps are not a monetary cap. This verifies source selection, not unrestricted chat or model-generated financial calculations.',
};
await mkdir('docs/verification', { recursive: true });
await writeFile(
  'docs/verification/datadog-ginie-execution.json',
  JSON.stringify(receipt, null, 2) + '\n',
);
process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
if (receipt.status !== 'passed') process.exitCode = 1;
