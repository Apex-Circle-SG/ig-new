import { readdir, unlink } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

/** Keep today and the previous 29 UTC dates. Never recurse or follow symlinks. */
export async function pruneAnalytics(directory, now = new Date()) {
  if (!directory) return 0;
  if (!Number.isFinite(now.getTime())) throw new TypeError('Invalid maintenance date');
  const cutoff = new Date(now.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return 0;
    throw error;
  }
  let deleted = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^\d{4}-\d{2}-\d{2}\.json$/.test(entry.name)) continue;
    const day = entry.name.slice(0, 10);
    const date = new Date(`${day}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) continue;
    if (day >= cutoff) continue;
    try {
      await unlink(path.join(directory, entry.name));
      deleted += 1;
    } catch (error) {
      // The web collector may concurrently prune the same expired daily file.
      if (error.code !== 'ENOENT') throw error;
    }
  }
  return deleted;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await pruneAnalytics(process.env.ANALYTICS_DIRECTORY);
  } catch {
    console.error('Analytics retention maintenance failed.');
    process.exitCode = 1;
  }
}
