/** Only these messages cross the calculator boundary. No inputs, results or URLs. */
export const INCOME_EMBED_CHANNEL = 'insightginie:income-tool:v1';
export const PUBLIC_INCOME_TOOL_URL = 'https://insightginie.com/calc/individual-income-percentile/';
export const SAFE_CALCULATOR_EVENTS = [
  'calculator_started',
  'calculator_completed',
  'calculator_result_shared',
] as const;
export const SAFE_INTERACTIONS = ['form', 'example', 'what-if', 'copy-link'] as const;
