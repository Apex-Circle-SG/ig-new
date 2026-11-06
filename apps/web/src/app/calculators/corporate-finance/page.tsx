import type { Metadata } from 'next';
import { DealToolHub } from '../../../components/finance/deal-tool-hub';
export const metadata: Metadata = {
  title: 'Corporate finance and deal calculators',
  alternates: { canonical: '/calculators/corporate-finance/' },
};
export default function Page() {
  return <DealToolHub markets={false} />;
}
