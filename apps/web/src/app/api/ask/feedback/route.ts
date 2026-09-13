import { z } from 'zod';
import {
  createRequestLimiter,
  privateJson,
  readBoundedJson,
  requestBucket,
  securityCookie,
  trustedOrigin,
  validRequestToken,
} from '../../../../lib/request-security';
import { operationStore, type OperationCode } from '../../../../lib/operations';

export const runtime = 'nodejs';
const allow = createRequestLimiter(5);
const schema = z
  .object({
    token: z.string().max(300),
    category: z.enum(['source-issue', 'unclear-answer', 'unsafe-answer']),
  })
  .strict();
const codes: Record<z.infer<typeof schema>['category'], OperationCode> = {
  'source-issue': 'feedback_source',
  'unclear-answer': 'feedback_unclear',
  'unsafe-answer': 'feedback_unsafe',
};
export async function POST(request: Request) {
  if (!trustedOrigin(request)) return privateJson({ error: 'Same-origin requests required.' }, 403);
  if (!allow(requestBucket(request))) return privateJson({ error: 'Please try again later.' }, 429);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? ''))
    return privateJson({ error: 'JSON required.' }, 415);
  const value = schema.safeParse(await readBoundedJson(request, 1024));
  if (!value.success || !validRequestToken(value.data.token, securityCookie(request)))
    return privateJson({ error: 'Refresh Ask before reporting.' }, 400);
  await operationStore.record(codes[value.data.category]);
  return privateJson(
    { recorded: Boolean(process.env.OPERATIONS_DIRECTORY) },
    process.env.OPERATIONS_DIRECTORY ? 200 : 503,
  );
}
