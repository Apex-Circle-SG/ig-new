/** Minimize explicit amounts before a general AI request. This is not anonymization. */
export function prepareGeneralQuestion(input: string) {
  let question = input.replace(
    /[$£€₹]\s*\d[\d,]*(?:\.\d+)?(?:\s*(?:thousand|million|billion|[kmb]))?\b|\b\d[\d,]*(?:\.\d+)?(?:\s*(?:thousand|million|billion|[kmb]))?\s*(?:dollars?|USD|GBP|EUR|INR)\b/gi,
    '[amount omitted]',
  );
  const personal = /\b(?:my|our|I|we)\b/i.test(question);
  const financial =
    /\b(?:income|salary|earn|earning|savings?|net worth|debt|spend|spending|revenue|rent|mortgage|assets?|balance|budget|portfolio|loan)\b/i.test(
      question,
    );
  if (personal && financial)
    question = question.replace(
      /\b\d[\d,]*(?:\.\d+)?(?:\s*(?:thousand|million|billion|[kmb]))?%?\b/gi,
      '[number omitted]',
    );
  return { question, redacted: question !== input };
}
