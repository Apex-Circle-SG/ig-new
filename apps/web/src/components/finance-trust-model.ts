import * as z from 'zod';

export const TRUST_POLICY_UPDATED_AT = '2026-09-13';
export const INSIGHTGINIE_MAINTAINER = {
  name: 'InsightGinie',
  profilePath: '/authors/insightginie/',
  type: 'Organization',
} as const;

const knownDate = z.iso.date();
const localPath = z.string().regex(/^\/(?:[a-z0-9-]+\/)*(?:#[a-z0-9-]+)?$/);
const sourceUrl = z.url().refine((value) => {
  const url = new URL(value);
  return url.protocol === 'https:' && !url.username && !url.password;
}, 'Use a public HTTPS source URL without credentials');

export const financeTrustSchema = z
  .object({
    methodologyPath: localPath.default('/research-methodology/'),
    sources: z
      .array(
        z.object({
          name: z.string().min(1).max(200),
          url: sourceUrl,
          year: z.number().int().min(1900).max(2100).optional(),
          version: z.string().min(1).max(120).optional(),
        }),
      )
      .default([]),
    publishedAt: knownDate.optional(),
    updatedAt: knownDate.optional(),
    formulaVersion: z.string().min(1).max(120).optional(),
    reviewer: z
      .object({
        name: z.string().min(1).max(160),
        profilePath: z.string().regex(/^\/authors\/[a-z0-9-]+\/$/),
        reviewedAt: knownDate,
        scope: z.string().min(1).max(240),
        confirmed: z.literal(true),
      })
      .optional(),
  })
  .strict()
  .refine(
    (value) => !value.publishedAt || !value.updatedAt || value.updatedAt >= value.publishedAt,
    { message: 'An update cannot precede original publication', path: ['updatedAt'] },
  );

export type FinanceTrustProps = z.input<typeof financeTrustSchema>;

export function maintainerOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': INSIGHTGINIE_MAINTAINER.type,
    '@id': 'https://insightginie.com/#organization',
    name: INSIGHTGINIE_MAINTAINER.name,
    url: 'https://insightginie.com/',
    mainEntityOfPage: `https://insightginie.com${INSIGHTGINIE_MAINTAINER.profilePath}`,
    description:
      'The organizational maintainer of InsightGinie tools, data methods and product policies.',
  };
}
