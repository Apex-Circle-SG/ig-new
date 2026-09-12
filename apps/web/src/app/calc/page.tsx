import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowUpRight, BarChart3 } from 'lucide-react';
export const metadata: Metadata = {
  title: 'Calculators',
  description:
    'Explore personal income with source-backed, private calculators. Start with your US individual income percentile.',
  alternates: { canonical: '/calc/' },
};
export default function Calculators() {
  return (
    <div className="shell listing-page">
      <div className="eyebrow">YOUR NUMBERS, WITH CONTEXT</div>
      <h1>A good place to start.</h1>
      <p className="page-lead">Useful calculations. Real sources. A clearer next move.</p>
      <Link prefetch={false} href="/calc/individual-income-percentile/" className="catalog-card">
        <span className="feature-icon violet">
          <BarChart3 />
        </span>
        <div>
          <span className="pill available">Available now</span>
          <h2>Individual income percentile</h2>
          <p>Compare your annual income with the US population age 15 and over.</p>
        </div>
        <ArrowUpRight />
      </Link>
      <section className="roadmap-note">
        <h2>One useful insight at a time.</h2>
        <p>
          Household income, cost of living, equivalent salary and take-home pay are next. Each tool
          will appear here once its data and calculations are validated.
        </p>
        <Link prefetch={false} href="/methodology/">
          How we validate our calculations →
        </Link>
      </section>
    </div>
  );
}
