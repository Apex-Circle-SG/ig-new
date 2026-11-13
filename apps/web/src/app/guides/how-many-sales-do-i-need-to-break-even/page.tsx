import type { Metadata } from 'next';
import Link from 'next/link';
import GuideArticle from '../../../components/guide-article';

export const metadata: Metadata = {
  title: 'How many sales do I need to break even?',
  description:
    'Break-even units are your total fixed costs divided by the contribution margin (selling price minus variable cost per unit). Run your own figures in the free break-even calculator — no sign-up, calculation in your browser.',
  alternates: { canonical: '/guides/how-many-sales-do-i-need-to-break-even/' },
};

export default function HowManySalesDoINeedToBreakEven() {
  return (
    <GuideArticle
      title="How many sales do I need to break even?"
      answer={<>
        <strong>Answer first:</strong> Break-even units = total fixed costs ÷
        (selling price per unit − variable cost per unit). Break-even revenue =
        break-even units × selling price. Break-even is not profit — profit
        starts only on sales above that point.
      </>}
    >
      <h2>The formula, in plain terms</h2>
      <p>
        Every sale first covers its own variable cost — the cost of making or
        delivering that one unit. What is left over, the contribution margin,
        goes toward the fixed costs that do not change with sales, such as rent
        and subscriptions. Once enough sales have contributed enough margin to
        cover all the fixed costs, you are at break-even. Every sale after that
        adds its contribution margin as profit.
      </p>
      <h2>What counts as fixed and what counts as variable</h2>
      <p>
        Fixed costs stay roughly the same whether you sell one unit or a
        thousand: rent, software subscriptions, insurance, and a base salary.
        Variable costs rise with each sale: materials, packaging, payment
        processing fees, and delivery per order. Put a cost in the wrong group
        and the break-even point will be wrong, so check each cost against the
        question: does it grow when I sell one more unit?
      </p>
      <h2>A worked example</h2>
      <p>
        Fixed costs: $5,000 a month. Selling price: $50 per unit. Variable
        cost: $30 per unit. The contribution margin is $50 − $30 = $20 per
        unit. Break-even units are $5,000 ÷ $20 = 250 units a month.
        Break-even revenue is 250 × $50 = $12,500. At 250 units, revenue of
        $12,500 exactly matches costs of $5,000 fixed plus 250 × $30 =
        $7,500 variable. The 251st sale is the first one that earns a profit.
      </p>
      <h2>Check your own figures</h2>
      <p>
        Run your own fixed costs, price, and variable cost in the free
        break-even calculator in the calculators hub — free, no sign-up,
        calculation in your browser.
      </p>
      <h2>Frequently asked questions</h2>
      <h3>Is break-even the same as making a profit?</h3>
      <p>
        No. At break-even, revenue exactly covers costs and profit is zero.
        Profit starts only on sales above the break-even point.
      </p>
      <h3>What if I sell more than one product?</h3>
      <p>
        Work out the contribution margin for each product separately, then
        use the average margin weighted by how much of each product you sell.
        A single break-even figure only works when the sales mix stays the
        same.
      </p>
      <h3>What if my price or costs change?</h3>
      <p>
        Re-run the calculation. A lower price or a higher variable cost
        shrinks the contribution margin and pushes break-even higher; a higher
        price or lower variable cost does the opposite.
      </p>
      <h2>Source and limits</h2>
      <p>
        The result assumes price and variable cost stay constant and that
        every unit sells at that price. It does not account for discounts,
        unsold stock, taxes, or changing costs. It is a planning estimate,
        not a guarantee of sales or profit, and not financial advice.
      </p>
      <p>
        <Link href="/calculators/">All calculators</Link>
        {' '}· <Link href="/guides/">All guides</Link>
      </p>
    </GuideArticle>
  );
}
