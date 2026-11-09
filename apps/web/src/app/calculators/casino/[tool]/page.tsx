import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { casinoTools } from '../../../../lib/casino/probability';
import CasinoCalculator from './calculator';
import { casinoLabs } from '../../../../lib/casino/catalogue';
import { SiteLink as Link } from '@insightginie/ui';
import CasinoLab from '../lab/lab';
import { LabFooter } from '../lab/shared';
import styles from '../lab/lab.module.css';

export function generateStaticParams() {
  return [...casinoTools, ...casinoLabs].map((tool) => ({ tool: tool.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: id } = await params;
  const tool = [...casinoTools, ...casinoLabs].find((item) => item.id === id);
  return tool
    ? {
        title: tool.title,
        description: tool.description,
        alternates: { canonical: `/calculators/casino/${id}/` },
      }
    : {};
}
export default async function CalculatorPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool: id } = await params;
  const tool = casinoTools.find((item) => item.id === id);
  if (tool) return <CasinoCalculator tool={tool} />;
  const lab = casinoLabs.find((item) => item.id === id);
  if (!lab) notFound();
  return (
    <div className={`shell ${styles.page}`}>
      <p>
        <Link href="/calculators/casino/">← Casino probability lab</Link>
      </p>
      <header>
        <p className={styles.eyebrow}>{lab.group.toUpperCase()} · VIRTUAL UNITS</p>
        <h1>{lab.title}</h1>
        <p className={styles.intro}>{lab.description}</p>
      </header>
      <CasinoLab id={lab.id} />
      <section className={styles.panel}>
        <h2>Rules & methods</h2>
        <p>{lab.url ? <a href={lab.url}>{lab.source}</a> : lab.source}</p>
        <p>
          Rule variants are stated beside each tool. Exact enumeration and sampled estimates are
          labelled separately. All game inputs and calculations stay in this browser. These
          experiments do not predict casino outcomes.
        </p>
      </section>
      <LabFooter />
    </div>
  );
}
