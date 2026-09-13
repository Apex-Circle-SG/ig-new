/** One explicit general-inference probe. No remote body, prompt or credential is logged. */
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'dotenv';
import { generateGeneralAnswer } from '../../apps/web/src/lib/ask/datadog';

if (!process.argv.includes('--execute')) {
  process.stdout.write('Use --execute for one authorized general-inference check.\n');
  process.exit(0);
}
const local = parse(await readFile('.env'));
const env: Record<string, string> = {};
for (const name of [
  'DD_REGION',
  'DD_API_KEY',
  'DD_APP_KEY',
  'DD_AGENT_ID',
  'DD_BITS_WORKFLOW_ID',
  'ASK_DATADOG_ENABLED',
  'ASK_DATADOG_GENERAL_ENABLED',
  'ASK_DATADOG_PUBLIC_AGENT_ID',
  'ASK_DATADOG_TOOL_FREE_AGENT_ID',
  'ASK_DATADOG_MAX_DAILY_RUNS',
  'ASK_DATADOG_MAX_MONTHLY_RUNS',
])
  if (local[name]) env[name] = local[name];
env.ASK_DATADOG_STATE_DIRECTORY = '/var/lib/insightginie/datadog-ask';
const calls: { operation: string; status: number }[] = [];
const fetcher: typeof fetch = async (url, options) => {
  const response = await fetch(url, options);
  calls.push({
    operation:
      options?.method === 'POST'
        ? 'create'
        : options?.method === 'PUT'
          ? 'cancel'
          : String(url).includes('/instances/')
            ? 'poll'
            : 'workflow-read',
    status: response.status,
  });
  return response;
};
const started = Date.now();
const result = await generateGeneralAnswer(
  { question: 'Explain what a JavaScript promise is in two sentences.' },
  { env, fetcher },
);
const answered = result.status === 'answered';
const relevant =
  answered &&
  /promise/i.test(result.message) &&
  /asynchron|eventual|future|pending/i.test(result.message);
const receipt = {
  checkedAt: new Date().toISOString(),
  status: relevant ? 'passed' : 'failed',
  mode: 'live-general-inference',
  topic: 'JavaScript promises',
  answered,
  relevant,
  messageLength: answered ? result.message.length : 0,
  reason: result.status === 'unavailable' ? result.reason : undefined,
  elapsedMs: Date.now() - started,
  calls,
  remoteBodyRecorded: false,
  credentialsRecorded: false,
  sharedProductionRunLedger: true,
  remoteToolIsolationVerified: false,
};
await writeFile(
  'docs/verification/ginie-open-topic-provider.json',
  JSON.stringify(receipt, null, 2) + '\n',
);
process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
if (!relevant) process.exitCode = 1;
