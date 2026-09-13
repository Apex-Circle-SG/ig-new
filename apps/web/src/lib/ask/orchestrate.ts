import { calculateStatedQuestion } from './calculations';
import {
  answerFromApprovedContent,
  askOutputSchema,
  requiresLiveFinancialData,
  searchApprovedContent,
  type AskAnswer,
} from './core';
import {
  generateGeneralAnswer,
  selectPublicExcerpts,
  type GeneralAnswerResult,
  type GeneralQuestionPacket,
  type PublicSelectionPacket,
  type SelectionResult,
} from './datadog';
import { prepareGeneralQuestion } from './general-question';

type Selector = (packet: PublicSelectionPacket) => Promise<SelectionResult>;
type Generator = (packet: GeneralQuestionPacket) => Promise<GeneralAnswerResult>;

async function generalAnswer(question: string, generate: Generator): Promise<AskAnswer> {
  const prepared = prepareGeneralQuestion(question);
  let result: GeneralAnswerResult;
  try {
    result =
      prepared.question.length <= 1200
        ? await generate({ question: prepared.question })
        : { status: 'unavailable', reason: 'validation' };
  } catch {
    result = { status: 'unavailable', reason: 'provider' };
  }
  if (result.status === 'answered') {
    const validated = askOutputSchema.safeParse({
      mode: 'answer',
      message: result.message,
      citations: [],
      followups: [],
      assumptions: [
        'This is a general AI answer, not an answer verified against InsightGinie sources. Check important facts independently.',
        'Ginie has no live browsing or market feed. Its general answers can be incomplete or incorrect.',
        'This question was sent to Datadog without conversation history. The provider may retain the request and answer under its account policy.',
        ...(prepared.redacted
          ? [
              'Explicit amounts or personal financial numbers were omitted before sending. Use a private calculator for an exact scenario.',
            ]
          : []),
      ],
      method: 'datadog-general-answer',
      provider: { id: 'datadog', status: 'live', preparedAt: result.preparedAt },
    });
    if (validated.success) return validated.data;
    result = { status: 'unavailable', reason: 'validation' };
  }
  const messages: Partial<Record<typeof result.reason, string>> = {
    disabled:
      'General AI answers are not enabled on this site. Published explanations and private tools are available.',
    configuration:
      'General AI answers need a site configuration update. Published explanations and private tools are available.',
    busy: 'Ginie is busy. Please wait a minute and try again.',
    budget:
      'General AI answers have reached their current usage limit. The published explanations and private tools remain available.',
    timeout: 'The general answer took too long. Please try again in a minute.',
  };
  return askOutputSchema.parse({
    mode: 'fallback',
    message:
      messages[result.reason] ??
      'General AI answers are temporarily unavailable. You can still use the published explanations and private tools, or try again later.',
    citations: [],
    followups: [{ label: 'Explore the tools', path: '/tools/' }],
    assumptions: [],
    method: 'approved-content-retrieval',
    provider: { id: 'local', status: 'fallback' },
  });
}

/** The question ends here: only a finite focus and reviewed public text cross the provider boundary. */
export function publicSelectionPacket(question: string, supplied: readonly unknown[]) {
  const matches = searchApprovedContent(question, supplied);
  const focus: PublicSelectionPacket['focus'] =
    /\b(assumptions?|limitations?|limits?|exclude)\b/i.test(question)
      ? 'assumptions'
      : /\b(example|illustrate|worked)\b/i.test(question)
        ? 'example'
        : /\b(formula|calculate|calculation|compute|how|why)\b/i.test(question)
          ? 'formula'
          : 'overview';
  const documents = matches.slice(0, 2).map(({ document }) => {
    const sentences = document.text.split(/(?<=[.!?])\s+(?=[A-Z])/u);
    const excerpts: { id: string; text: string }[] = [];
    for (let index = 0; index < sentences.length; index += 2) {
      const last = excerpts.length === 7;
      excerpts.push({
        id: `${document.id}:${excerpts.length + 1}`,
        text: sentences.slice(index, last ? undefined : index + 2).join(' '),
      });
      if (last) break;
    }
    return { id: document.id, title: document.title, excerpts };
  });
  return { packet: { focus, documents }, matches };
}

export async function answerQuestion(
  question: string,
  documents: readonly unknown[],
  select: Selector = selectPublicExcerpts,
  generate: Generator = generateGeneralAnswer,
): Promise<AskAnswer> {
  const grounded = answerFromApprovedContent(question, documents);
  if (grounded.mode === 'refusal' || requiresLiveFinancialData(question))
    return { ...grounded, provider: { id: 'local', status: 'not-needed' } };
  const calculated = calculateStatedQuestion(question);
  if (calculated) return { ...calculated, provider: { id: 'local', status: 'not-needed' } };
  if (grounded.mode !== 'answer') return generalAnswer(question, generate);

  const local: AskAnswer = { ...grounded, provider: { id: 'local', status: 'fallback' } };
  try {
    const { packet, matches } = publicSelectionPacket(question, documents);
    const result = await select(packet);
    if (result.status !== 'selected') return local;
    const allowed = new Map(
      packet.documents.flatMap((document) =>
        document.excerpts.map(
          (excerpt) => [excerpt.id, { ...excerpt, documentId: document.id }] as const,
        ),
      ),
    );
    if (
      !result.excerptIds.length ||
      result.excerptIds.length > 4 ||
      new Set(result.excerptIds).size !== result.excerptIds.length ||
      result.excerptIds.some((id) => !allowed.has(id))
    )
      return local;
    const selected = result.excerptIds.map((id) => allowed.get(id)!);
    const citedIds = new Set(selected.map((excerpt) => excerpt.documentId));
    const cited = matches
      .map(({ document }) => document)
      .filter((document) => citedIds.has(document.id));
    return askOutputSchema.parse({
      mode: 'answer',
      message: selected.map((excerpt) => excerpt.text).join('\n\n'),
      citations: cited.map(({ title, path, updatedAt, sources }) => ({
        title,
        path,
        updatedAt,
        sources,
      })),
      followups: [
        ...cited.map(({ title, path }) => ({ label: title, path })),
        { label: 'Explore the finance tools', path: '/tools/' },
        { label: 'Understand the data', path: '/methodology/' },
      ].slice(0, 4),
      assumptions: [
        'Datadog selected excerpts from approved public explanations. The displayed words come directly from those sources; the model cannot change calculator results.',
        'Only public excerpts and a general question category are sent to Datadog. Your question and financial values are processed on the InsightGinie server.',
        'Source dates describe the underlying content, not live market data. Open the linked tool to enter your scenario.',
      ],
      method: 'datadog-grounded-selection',
      provider: {
        id: 'datadog',
        status: result.cached ? 'cached' : 'live',
        preparedAt: result.preparedAt,
      },
    });
  } catch {
    // Provider failures must not expose remote error bodies or make the approved sources unavailable.
    return local;
  }
}
