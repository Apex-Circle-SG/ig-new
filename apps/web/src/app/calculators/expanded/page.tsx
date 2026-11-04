import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All calculators — 88 free finance calculators',
  description:
    '88 free personal finance calculators. Every calculation runs in your browser. No sign-up, no data sent anywhere. Rates are inputs you enter, never presented as facts.',
  alternates: { canonical: '/calculators/expanded/' },
};

export default function ExpandedCalculatorsPage() {
  return (
    <iframe
      title="Private finance calculators"
      src="/private-expanded/"
      sandbox="allow-scripts allow-forms"
      referrerPolicy="no-referrer"
      style={{ width: '100%', height: '85vh', minHeight: 600, border: 0 }}
    />
  );
}
