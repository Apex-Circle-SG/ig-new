import type { Metadata } from 'next';
import { getDealTool } from '@insightginie/calculators/deals';
import { DealToolPage } from '../../../../components/finance/deal-tool-page';
const tool = getDealTool('vwap-volume')!;
export const metadata: Metadata = {
  title: tool.title,
  description: tool.description,
  alternates: { canonical: tool.path },
};
export default function Page() {
  return <DealToolPage tool={tool} />;
}
