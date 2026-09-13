import { adminChallenge, authenticatedAdmin } from '../../../../lib/admin';
import {
  createRequestLimiter,
  privateJson,
  readBoundedJson,
  requestBucket,
  trustedOrigin,
} from '../../../../lib/request-security';
import { contentPublication, getContentStatus, listContent } from '../../../../lib/content';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
export const runtime = 'nodejs';
const allow = createRequestLimiter(5);
export async function POST(request: Request) {
  if (!authenticatedAdmin(request)) return adminChallenge();
  if (!trustedOrigin(request)) return privateJson({ error: 'Same-origin requests required.' }, 403);
  if (!allow(requestBucket(request))) return privateJson({ error: 'Please try again later.' }, 429);
  const body = await readBoundedJson(request, 128);
  if (!body || typeof body !== 'object' || Object.keys(body).length)
    return privateJson({ error: 'No parameters accepted.' }, 400);
  const status = getContentStatus();
  const dataset = getIndividualIncomeDistribution();
  return privateJson({
    checkedAt: new Date().toISOString(),
    datasetValid: dataset !== null,
    snapshotValid: status.available,
    syncedRecords: status.syncedPosts,
    previews: listContent({ limit: 100 }).map((record) => ({
      path: record.path,
      originalUrl: record.originalUrl,
      publication: contentPublication(record),
      hasAuthor: Boolean(record.author.name),
      hasSource: record.sources.length > 0,
      hasBody: Boolean(record.html),
    })),
    publicationAllowed:
      status.fullBackupVerified &&
      status.restoreTestVerified &&
      status.blogRedirectsVerified &&
      listContent().some((record) => contentPublication(record).indexable),
    blockers: [
      !status.fullBackupVerified && 'Full backup has not been verified',
      !status.restoreTestVerified && 'Restore test has not been verified',
      !status.blogRedirectsVerified && 'Blog-host redirects have not been verified',
    ].filter(Boolean),
    remoteChangesMade: false,
  });
}
