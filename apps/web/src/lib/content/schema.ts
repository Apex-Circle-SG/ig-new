import { z } from 'zod';

export const WORDPRESS_ORIGIN = 'https://blog.insightginie.com';
export const CONTENT_TRANSFORMATION_VERSION = 'wordpress-public-v1';
export const slugSchema = z
  .string()
  .min(1)
  .max(240)
  .regex(/^(?:[a-z0-9]|%[a-f0-9]{2})[a-z0-9_%\-]*$/);
const sourceUrlSchema = z.url().refine((value) => {
  const url = new URL(value);
  return (
    url.origin === WORDPRESS_ORIGIN && !url.search && !url.hash && !url.username && !url.password
  );
});
const publicUrlSchema = z
  .url()
  .refine((value) => ['https:', 'http:'].includes(new URL(value).protocol));

export const contentRecordSchema = z
  .object({
    id: z.string().regex(/^wp-post-\d+$/),
    wpId: z.number().int().positive(),
    slug: slugSchema,
    title: z.string().min(1).max(500),
    excerpt: z.string().max(2000),
    html: z.string().min(20).max(2_000_000),
    text: z.string().min(20).max(1_000_000),
    originalUrl: sourceUrlSchema,
    path: z.string().regex(/^\/insights\/(?:[a-z0-9]|%[a-f0-9]{2})[a-z0-9_%\-]*\/$/),
    status: z.literal('migration-preview'),
    publishedAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    retrievedAt: z.iso.datetime(),
    author: z.object({
      id: z.number().int().positive(),
      name: z.string().min(1).max(200),
      url: publicUrlSchema.nullable(),
    }),
    categories: z
      .array(
        z.object({
          id: z.number().int().positive(),
          name: z.string().max(200),
          slug: z.string().max(240),
        }),
      )
      .max(100),
    tags: z
      .array(
        z.object({
          id: z.number().int().positive(),
          name: z.string().max(200),
          slug: z.string().max(240),
        }),
      )
      .max(1000),
    featuredMedia: z
      .object({
        id: z.number().int().positive(),
        url: publicUrlSchema,
        alt: z.string().max(2000),
        captionHtml: z.string().max(20000),
        width: z.number().int().positive().nullable(),
        height: z.number().int().positive().nullable(),
      })
      .nullable(),
    media: z.array(publicUrlSchema).max(500),
    sources: z.array(publicUrlSchema).max(1000),
    rawSha256: z.string().regex(/^[a-f0-9]{64}$/),
    contentSha256: z.string().regex(/^[a-f0-9]{64}$/),
    warnings: z.array(z.string().max(300)).max(30),
  })
  .strict();

export const contentSnapshotSchema = z
  .object({
    schemaVersion: z.literal(1),
    transformationVersion: z.literal(CONTENT_TRANSFORMATION_VERSION),
    sourceOrigin: z.literal(WORDPRESS_ORIGIN),
    versionId: z.string().regex(/^[a-f0-9]{64}$/),
    generatedAt: z.iso.datetime(),
    records: z.array(contentRecordSchema).max(20_000),
  })
  .strict();

export const cutoverGateSchema = z
  .object({
    mode: z.enum(['preview', 'cutover']),
    fullBackupVerified: z.boolean(),
    restoreTestVerified: z.boolean(),
    blogRedirectsVerified: z.boolean(),
    evidence: z.array(z.string().min(1)).max(50),
    approvedRecords: z
      .array(
        z.object({
          id: z.string(),
          contentSha256: z.string().regex(/^[a-f0-9]{64}$/),
          approvedBy: z.string().min(1),
          approvedAt: z.iso.datetime(),
          targetStatus: z.literal(200),
          sourceRedirectStatus: z.literal(301),
        }),
      )
      .max(20_000),
  })
  .strict();

export type ContentRecord = z.infer<typeof contentRecordSchema>;
export type ContentSnapshot = z.infer<typeof contentSnapshotSchema>;
export type CutoverGate = z.infer<typeof cutoverGateSchema>;
export type ApprovedPublicDocument = {
  id: string;
  title: string;
  path: string;
  text: string;
  updatedAt: string;
  sources: string[];
  approved: true;
};
