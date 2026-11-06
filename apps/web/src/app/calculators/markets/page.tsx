import type { Metadata } from 'next';
import { DealToolHub } from '../../../components/finance/deal-tool-hub';
export const metadata: Metadata = {
  title: 'Trading and market calculators',
  alternates: { canonical: '/calculators/markets/' },
};
export default function Page() {
  return <DealToolHub markets={true} />;
}
