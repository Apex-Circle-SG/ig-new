import { describe, expect, it } from 'vitest';
import {
  financeTrustSchema,
  maintainerOrganizationSchema,
} from '../../apps/web/src/components/finance-trust-model';
import {
  approvedContextualSuggestions,
  briefPublicationDecision,
  editorialBriefSchema,
} from '../../content/briefs/schema';
import aiBrief from '../../content/briefs/ai-workflow-economics.json';
import founderBrief from '../../content/briefs/founder-runway-sensitivity.json';
import riskBrief from '../../content/briefs/drawdown-and-concentration.json';

describe('truthful finance attribution', () => {
  it('does not manufacture a date, reviewer or personal author by default', () => {
    const model = financeTrustSchema.parse({});
    expect(model.publishedAt).toBeUndefined();
    expect(model.updatedAt).toBeUndefined();
    expect(model.reviewer).toBeUndefined();
    expect(maintainerOrganizationSchema()['@type']).toBe('Organization');
    expect(maintainerOrganizationSchema()).not.toHaveProperty('credentials');
  });
  it.each(['javascript:alert(1)', 'http://example.com/', 'https://name:password@example.com/'])(
    'rejects unsafe source attribution URL %s',
    (url) => {
      expect(
        financeTrustSchema.safeParse({ sources: [{ name: 'Untrusted source', url }] }).success,
      ).toBe(false);
    },
  );
  it('rejects fabricated ordering and unconfirmed review configuration', () => {
    expect(
      financeTrustSchema.safeParse({ publishedAt: '2026-09-13', updatedAt: '2026-09-12' }).success,
    ).toBe(false);
    expect(financeTrustSchema.safeParse({ updatedAt: '2026-02-30' }).success).toBe(false);
    expect(
      financeTrustSchema.safeParse({
        reviewer: {
          name: 'Unconfirmed',
          profilePath: '/authors/unconfirmed/',
          reviewedAt: '2026-09-13',
          scope: 'Technical review',
          confirmed: false,
        },
      }).success,
    ).toBe(false);
  });
});

describe('research briefs cannot become unreviewed content', () => {
  it.each([aiBrief, founderBrief, riskBrief])(
    'keeps $id unpublished with no approved contextual links',
    (brief) => {
      const data = editorialBriefSchema.parse(brief);
      expect(data.status).toBe('draft');
      expect(data.author).toBeNull();
      expect(data.reviewer).toBeNull();
      expect(data.lastReviewedAt).toBeNull();
      expect(approvedContextualSuggestions(data)).toEqual([]);
      expect(briefPublicationDecision(data).publishable).toBe(false);
    },
  );
  it('rejects approval without authorship, review and source validation', () => {
    expect(editorialBriefSchema.safeParse({ ...aiBrief, status: 'approved' }).success).toBe(false);
    const forged = structuredClone(aiBrief);
    forged.contextualLinks[0].approval.status = 'approved';
    expect(editorialBriefSchema.safeParse(forged).success).toBe(false);
  });
  it('does not confuse complete brief approval with authority to publish or insert links', () => {
    // Explicit synthetic identities exist only to exercise the validation gate.
    const author = {
      id: 'fixture-author',
      name: 'Test fixture author',
      profilePath: '/authors/fixture-author/',
      identityConfirmed: true,
    };
    const reviewer = {
      id: 'fixture-reviewer',
      name: 'Test fixture reviewer',
      profilePath: '/authors/fixture-reviewer/',
      identityConfirmed: true,
    };
    const approved = {
      ...aiBrief,
      status: 'approved',
      author,
      reviewer,
      lastReviewedAt: '2026-09-13',
      sources: aiBrief.sources.map((source) => ({
        ...source,
        status: 'validated',
        validatedAt: '2026-09-13',
      })),
    };
    expect(briefPublicationDecision(approved)).toMatchObject({
      approvedForEditorialWork: true,
      publishable: false,
    });
    expect(approvedContextualSuggestions(approved)).toEqual([]);
  });
});
