import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout } from 'node:timers/promises';
import {
  fetchPost,
  publishSnapshot,
  readLastGood,
  saveRaw,
  SourceRateLimitError,
  withSyncLock,
} from './core';

const args = process.argv.slice(2);
const value = (name: string, fallback: string) => {
  const i = args.indexOf(name);
  return i < 0 ? fallback : args[i + 1];
};
const root = resolve(value('--output', 'content/wordpress'));
const planPath = resolve(value('--plan', 'content/wordpress/pilot.json'));
const limit = Number(value('--limit', '2'));
const pauseMs = Number(value('--interval-ms', '1500'));
const refresh = args.includes('--refresh');
const publish = args.includes('--publish-preview');
if (
  !Number.isInteger(limit) ||
  limit < 1 ||
  limit > 100 ||
  !Number.isFinite(pauseMs) ||
  pauseMs < 1000
)
  throw new Error('Use limit 1–100 and interval at least 1000ms.');
const plan = JSON.parse(await readFile(planPath, 'utf8')) as {
  sourceOrigin: string;
  postIds: number[];
};
if (
  plan.sourceOrigin !== 'https://blog.insightginie.com' ||
  !Array.isArray(plan.postIds) ||
  plan.postIds.some((id) => !Number.isSafeInteger(id) || id <= 0) ||
  new Set(plan.postIds).size !== plan.postIds.length
)
  throw new Error('Invalid read-only WordPress plan.');

await withSyncLock(root, async () => {
  const current = await readLastGood(root);
  const records = new Map(current?.records.map((record) => [record.wpId, record]) ?? []);
  const requested = plan.postIds.filter((id) => refresh || !records.has(id)).slice(0, limit);
  const report: {
    startedAt: string;
    mode: string;
    planned: number;
    requested: number[];
    completed: number[];
    status: string;
    reason?: string;
    retryAfter?: string | null;
    versionId?: string;
    previewCount?: number;
  } = {
    startedAt: new Date().toISOString(),
    mode: publish ? 'publish-preview' : 'validate-only',
    planned: plan.postIds.length,
    requested,
    completed: [],
    status: 'running',
  };
  try {
    for (const [index, id] of requested.entries()) {
      if (index > 0) await setTimeout(pauseMs);
      const { raw, record } = await fetchPost(id);
      await saveRaw(root, raw);
      const previous = records.get(id);
      records.set(id, previous?.rawSha256 === record.rawSha256 ? previous : record);
      report.completed.push(id);
    }
    if (publish) {
      const result = await publishSnapshot(root, [...records.values()]);
      report.versionId = result.snapshot.versionId;
      report.previewCount = result.snapshot.records.length;
      report.status = result.changed ? 'preview_published' : 'unchanged';
    } else report.status = 'validated_not_published';
  } catch (error) {
    report.status = 'failed_last_good_retained';
    report.reason =
      error instanceof SourceRateLimitError ? error.message : 'source_fetch_or_validation_failed';
    if (error instanceof SourceRateLimitError) report.retryAfter = error.retryAfter;
    process.exitCode = 1;
  }
  await mkdir(join(root, 'runs'), { recursive: true });
  await writeFile(
    join(root, 'runs', `${report.startedAt.replace(/[:.]/g, '-')}.json`),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  console.log(JSON.stringify(report, null, 2));
});
