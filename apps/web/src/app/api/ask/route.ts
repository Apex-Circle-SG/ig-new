import { answerFromApprovedContent, askInputSchema } from '../../../lib/ask/core';
import { getAskKnowledge } from '../../../lib/ask/knowledge';
import { calculateStatedQuestion } from '../../../lib/ask/calculations';
import { operationStore } from '../../../lib/operations';
import {
  createRequestLimiter,
  privateJson,
  readBoundedJson,
  requestBucket,
  securityCookie,
  trustedOrigin,
  validRequestToken,
} from '../../../lib/request-security';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const allow = createRequestLimiter();
let activeRequests = 0;

export async function POST(request: Request) {
  if (process.env.ASK_ENABLED === 'false')
    return privateJson(
      { error: 'Ask is temporarily unavailable. The tools remain available at /tools/.' },
      503,
    );
  if (!trustedOrigin(request))
    return privateJson({ error: 'Open Ask on InsightGinie to continue.' }, 403);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('content-type') ?? ''))
    return privateJson({ error: 'JSON required.' }, 415);
  if (activeRequests >= 30 || !allow(requestBucket(request)))
    return privateJson({ error: 'Please wait a minute before asking another question.' }, 429);
  activeRequests += 1;
  try {
    const parsed = askInputSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success)
      return privateJson(
        { error: 'Enter a question between 3 and 1,200 characters without extra fields.' },
        400,
      );
    if (!validRequestToken(parsed.data.token, securityCookie(request)))
      return privateJson({ error: 'Your session expired. Refresh the page and try again.' }, 403);
    const grounded = answerFromApprovedContent(parsed.data.question, getAskKnowledge());
    const answer =
      grounded.mode === 'answer'
        ? (calculateStatedQuestion(parsed.data.question) ?? grounded)
        : grounded;
    await operationStore.record(`ask_${answer.mode}`);
    return privateJson(answer);
  } catch {
    // Do not log request bodies, prompts, financial values or provider errors.
    await operationStore.record('ask_error');
    return privateJson(
      { error: 'The answer could not be prepared. Try the linked tools or refresh the page.' },
      503,
    );
  } finally {
    activeRequests -= 1;
  }
}
