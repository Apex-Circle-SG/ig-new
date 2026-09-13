import { calculateStatedQuestion } from './calculations';
import {
  answerFromApprovedContent,
  askOutputSchema,
  searchApprovedContent,
  type AskAnswer,
} from './core';
import { selectPublicExcerpts, type PublicSelectionPacket, type SelectionResult } from './datadog';

type Selector = (packet: PublicSelectionPacket) => Promise<SelectionResult>;

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
): Promise<AskAnswer> {
  const grounded = answerFromApprovedContent(question, documents);
  if (grounded.mode !== 'answer')
    return { ...grounded, provider: { id: 'local', status: 'not-needed' } };
  const calculated = calculateStatedQuestion(question);
  if (calculated) return { ...calculated, provider: { id: 'local', status: 'not-needed' } };

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
