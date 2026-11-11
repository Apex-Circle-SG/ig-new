import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle from '../../../components/guide-article';

export const metadata: Metadata = {
  title: 'How long will my cash last? Cash runway for freelancers',
  description:
    'Cash runway in months is the cash you can spend today divided by your average monthly net burn. Run your own figures in the free cash runway calculator — no sign-up, calculation in your browser.',
  alternates: { canonical: '/guides/how-long-will-my-cash-last/' },
};

export default function HowLongWillMyCashLast() {
  return (
    <GuideArticle
      title="How long will my cash last? How to calculate cash runway as a freelancer"
      answer={<>
        <strong>Answer first:</strong> Runway in months = cash you can actually
        spend today ÷ your average monthly net cash outflow. Net outflow is
        your monthly expenses minus reliable incoming cash. So $12,000 of
        spendable cash with a $2,000 monthly net burn is 6 months of runway.
      </>}
    >
      <h2>The formula, in plain terms</h2>
      <p>
        Runway is the cash you have on hand divided by what you spend net each
        month. Monthly net burn is your monthly expenses minus the reliable
        income that arrives each month. If your expenses are higher than your
        reliable income, the difference is what your cash pile has to cover —
        and dividing your cash by that difference gives the number of months
        it lasts.
      </p>
      <h2>What counts as cash you can spend</h2>
      <p>
        Only money you can actually use now counts. That is the cash in your
        accounts that is free to spend. Leave out money already set aside for
        tax, client deposits you still owe work for, and any credit line or
        credit card limit — borrowing is not cash on hand, and it has to be
        repaid.
      </p>
      <h2>How to work out your monthly net burn</h2>
      <p>
        Add up your essential monthly costs — the ones that do not stop when
        work is quiet — then subtract the income you can reliably expect each
        month. Average both sides over several months, so a one-off cost or a
        late invoice does not distort the figure. Use essential costs, not a
        wish-list lifestyle, or the runway will look longer than it is.
      </p>
      <h2>A worked example</h2>
      <p>
        Cash on hand: $12,000. Monthly expenses: $3,000. Reliable monthly
        income: $1,000. Net burn is $3,000 − $1,000 = $2,000 a month. Runway
        is $12,000 ÷ $2,000 = 6 months.
      </p>
      <h2>Check your own figures</h2>
      <p>
        Run your own cash and burn figures in the free cash runway calculator
        in the calculators hub — free, no sign-up, calculation in your browser.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>My income is irregular — what do I use for incoming cash?</h3>
      <p>
        Average the income you can reliably expect over several months. Do not
        count invoices that may pay late, or work you have not yet won.
      </p>
      <h3>Does runway include money I expect to earn?</h3>
      <p>
        No. Runway counts only cash on hand. Expected income lowers your net
        burn only when it is reliable enough to count on each month.
      </p>
      <h3>Can I count a credit card or a credit line as cash?</h3>
      <p>
        No. Credit is borrowed money, not cash on hand. Counting it would
        overstate how long your own money lasts.
      </p>
      <h2>Source and limits</h2>
      <p>
        A runway estimate is only as good as its inputs. It assumes your costs
        stay roughly steady, and it does not predict late payments, emergencies,
        or new clients. It is a planning tool, not a forecast and not financial
        advice.
      </p>
      <p>
        <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>    </GuideArticle>
  );
}
