import snapshotInput from '../../../../../content/wordpress/last-good.json';
import gateInput from '../../../../../content/wordpress/cutover-gate.json';
import inventory from '../../../../../content/wordpress/inventory-plan.json';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { validateSnapshot, hasApprovedCutover, publishedRecords } from './normalize';
import {
  cutoverGateSchema,
  type ContentRecord,
  type ContentSnapshot,
  type ApprovedPublicDocument,
} from './schema';
export type { ContentRecord, ApprovedPublicDocument } from './schema';

// Server-only, build-pinned content. No request-time WordPress fetch or dynamic URL input.
let snapshot: ContentSnapshot | null = null;
try {
  snapshot = validateSnapshot(snapshotInput);
} catch {
  /* A corrupt snapshot fails closed. */
}
const gate = cutoverGateSchema.parse(gateInput);

export function getContentStatus() {
  return {
    available: snapshot !== null,
    versionId: snapshot?.versionId ?? null,
    syncedPosts: snapshot?.records.length ?? 0,
    inventoriedPosts: inventory.postIds.length,
    mode: gate.mode,
    generatedAt: snapshot?.generatedAt ?? null,
    fullBackupVerified: gate.fullBackupVerified,
    restoreTestVerified: gate.restoreTestVerified,
    blogRedirectsVerified: gate.blogRedirectsVerified,
  };
}

export function contentPublication(record: ContentRecord) {
  const approved = hasApprovedCutover(record, gate);
  return {
    indexable: approved,
    preview: !approved,
    canonical: approved ? `https://insightginie.com${record.path}` : record.originalUrl,
  };
}

export function listContent(options: { query?: string; category?: string; limit?: number } = {}) {
  const query = (options.query ?? '').trim().toLowerCase().slice(0, 160);
  const limit = Math.min(100, Math.max(1, options.limit ?? 30));
  return structuredClone(
    (snapshot?.records ?? [])
      .filter(
        (record) =>
          !query ||
          `${record.title} ${record.excerpt} ${record.author.name}`.toLowerCase().includes(query),
      )
      .filter(
        (record) =>
          !options.category ||
          record.categories.some((category) => category.slug === options.category),
      )
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
      .slice(0, limit),
  );
}

export function getContentBySlug(slug: string): ContentRecord | null {
  if (slug.length > 240 || /[\/\\\u0000]/.test(slug)) return null;
  let encoded: string;
  try {
    encoded = encodeURIComponent(slug).toLowerCase();
  } catch {
    return null;
  }
  const record = snapshot?.records.find((item) => item.slug === slug || item.slug === encoded);
  return record ? structuredClone(record) : null;
}

export function getPublishedContent() {
  return structuredClone(publishedRecords(snapshot?.records ?? [], gate));
}

export function getApprovedPublicDocuments(): ApprovedPublicDocument[] {
  const dataset = getIndividualIncomeDistribution();
  const documents: ApprovedPublicDocument[] = [
    {
      id: 'product-overview',
      title: 'About InsightGinie',
      path: '/about/',
      text: 'InsightGinie provides educational data comparisons and deterministic calculators. It is not a financial, investment, tax or legal adviser. Anonymous calculator use does not require an account. Tools show their inputs, assumptions and source information.',
      updatedAt: '2026-09-13T00:00:00.000Z',
      sources: ['https://insightginie.com/about/'],
      approved: true,
    },
    {
      id: 'income-calculator-method',
      title: 'Individual income percentile methodology',
      path: '/methodology/individual-income/',
      text: 'The individual income percentile calculator compares annual individual money income before taxes with the US population age 15 and over, including people without income and with income losses. It is not a ranking of full-time workers, household incomes, or people of the same age. Closed income bands use linear interpolation; the open income tails produce a percentile range. Income values remain in the isolated calculator document.',
      updatedAt: '2026-09-13T00:00:00.000Z',
      sources: ['https://insightginie.com/methodology/individual-income/'],
      approved: true,
    },
    {
      id: 'dataset-quality',
      title: 'How InsightGinie handles data',
      path: '/methodology/',
      text: 'Source datasets are versioned and validated before publication. A failed ingest leaves the last validated snapshot in place. Results identify the dataset reference year and calculation assumptions. A retrieval date does not imply real-time data. Missing data should be presented as unavailable.',
      updatedAt: '2026-09-13T00:00:00.000Z',
      sources: ['https://insightginie.com/methodology/'],
      approved: true,
    },
  ];
  if (dataset)
    documents.push({
      id: 'census-cps-source',
      title: 'Census CPS income data',
      path: '/data/census-cps/',
      text: `The current individual-income dataset is Census CPS PINC-11 from the ${dataset.datasetVersion.surveyYear} Annual Social and Economic Supplement, describing ${dataset.datasetVersion.year} income. The comparison population is US people age 15 and over. Money income is measured before taxes and excludes capital gains and noncash benefits. Grouped survey counts are estimates; sampling, reporting error and rounding limit precision.`,
      updatedAt: dataset.datasetVersion.retrievedAt,
      sources: [dataset.datasetVersion.sourceUrl, 'https://insightginie.com/data/census-cps/'],
      approved: true,
    });
  return documents;
}

export function getContentFeedItems() {
  return getPublishedContent()
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 100)
    .map((record) => ({
      id: record.id,
      title: record.title,
      path: record.path,
      description: record.excerpt,
      publishedAt: record.publishedAt,
      updatedAt: record.updatedAt,
      author: record.author.name,
      sources: record.sources,
    }));
}

export function escapeXml(value: string) {
  return value.replace(
    /[<>&'\"]/g,
    (character) =>
      ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[character]!,
  );
}

export function buildContentRss() {
  const items = getContentFeedItems();
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>InsightGinie insights</title><link>https://insightginie.com/insights/</link><description>Published InsightGinie insights. Migration previews and editorial drafts are excluded.</description>${items.map((item) => `<item><guid isPermaLink="true">https://insightginie.com${escapeXml(item.path)}</guid><title>${escapeXml(item.title)}</title><link>https://insightginie.com${escapeXml(item.path)}</link><description>${escapeXml(item.description)}</description><pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate></item>`).join('')}</channel></rss>`;
}
