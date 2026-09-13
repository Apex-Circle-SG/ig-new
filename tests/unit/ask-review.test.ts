import { describe, expect, it } from 'vitest';
import { answerFromApprovedContent } from '../../apps/web/src/lib/ask/core';
import { calculateStatedQuestion } from '../../apps/web/src/lib/ask/calculations';

describe('independent assistant correctness review', () => {
  it.each([
    'Compare my monthly income $5,000 percentile',
    'Compare my household income $75,000 percentile',
    'What percentile is income $2 million?',
    'What gain recovers a 10% loss followed by a 20% loss?',
    'Compare my income $5,000 per month percentile',
    'Compare my income $5,000 a month percentile',
    'Compare my income $5,000/mo percentile',
    'Compare my income $5,000/wk percentile',
    'Compare my income $2 m percentile',
    'Compare my income $75,000% percentile',
    'Compare my after-tax income $75,000 percentile',
    'Compare my income $75,000 in Seattle percentile',
    'Compare my income $75,000 and income $90,000 percentile',
    'Compare my income $7,50 percentile',
    'Compare my income $7,,500 percentile',
    'Compare my income $7.5e4 percentile',
    'What gain recovers a -50% loss?',
    'What gain recovers a .5% loss?',
    'When will a 50% drawdown recover?',
    'What gain recovers a 50% loss with new contributions?',
    'What gain recovers a 101% loss?',
  ])('does not silently drop explicit scope or units: %s', (question) => {
    expect(calculateStatedQuestion(question)).toBeNull();
  });
  it('keeps supported simple examples available', () => {
    expect(calculateStatedQuestion('What gain recovers a 50% loss?')?.message).toContain('100%');
    expect(
      calculateStatedQuestion('Compare my annual individual income $75,000 percentile')?.message,
    ).toContain('74.7%');
  });
  it.each([
    ['What gain recovers a 0% loss?', 'requires a gain of 0%'],
    ['What gain recovers a 0.5% loss?', 'requires a gain of 0.5%'],
    ['What gain recovers a 100% loss?', 'no finite recovery percentage'],
    ['Compare my annual individual income $75k percentile', '74.7%'],
    ['Compare my income $75,000 per year in the US percentile', '74.7%'],
  ])('supports an unambiguous stated example: %s', (question, expected) => {
    expect(calculateStatedQuestion(question)?.message).toContain(expected);
  });
  it('handles two valid long grounding documents without exceeding its output budget', () => {
    const documents = ['one', 'two'].map((id) => ({
      id,
      title: `Cash runway model ${id}`,
      path: `/tools/${id}/`,
      text: 'Cash runway uses current cash and a stated monthly cash burn. '.repeat(70),
      updatedAt: '2026-09-13',
      approved: true,
      sources: [{ name: 'Public model explanation', url: 'https://insightginie.com/tools/' }],
    }));
    const result = answerFromApprovedContent('How does cash runway work?', documents);
    expect(result.mode).toBe('answer');
    expect(result.message.length).toBeLessThanOrEqual(6000);
    expect(result.citations.length).toBeGreaterThan(0);
  });
});
