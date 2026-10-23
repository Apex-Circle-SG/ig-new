import { z } from 'zod';
export const conversationTurnSchema = z.strictObject({
  question: z.string().trim().min(1).max(1200),
  answer: z.string().trim().min(1).max(1200),
});
export type ConversationTurn = z.infer<typeof conversationTurnSchema>;
export const catalogQuerySchema = z.strictObject({
  kind: z.enum(['jobs', 'bounties', 'methods', 'ideas', 'platforms']),
  q: z.string().max(160).default(''),
  location: z.string().max(80).default(''),
  arrangement: z
    .enum(['', 'Full-time', 'Part-time', 'Contract', 'Freelance', 'Temporary', 'Internship'])
    .default(''),
  paid: z.boolean().default(false),
  page: z.number().int().min(1).max(100).default(1),
});
export type CatalogQuery = z.infer<typeof catalogQuerySchema>;
