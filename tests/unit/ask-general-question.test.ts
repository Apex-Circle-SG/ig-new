import { describe, expect, it } from 'vitest';
import { prepareGeneralQuestion } from '../../apps/web/src/lib/ask/general-question';

describe('general-question data minimization', () => {
  it.each([
    'I earn 137823 dollars and want a different career.',
    'Compare a $137,823 purchase with a $50,000 purchase.',
    'My salary is 137823 and my age is 34.',
    'Our budget is 40000 USD for 12 months.',
  ])('omits explicit financial numbers: %s', (question) => {
    const prepared = prepareGeneralQuestion(question);
    expect(prepared.redacted).toBe(true);
    expect(prepared.question).not.toMatch(/137[,.]?823|50,000|40000/);
  });

  it.each([
    'Why is the sky blue?',
    'Explain the year 1066.',
    'Why does water contain 2 hydrogen atoms?',
  ])('preserves ordinary general questions: %s', (question) => {
    expect(prepareGeneralQuestion(question)).toEqual({ question, redacted: false });
  });
});
