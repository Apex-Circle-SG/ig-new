import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { casinoTools } from '../../../../lib/casino/probability';
import CasinoCalculator from './calculator';

export function generateStaticParams() {
  return casinoTools.map((tool) => ({ tool: tool.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool: id } = await params;
  const tool = casinoTools.find((item) => item.id === id);
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
  if (!tool) notFound();
  return <CasinoCalculator tool={tool} />;
}
