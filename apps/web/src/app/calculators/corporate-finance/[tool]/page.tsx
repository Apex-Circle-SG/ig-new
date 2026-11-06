import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDealTool } from '@insightginie/calculators/deals';
import { DealToolPage } from '../../../../components/finance/deal-tool-page';
type Props = { params: Promise<{ tool: string }> };
const find = (id: string) => {
  const t = getDealTool(id);
  return t?.id !== 'vwap-volume' ? t : undefined;
};
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = find((await params).tool);
  return t
    ? { title: t.title, description: t.description, alternates: { canonical: t.path } }
    : { title: 'Tool not found', robots: { index: false } };
}
export default async function Page({ params }: Props) {
  const t = find((await params).tool);
  if (!t) notFound();
  return <DealToolPage tool={t} />;
}
