import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { unzipSync, zipSync, strFromU8, strToU8 } from 'fflate';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import {
  ingestCensusIncome,
  parseIncomeWorkbook,
  SOURCE_FILES,
  transformCensusIncome,
  sha256,
} from './census';

const retrievedAt = '2026-09-12T00:00:00.000Z';
const snapshot = getIndividualIncomeDistribution()!;
const rawDir = resolve(
  process.cwd(),
  'packages/datasets/data/raw',
  snapshot.datasetVersion.checksum,
);
const buffers: [Uint8Array, Uint8Array] = await Promise.all([
  readFile(resolve(rawDir, SOURCE_FILES[0].filename)),
  readFile(resolve(rawDir, SOURCE_FILES[1].filename)),
]);
const folders: string[] = [];
async function output() {
  const folder = await mkdtemp(resolve(tmpdir(), 'insightginie-ingest-'));
  folders.push(folder);
  return folder;
}
const download = async (url: string) =>
  buffers[SOURCE_FILES.findIndex((source) => source.url === url)];
afterEach(async () => {
  await Promise.all(
    folders.splice(0).map((folder) => rm(folder, { recursive: true, force: true })),
  );
});

function modifyWorkbook(bytes: Uint8Array, from: string, to: string): Uint8Array {
  const parts = unzipSync(bytes);
  let changed = false;
  for (const [name, part] of Object.entries(parts)) {
    if (!name.endsWith('.xml')) continue;
    const text = strFromU8(part);
    if (text.includes(from)) {
      parts[name] = strToU8(text.replace(from, to));
      changed = true;
    }
  }
  if (!changed) throw new Error('Test fixture alteration was not applied');
  return zipSync(parts);
}

describe('Census ingest transformation', () => {
  it('reproduces the committed distribution from original official XLSX bytes', () => {
    const result = transformCensusIncome(buffers, snapshot.datasetVersion.retrievedAt);
    expect(result).toEqual(snapshot);
    result.datasetVersion.artifacts.forEach((artifact, index) =>
      expect(artifact.checksum).toBe(sha256(buffers[index])),
    );
  });
  it('rejects HTML, malformed workbooks, wrong sex, changed years and changed units', () => {
    expect(() => parseIncomeWorkbook(strToU8('<html>key required</html>'), 'Males')).toThrow();
    expect(() => parseIncomeWorkbook(buffers[0], 'Females')).toThrow();
    expect(() =>
      parseIncomeWorkbook(modifyWorkbook(buffers[0], 'Females: 2024', 'Females: 2023'), 'Males'),
    ).toThrow();
    expect(() =>
      parseIncomeWorkbook(
        modifyWorkbook(buffers[0], 'Numbers in thousands.', 'Numbers in millions.'),
        'Males',
      ),
    ).toThrow();
  });
  it('rejects impossible 100x population changes and currency thresholds', () => {
    expect(() =>
      parseIncomeWorkbook(modifyWorkbook(buffers[0], '<v>17660</v>', '<v>1766000</v>'), 'Males'),
    ).toThrow();
    expect(() =>
      parseIncomeWorkbook(
        modifyWorkbook(buffers[0], '$2,500 to $4,999', '$250,000 to $499,999'),
        'Males',
      ),
    ).toThrow();
  });
});

describe('last-good publication', () => {
  it('refuses a concurrent publisher without touching its lock or published data', async () => {
    const outputDir = await output();
    await ingestCensusIncome({ outputDir, retrievedAt, download });
    const before = await readFile(resolve(outputDir, 'last-good.json'), 'utf8');
    await writeFile(resolve(outputDir, '.ingest.lock'), 'existing active publisher');
    await expect(ingestCensusIncome({ outputDir, retrievedAt, download })).rejects.toThrow();
    expect(await readFile(resolve(outputDir, 'last-good.json'), 'utf8')).toBe(before);
    expect(await readFile(resolve(outputDir, '.ingest.lock'), 'utf8')).toBe(
      'existing active publisher',
    );
  });
  it('publishes atomically then keeps bytes and first retrieval time on an identical ingest', async () => {
    const outputDir = await output();
    const first = await ingestCensusIncome({ outputDir, retrievedAt, download });
    expect(first.status).toBe('published');
    const manifest = await readFile(resolve(outputDir, 'last-good.json'), 'utf8');
    const repeated = await ingestCensusIncome({
      outputDir,
      retrievedAt: '2026-09-13T00:00:00.000Z',
      download,
    });
    expect(repeated.status).toBe('unchanged');
    expect(await readFile(resolve(outputDir, 'last-good.json'), 'utf8')).toBe(manifest);
    expect(await readdir(resolve(outputDir, 'versions'))).toHaveLength(1);
    expect((await readdir(outputDir)).filter((name) => name.endsWith('.tmp'))).toHaveLength(0);
  });
  it('preserves the prior manifest on download failure and records a sanitized error', async () => {
    const outputDir = await output();
    await ingestCensusIncome({ outputDir, retrievedAt, download });
    const before = await readFile(resolve(outputDir, 'last-good.json'), 'utf8');
    await expect(
      ingestCensusIncome({
        outputDir,
        retrievedAt,
        download: async () => {
          throw new Error('secret-token-do-not-log');
        },
      }),
    ).rejects.toThrow();
    expect(await readFile(resolve(outputDir, 'last-good.json'), 'utf8')).toBe(before);
    const logs = await Promise.all(
      (await readdir(resolve(outputDir, 'runs'))).map((name) =>
        readFile(resolve(outputDir, 'runs', name), 'utf8'),
      ),
    );
    expect(logs.join('')).toContain('failed');
    expect(logs.join('')).not.toContain('secret-token-do-not-log');
  });
  it('preserves the prior manifest when fresh source data fail validation', async () => {
    const outputDir = await output();
    await ingestCensusIncome({ outputDir, retrievedAt, download });
    const before = await readFile(resolve(outputDir, 'last-good.json'), 'utf8');
    await expect(
      ingestCensusIncome({
        outputDir,
        retrievedAt,
        download: async () => strToU8('Data unavailable'),
      }),
    ).rejects.toThrow();
    expect(await readFile(resolve(outputDir, 'last-good.json'), 'utf8')).toBe(before);
  });
});
