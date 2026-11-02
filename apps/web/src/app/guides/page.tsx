import type { Metadata } from 'next';
import Link from 'next/link';
import { GUIDES } from './guides';
import styles from '../../components/guide-article.module.css';

export const metadata: Metadata = {
  title: 'Guides: US income, explained in bands',
  description:
    'Short, source-grounded guides to US individual income, using only published Census income bands — no pinpoint percentile is claimed.',
  alternates: { canonical: '/guides/' },
};

export default function GuidesIndex() {
  return (
    <div className="shell">
      <article className={styles.article}>
        <div className={styles.eyebrow}>US income, explained in bands</div>
        <h1>Guides: US income, explained in bands</h1>
        <p>
          These guides use only published income bands from the US Census Bureau, CPS ASEC
          PINC-11, 2024 income, for US individuals age 15 and over, before tax, including
          people with no income or losses. They are not household, employed-only, or
          full-time-only figures.
        </p>
        <ul>
          {GUIDES.map((guide) => (
            <li key={guide.href}>
              <Link href={guide.href}>{guide.title}</Link>
              <p>{guide.summary}</p>
            </li>
          ))}
        </ul>
        <p>
          Check your own band with the free calculator, no sign-up:{' '}
          <Link href="/calc/individual-income-percentile/">Income calculator</Link>
          {' '}· Explore the full data:{' '}
          <Link href="/data/us-income-distribution/">US income distribution</Link>
          {' '}· All calculators:{' '}
          <Link href="/calculators/">Calculators</Link>
        </p>
      </article>
    </div>
  );
}
