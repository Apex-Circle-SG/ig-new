import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { discover } from './discovery.mjs';

dotenv.config({ quiet: true });
const args = process.argv.slice(2);
let submit = false;
let receiptPath = 'docs/offsite-seo/latest-discovery-receipt.json';
for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  if (arg === '--submit') submit = true;
  else if (arg === '--dry-run') submit = false;
  else if (arg === '--receipt' && args[index + 1]) receiptPath = args[++index];
  else {
    console.error(
      'Usage: node scripts/seo/submit-discovery.mjs [--dry-run|--submit] [--receipt path.json]',
    );
    process.exit(2);
  }
}

const receipt = await discover({ submit });
const output = resolve(receiptPath);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
console.log(
  JSON.stringify(
    {
      mode: receipt.mode,
      validation: receipt.validation,
      reason: receipt.reason,
      urlCount: receipt.urlCount ?? 0,
      providers: receipt.providers,
      receipt: output,
    },
    null,
    2,
  ),
);
if (
  receipt.validation !== 'passed' ||
  receipt.providers.some((provider) => provider.status === 'failed')
)
  process.exitCode = 1;
