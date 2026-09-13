import { z } from 'zod';

const localPath = z.string().regex(/^\/(?!\/)[a-z0-9/-]*\/$/);
export const groundingDocumentSchema = z.object({
  id: z.string().min(1).max(120),
  title: z.string().min(1).max(180),
  path: localPath,
  text: z.string().min(20).max(5000),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}(?:T.*)?$/),
  approved: z.literal(true),
  keywords: z.array(z.string()).default([]),
  sources: z.array(z.object({ name: z.string(), url: z.url().startsWith('https://') })),
});
export type GroundingDocument = z.infer<typeof groundingDocumentSchema>;
export const askInputSchema = z
  .object({
    question: z.string().trim().min(3).max(1200),
    token: z.string().min(20).max(300),
    website: z.literal('').optional(),
  })
  .strict();
export const askOutputSchema = z.object({
  mode: z.enum(['answer', 'fallback', 'refusal']),
  message: z.string().min(1).max(6000),
  citations: z
    .array(
      z.object({
        title: z.string(),
        path: localPath,
        updatedAt: z.string(),
        sources: z.array(z.object({ name: z.string(), url: z.url().startsWith('https://') })),
      }),
    )
    .max(3),
  followups: z.array(z.object({ label: z.string(), path: localPath })).max(4),
  assumptions: z.array(z.string()).max(5),
  method: z.enum(['approved-content-retrieval', 'deterministic-calculator']),
});
export type AskAnswer = z.infer<typeof askOutputSchema>;

const defaults = [
  { label: 'Explore the finance tools', path: '/tools/' },
  { label: 'Understand the data', path: '/methodology/' },
];
const stop = new Set(
  'a an and are as at be can do does for from how i in is it me my of on or please the this to what when where which with you your'.split(
    ' ',
  ),
);
const aliases: Record<string, string> = {
  costs: 'cost',
  earnings: 'income',
  salary: 'income',
  savings: 'saving',
  loans: 'loan',
  borrowing: 'loan',
  investing: 'investment',
  stocks: 'portfolio',
  automation: 'ai',
  breakeven: 'break',
  cashflow: 'cash',
  losses: 'drawdown',
  loss: 'drawdown',
  concentration: 'concentration',
  percentiles: 'percentile',
};
function terms(value: string) {
  return [
    ...new Set(
      value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .split(/[\s-]+/)
        .filter((word) => word.length > 1 && !stop.has(word))
        .map((word) => aliases[word] ?? word),
    ),
  ];
}

/** Only explicit approved records participate; legacy/draft content cannot ground answers. */
export function searchApprovedContent(question: string, supplied: readonly unknown[]) {
  const words = terms(question);
  return supplied
    .flatMap((value) => {
      const parsed = groundingDocumentSchema.safeParse(value);
      if (!parsed.success) return [];
      const document = parsed.data;
      const title = new Set(terms(document.title));
      const keywords = new Set(terms(document.keywords.join(' ')));
      const body = new Set(terms(document.text));
      const score = words.reduce(
        (n, word) => n + (title.has(word) ? 4 : keywords.has(word) ? 3 : body.has(word) ? 1 : 0),
        0,
      );
      return score >= 3 ? [{ document, score }] : [];
    })
    .sort((a, b) => b.score - a.score || a.document.id.localeCompare(b.document.id))
    .slice(0, 3);
}

export function answerFromApprovedContent(
  question: string,
  documents: readonly unknown[],
): AskAnswer {
  const base = {
    method: 'approved-content-retrieval' as const,
    followups: defaults,
    citations: [],
    assumptions: [],
  };
  if (question.length < 3 || question.length > 1200) throw new Error('Invalid question length');
  if (
    /ignore\b.{0,45}\b(instructions|rules|prompt)|reveal\b.{0,35}\b(secret|prompt|key)|(?:execute|run)\b.{0,30}\b(shell|sql|command)|(?:api|application)\s*key|system\s*prompt/i.test(
      question,
    )
  ) {
    return askOutputSchema.parse({
      ...base,
      mode: 'refusal',
      message:
        'I can explain the published tools and methodology. I cannot reveal private instructions, credentials, account data or execute commands.',
    });
  }
  if (
    /\b\d{3}-\d{2}-\d{4}\b|[\w.+-]+@[\w.-]+\.[a-z]{2,}|\b(?:account|routing|card)\s*(?:number|no\.?|#)\b/i.test(
      question,
    )
  ) {
    return askOutputSchema.parse({
      ...base,
      mode: 'refusal',
      message:
        'Please remove personal identifiers and ask a general question. Do not include account numbers, email addresses or other private details.',
    });
  }
  if (
    /\bshould i\b.{0,70}\b(buy|sell|invest|borrow|trade)|\brecommend\b.{0,45}\b(stock|security|securities|investment|portfolio)|\bwhat\b.{0,45}\b(stock|crypto|coin)\b.{0,25}\bbuy|\b(am i|will i)\b.{0,35}\b(eligible|approved|qualify)|\b(my|personal)\s+(taxes|tax return|legal case)|\btax\s+(advice|strategy)|\blegal\s+advice/i.test(
      question,
    )
  ) {
    return askOutputSchema.parse({
      ...base,
      mode: 'refusal',
      message:
        'I can explain calculations and general concepts, but cannot recommend trades, determine credit eligibility, or give personalized financial, tax or legal advice. Use the tools for educational scenarios and consult an appropriately qualified professional for personal advice.',
    });
  }
  if (
    /\b(today|latest|live|real[- ]time|current)\b.{0,35}\b(rate|rates|stock|stocks|price|prices|market)\b|\b(rate|stock|price)\b.{0,20}\btoday\b/i.test(
      question,
    )
  ) {
    return askOutputSchema.parse({
      ...base,
      mode: 'fallback',
      message:
        'I do not have a validated live market-price or interest-rate feed. Enter a rate from your own quote in the relevant calculator; I will not invent a current rate.',
    });
  }
  const matches = searchApprovedContent(question, documents);
  if (!matches.length)
    return askOutputSchema.parse({
      ...base,
      mode: 'fallback',
      message:
        'I could not find enough approved source material to answer that reliably. Try a question about income percentiles, AI workflow costs, cash runway, break-even, loan costs, drawdowns or portfolio concentration.',
    });
  let length = 0;
  const selected = matches
    .slice(0, 2)
    .map(({ document }) => document)
    .filter((document) => {
      if (length + document.text.length + 2 > 6000) return false;
      length += document.text.length + 2;
      return true;
    });
  return askOutputSchema.parse({
    ...base,
    mode: 'answer',
    message: selected.map((document) => document.text).join('\n\n'),
    citations: selected.map(({ title, path, updatedAt, sources }) => ({
      title,
      path,
      updatedAt,
      sources,
    })),
    followups: [...selected.map(({ title, path }) => ({ label: title, path })), ...defaults].slice(
      0,
      4,
    ),
    assumptions: [
      'Answers use approved published explanations. Open the linked calculator to enter a scenario; calculations use its deterministic formula.',
      'Source dates describe the underlying content, not live market data.',
    ],
  });
}
