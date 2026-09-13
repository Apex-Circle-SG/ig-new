import * as z from 'zod';

const date = z.iso.date();
const publicUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Sources require public HTTPS URLs');
const profile = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(160),
    profilePath: z.string().regex(/^\/authors\/[a-z0-9-]+\/$/),
    identityConfirmed: z.literal(true),
  })
  .strict();
const linkApproval = z
  .object({
    status: z.enum(['pending', 'approved', 'rejected']),
    approvedBy: profile.nullable(),
    approvedAt: date.nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === 'approved' && (!value.approvedBy || !value.approvedAt))
      context.addIssue({
        code: 'custom',
        message: 'A link needs a recorded approver and approval date',
      });
    if (value.status !== 'approved' && (value.approvedBy || value.approvedAt))
      context.addIssue({ code: 'custom', message: 'Unapproved suggestions cannot claim approval' });
  });

/** Brief approval prepares editorial work; it never publishes an article or inserts links. */
export const editorialBriefSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(10).max(180),
    intent: z
      .object({
        question: z.string().min(10),
        readerDecision: z.string().min(10),
        uniqueValue: z.string().min(20),
      })
      .strict(),
    hub: z.enum(['ai-economics', 'founder-finance', 'quantitative-risk']),
    author: profile.nullable(),
    reviewer: profile.nullable(),
    sources: z
      .array(
        z
          .object({
            name: z.string().min(1),
            url: publicUrl,
            type: z.literal('primary'),
            status: z.enum(['candidate', 'validated']),
            validatedAt: date.nullable(),
            purpose: z.string().min(10),
          })
          .strict()
          .superRefine((source, context) => {
            if (source.status === 'validated' && !source.validatedAt)
              context.addIssue({
                code: 'custom',
                message: 'Validated sources require a recorded validation date',
              });
            if (source.status === 'candidate' && source.validatedAt)
              context.addIssue({
                code: 'custom',
                message: 'Candidate sources cannot claim validation',
              });
          }),
      )
      .min(1),
    methodology: z
      .object({
        version: z.string().min(1),
        plan: z.string().min(40),
        assumptions: z.array(z.string().min(10)).min(1),
        limitations: z.array(z.string().min(10)).min(1),
      })
      .strict(),
    lastReviewedAt: date.nullable(),
    disclaimer: z.string().min(40),
    relatedTool: z.enum([
      'ai-workflow-roi',
      'cash-runway',
      'break-even',
      'business-loan',
      'drawdown-recovery',
      'portfolio-concentration',
    ]),
    status: z.enum(['draft', 'review', 'approved']),
    contextualLinks: z.array(
      z
        .object({
          targetPath: z.string().regex(/^\/(?:[a-z0-9-]+\/)+$/),
          anchorText: z.string().min(3).max(120),
          reason: z.string().min(20),
          approval: linkApproval,
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((brief, context) => {
    if (brief.status !== 'approved') return;
    if (!brief.author || !brief.reviewer || !brief.lastReviewedAt)
      context.addIssue({
        code: 'custom',
        message: 'Approval requires an identified author, reviewer and recorded review date',
      });
    if (brief.author && brief.reviewer && brief.author.id === brief.reviewer.id)
      context.addIssue({
        code: 'custom',
        message: 'Author and reviewer must be distinct for these financial research briefs',
      });
    if (brief.sources.some((source) => source.status !== 'validated'))
      context.addIssue({
        code: 'custom',
        message: 'Candidate sources must be checked before approval',
      });
  });

export type EditorialBrief = z.infer<typeof editorialBriefSchema>;

/** Only explicitly approved suggestions can be presented for manual insertion. */
export function approvedContextualSuggestions(value: unknown) {
  const brief = editorialBriefSchema.parse(value);
  return brief.contextualLinks.filter((link) => link.approval.status === 'approved');
}

export function briefPublicationDecision(value: unknown) {
  const brief = editorialBriefSchema.parse(value);
  return {
    approvedForEditorialWork: brief.status === 'approved',
    publishable: false as const,
    reason: 'A research brief is not a reviewed article or a publication authorization.',
  };
}
