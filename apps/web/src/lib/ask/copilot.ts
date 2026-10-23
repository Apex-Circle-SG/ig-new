import { answerCatalogQuestion } from './catalog';
import { answerQuestion } from './orchestrate';
import { getAskKnowledge } from './knowledge';
import { questionPrivacyNotice } from './core';
import type { CatalogQuery, ConversationTurn } from './conversation';

export async function answerWebsiteQuestion(
  question: string,
  history: ConversationTurn[] = [],
  context?: CatalogQuery,
) {
  const privateContext = context && questionPrivacyNotice(`${context.q} ${context.location}`);
  if (privateContext)
    return answerQuestion(`${context?.q || ''} ${context?.location || ''}`, getAskKnowledge());
  if (!questionPrivacyNotice(question)) {
    const catalog = await answerCatalogQuestion(question, context);
    if (catalog) return catalog;
  }
  return answerQuestion(question, getAskKnowledge(), undefined, undefined, history);
}
