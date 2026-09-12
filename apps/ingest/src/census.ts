import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';
import { strFromU8, unzipSync } from 'fflate';
import {
  incomeDistributionSchema,
  type IncomeBracket,
  type IncomeDistribution,
} from '@insightginie/schema';

export const INCOME_YEAR = 2024;
export const SURVEY_YEAR = 2025;
export const TRANSFORMATION_VERSION = 'cps-pinc11-v1';
export const SOURCE_PAGE =
  'https://www.census.gov/data/tables/time-series/demo/income-poverty/cps-pinc/pinc-11.2024.html';
export const SOURCE_FILES = [
  {
    name: 'CPS PINC-11 male income distribution',
    filename: 'pinc11_1.xlsx',
    sex: 'Males',
    url: 'https://www2.census.gov/programs-surveys/cps/tables/pinc-11/2025/pinc11_1.xlsx',
  },
  {
    name: 'CPS PINC-11 female income distribution',
    filename: 'pinc11_2.xlsx',
    sex: 'Females',
    url: 'https://www2.census.gov/programs-surveys/cps/tables/pinc-11/2025/pinc11_2.xlsx',
  },
] as const;

export const sha256 = (bytes: Uint8Array | string) =>
  createHash('sha256').update(bytes).digest('hex');
const plainObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const array = (value: unknown): unknown[] =>
  value === undefined ? [] : Array.isArray(value) ? value : [value];
const textValue = (value: unknown): string =>
  typeof value === 'string' ? value : String(plainObject(value)['#text'] ?? '');

/** Read only the two approved worksheet parts; reject formulas and oversized ZIP members. */
export function readCensusWorkbook(bytes: Uint8Array): Map<string, string> {
  if (bytes.length > 1_000_000 || bytes[0] !== 0x50 || bytes[1] !== 0x4b)
    throw new Error('Unexpected Census workbook format or size');
  const wanted = ['xl/sharedStrings.xml', 'xl/worksheets/sheet1.xml'];
  const parts = unzipSync(bytes, {
    filter: (file) => {
      if (!wanted.includes(file.name)) return false;
      if (file.originalSize > 4_000_000) throw new Error('Oversized Census worksheet');
      return true;
    },
  });
  const parser = new XMLParser({
    ignoreAttributes: false,
    parseTagValue: false,
    parseAttributeValue: false,
    trimValues: false,
    processEntities: true,
  });
  const parsePart = (name: string) => {
    if (!parts[name]) throw new Error(`Missing workbook part: ${name}`);
    const xml = strFromU8(parts[name]);
    if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new Error('XML declarations are not permitted');
    return plainObject(parser.parse(xml));
  };
  const shared = array(plainObject(parsePart(wanted[0]).sst).si).map((item) => {
    const obj = plainObject(item);
    return obj.t !== undefined
      ? textValue(obj.t)
      : array(obj.r)
          .map((run) => textValue(plainObject(run).t))
          .join('');
  });
  const rows = array(plainObject(plainObject(parsePart(wanted[1]).worksheet).sheetData).row);
  const cells = new Map<string, string>();
  for (const row of rows)
    for (const rawCell of array(plainObject(row).c)) {
      const cell = plainObject(rawCell);
      const address = String(cell['@_r']);
      if (cell.f !== undefined) throw new Error('Formula found in Census data');
      if (cells.has(address)) throw new Error('Duplicate worksheet cell');
      if (cell.v === undefined) continue;
      const value = String(cell.v);
      if (cell['@_t'] === 's') {
        const index = Number(value);
        if (!Number.isInteger(index) || shared[index] === undefined)
          throw new Error('Invalid shared string');
        cells.set(address, shared[index]);
      } else cells.set(address, value);
    }
  return cells;
}

function requireCell(cells: Map<string, string>, address: string, expected: string) {
  if (cells.get(address) !== expected) throw new Error(`Census schema changed at ${address}`);
}

function estimatedPeople(cells: Map<string, string>, address: string) {
  const value = cells.get(address);
  if (!value || !/^\d+(\.\d+)?$/.test(value))
    throw new Error(`Missing or nonnumeric Census estimate at ${address}`);
  const count = Number(value) * 1000;
  if (!Number.isSafeInteger(count) || count < 0 || count > 500_000_000)
    throw new Error(`Census estimate out of range at ${address}`);
  return count;
}

export function parseIncomeWorkbook(bytes: Uint8Array, sex: 'Males' | 'Females') {
  const cells = readCensusWorkbook(bytes);
  requireCell(
    cells,
    'A2',
    `PINC-11. Income Distribution to $250,000 or More for Males and Females: ${INCOME_YEAR}`,
  );
  requireCell(
    cells,
    'A4',
    `Source: U.S. Census Bureau, Current Population Survey, ${SURVEY_YEAR} Annual Social and Economic Supplement (CPS ASEC).`,
  );
  requireCell(cells, 'A7', `Income of ${sex}`);
  requireCell(cells, 'B8', 'All races');
  requireCell(cells, 'B9', 'Number');
  requireCell(cells, 'A10', '....Total');
  if (!cells.get('A5')?.includes('Numbers in thousands. People 15 years old and over'))
    throw new Error('Census population or units changed');
  if (!cells.get('A6')?.includes('includes people with no income and negative values'))
    throw new Error('Census lower-tail definition changed');
  const brackets: IncomeBracket[] = [];
  for (let row = 11; row <= 54; row++) {
    const label = cells.get(`A${row}`);
    if (!label) throw new Error('Missing income bracket');
    const closed = /^\$([\d,]+) to \$([\d,]+)$/.exec(label);
    let lower: number | null;
    let upper: number | null;
    if (row === 11 && label === 'Under $2,500') {
      lower = null;
      upper = 2500;
    } else if (row === 54 && label === '$250,000 and over') {
      lower = 250000;
      upper = null;
    } else if (closed) {
      lower = Number(closed[1].replaceAll(',', ''));
      upper = Number(closed[2].replaceAll(',', '')) + 1;
    } else throw new Error('Unrecognized Census income bracket');
    // Expected widths are independently pinned, so a 100x currency scaling fails.
    const expectedLower = row <= 50 ? (row - 11) * 2500 : 100000 + (row - 51) * 50000;
    if (row !== 11 && lower !== expectedLower)
      throw new Error('Unexpected Census income thresholds');
    const expectedUpper =
      row < 50 ? (row - 10) * 2500 : row < 54 ? 100000 + (row - 50) * 50000 : null;
    if (upper !== (row === 50 ? 100000 : expectedUpper))
      throw new Error('Unexpected Census income bracket width');
    brackets.push({ lower, upper, count: estimatedPeople(cells, `B${row}`), label });
  }
  const total = estimatedPeople(cells, 'B10');
  const sum = brackets.reduce((value, bin) => value + bin.count, 0);
  if (total < 100_000_000 || total > 200_000_000 || Math.abs(sum - total) / total > 0.005)
    throw new Error('Census row totals failed validation');
  return { total, brackets };
}

export function transformCensusIncome(
  workbooks: readonly [Uint8Array, Uint8Array],
  retrievedAt: string,
): IncomeDistribution {
  const male = parseIncomeWorkbook(workbooks[0], 'Males');
  const female = parseIncomeWorkbook(workbooks[1], 'Females');
  const brackets = male.brackets.map((bin, index) => {
    const other = female.brackets[index];
    if (bin.lower !== other.lower || bin.upper !== other.upper || bin.label !== other.label)
      throw new Error('Male/female income brackets do not match');
    return { ...bin, count: bin.count + other.count };
  });
  const checksum = sha256(Buffer.concat(workbooks));
  const id = `census-cps-asec-${SURVEY_YEAR}-pinc11-us-${checksum.slice(0, 16)}-v1`;
  const universe = `US people age 15 and over as of March ${SURVEY_YEAR}, including people with no income or negative income`;
  const populationLabel = 'US people age 15 and over';
  return incomeDistributionSchema.parse({
    id,
    geography: { id: '0100000US', name: 'United States', type: 'nation' },
    universe,
    populationLabel,
    measure: 'individual-total-money-income',
    currency: 'USD',
    total: brackets.reduce((sum, bin) => sum + bin.count, 0),
    sourceReportedTotal: male.total + female.total,
    brackets,
    datasetVersion: {
      id,
      sourceName: 'US Census Bureau · CPS ASEC · PINC-11',
      sourceUrl: SOURCE_PAGE,
      year: INCOME_YEAR,
      surveyYear: SURVEY_YEAR,
      retrievedAt,
      transformationVersion: TRANSFORMATION_VERSION,
      refreshCadence: 'annual',
      validationStatus: 'validated',
      checksum,
      universe,
      populationLabel,
      artifacts: SOURCE_FILES.map((source, index) => ({
        name: source.name,
        sourceUrl: source.url,
        checksum: sha256(workbooks[index]),
        bytes: workbooks[index].byteLength,
      })),
    },
    assumptions: [
      'Money income includes wages, self-employment, interest, and other cash income before taxes. Capital gains and noncash benefits are excluded.',
      'The all-race male and female published counts are combined. Counts are survey estimates, published in thousands and rounded for disclosure protection.',
      'Percentiles use the sum of the published bracket estimates as their denominator; publication rounding means this differs slightly from the separately published total.',
      'This national comparison includes part-time workers, nonworkers, students, and retirees; it is not a comparison only with full-time workers.',
    ],
  });
}

type Download = (url: string) => Promise<Uint8Array>;
export async function downloadCensusFile(url: string): Promise<Uint8Array> {
  if (!SOURCE_FILES.some((source) => source.url === url))
    throw new Error('Unapproved Census source URL');
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000), redirect: 'error' });
  if (!response.ok) throw new Error(`Census download failed: HTTP ${response.status}`);
  if (Number(response.headers.get('content-length') ?? 0) > 1_000_000)
    throw new Error('Census download exceeds size limit');
  if (!response.body) throw new Error('Empty Census response');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1_000_000) throw new Error('Census download exceeds size limit');
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks);
}

async function atomicJson(path: string, value: unknown) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
  await rename(temporary, path);
}

export type IngestOptions = { outputDir: string; retrievedAt: string; download?: Download };
export async function ingestCensusIncome({
  outputDir,
  retrievedAt,
  download = downloadCensusFile,
}: IngestOptions) {
  const runId = randomUUID();
  const manifestPath = resolve(outputDir, 'last-good.json');
  await mkdir(resolve(outputDir, 'runs'), { recursive: true });
  const lockPath = resolve(outputDir, '.ingest.lock');
  // Concurrent writers must not race the last-good pointer. A crash leaves a
  // visible lock for an operator to clear after checking no ingest is running.
  await writeFile(lockPath, JSON.stringify({ runId, retrievedAt }), { flag: 'wx' });
  try {
    const buffers = (await Promise.all(SOURCE_FILES.map((source) => download(source.url)))) as [
      Uint8Array,
      Uint8Array,
    ];
    const rawChecksum = sha256(Buffer.concat(buffers));
    const rawDir = resolve(outputDir, 'raw', rawChecksum);
    await mkdir(rawDir, { recursive: true });
    for (const [index, source] of SOURCE_FILES.entries())
      await writeFile(resolve(rawDir, source.filename), buffers[index]);
    // Archive before parsing. The checksum allows investigation of rejected inputs.
    const distribution = transformCensusIncome(buffers, retrievedAt);
    let previous: IncomeDistribution | undefined;
    try {
      previous = incomeDistributionSchema.parse(
        JSON.parse(await readFile(manifestPath, 'utf8')).distribution,
      );
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT')
        previous = undefined;
      else throw new Error('Existing last-good manifest is invalid; restore it before ingesting');
    }
    if (
      previous?.datasetVersion.checksum === distribution.datasetVersion.checksum &&
      previous.datasetVersion.transformationVersion === TRANSFORMATION_VERSION
    ) {
      await atomicJson(resolve(outputDir, 'runs', `${runId}.json`), {
        runId,
        status: 'unchanged',
        at: retrievedAt,
        datasetVersion: previous.datasetVersion.id,
      });
      return { status: 'unchanged' as const, distribution: previous };
    }
    if (
      previous &&
      (distribution.total / previous.total < 0.8 || distribution.total / previous.total > 1.2)
    )
      throw new Error('Population changed more than 20%; manual data review required');
    const versionPath = resolve(outputDir, 'versions', `${distribution.id}.json`);
    // Immutable version is created before the single atomic last-good promotion.
    await mkdir(dirname(versionPath), { recursive: true });
    try {
      await writeFile(versionPath, `${JSON.stringify(distribution, null, 2)}\n`, { flag: 'wx' });
    } catch (error) {
      if (!(error && typeof error === 'object' && 'code' in error && error.code === 'EEXIST'))
        throw error;
      const archived = incomeDistributionSchema.parse(
        JSON.parse(await readFile(versionPath, 'utf8')),
      );
      if (archived.datasetVersion.checksum !== distribution.datasetVersion.checksum)
        throw new Error('Immutable version collision');
      distribution.datasetVersion.retrievedAt = archived.datasetVersion.retrievedAt;
    }
    await atomicJson(resolve(outputDir, 'runs', `${runId}.json`), {
      runId,
      status: 'published',
      at: retrievedAt,
      datasetVersion: distribution.id,
    });
    await atomicJson(manifestPath, {
      versionId: distribution.id,
      checksum: distribution.datasetVersion.checksum,
      distribution,
    });
    return { status: 'published' as const, distribution };
  } catch (error) {
    // Do not persist arbitrary exception strings: upstream clients may include secrets.
    await atomicJson(resolve(outputDir, 'runs', `${runId}.json`), {
      runId,
      status: 'failed',
      at: retrievedAt,
      reason: 'Download, transformation, or validation failed. Last-good preserved.',
    });
    throw error;
  } finally {
    await unlink(lockPath);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const outputDir = resolve(process.cwd(), 'packages/datasets/data');
  ingestCensusIncome({ outputDir, retrievedAt: new Date().toISOString() })
    .then(({ status, distribution }) =>
      process.stdout.write(
        `${status}: ${distribution.id}; ${distribution.brackets.length} brackets; ${distribution.total} estimated people\n`,
      ),
    )
    .catch(() => {
      process.stderr.write(
        'Census ingest failed. The last-good dataset was preserved; inspect source availability and validation.\n',
      );
      process.exitCode = 1;
    });
}
