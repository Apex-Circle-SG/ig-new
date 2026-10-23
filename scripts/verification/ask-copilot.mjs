// Public synthetic checks. --general additionally spends at most two configured
// Datadog executions to verify real general answers and immediate follow-up.
import { chromium } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';
const budgetPath = '/var/lib/insightginie/datadog-ask/selection-state.json';
const budget = async () => {
  try {
    return JSON.parse(await readFile(budgetPath, 'utf8')).budget;
  } catch {
    return null;
  }
};
const report = {
  checkedAt: new Date().toISOString(),
  baseURL: 'https://insightginie.com',
  catalogChecks: [],
  generalChecks: [],
  budgetBefore: await budget(),
  budgetAfter: null,
};
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.route(/googlesyndication|google-analytics|googletagmanager|doubleclick/, (r) =>
    r.abort(),
  );
  await page.goto(`${report.baseURL}/ask/`, { waitUntil: 'domcontentloaded' });
  const ask = async (question, history = [], context) =>
    page.evaluate(
      async ({ question, history, context }) => {
        const tokenResponse = await fetch('/api/ask/token/', { cache: 'no-store' });
        const { token } = await tokenResponse.json();
        const response = await fetch('/api/ask/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question,
            token,
            website: '',
            history,
            ...(context ? { context } : {}),
          }),
        });
        return { status: response.status, answer: await response.json() };
      },
      { question, history, context },
    );
  let context;
  for (const question of [
    'Find remote customer support jobs',
    'Only in Singapore',
    'What about contract roles?',
    'Show me paid research opportunities',
    'Suggest funny business ideas',
    'Show earning platforms',
  ]) {
    const { status, answer } = await ask(question, [], context);
    if (status !== 200 || answer.method !== 'live-catalog-search' || !answer.catalog)
      throw new Error('Live catalog check failed');
    context = answer.catalog.query;
    report.catalogChecks.push({
      syntheticQuestion: question,
      status,
      mode: answer.mode,
      query: context,
      total: answer.catalog.total,
      paths: answer.catalog.items.map((x) => x.path),
    });
  }
  if (process.argv.includes('--general')) {
    const firstQuestion = 'Explain a JavaScript promise in one short sentence.';
    const first = await ask(firstQuestion);
    if (
      first.status !== 200 ||
      first.answer.method !== 'datadog-general-answer' ||
      first.answer.mode !== 'answer'
    )
      throw new Error('First live general answer failed');
    const second = await ask('Give a small example of that.', [
      { question: firstQuestion, answer: first.answer.message.slice(0, 1200) },
    ]);
    if (
      second.status !== 200 ||
      second.answer.method !== 'datadog-general-answer' ||
      second.answer.mode !== 'answer' ||
      !/promise|resolve|then|async|await/i.test(second.answer.message)
    )
      throw new Error('Immediate contextual follow-up failed');
    report.generalChecks = [first, second].map(({ status, answer }, index) => ({
      sequence: index + 1,
      status,
      method: answer.method,
      provider: answer.provider,
      answerCharacters: answer.message.length,
    }));
  }
  report.budgetAfter = await budget();
  if (
    report.budgetBefore &&
    report.budgetAfter &&
    report.budgetAfter.month === report.budgetBefore.month &&
    report.budgetAfter.monthlyRuns < report.budgetBefore.monthlyRuns
  )
    throw new Error('Budget ledger unexpectedly reset');
  await writeFile(
    'docs/verification/ask-copilot-live.json',
    JSON.stringify(report, null, 2) + '\n',
  );
  console.log(
    JSON.stringify({
      catalogChecks: report.catalogChecks.length,
      generalChecks: report.generalChecks.length,
      ledgerPreserved: true,
    }),
  );
} finally {
  await browser.close();
}
