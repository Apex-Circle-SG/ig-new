import type { Metadata } from 'next';
import { Document } from '../../components/document';
import { getSiteEntries, sitemapGroup } from '../../lib/site-index';
export const metadata: Metadata = {
  title: 'Content Index — All Published Tools and Pages',
  description:
    'Browse InsightGinie tools, research, data sources, methodology and policies in one human-readable index.',
  alternates: { canonical: '/content-index/' },
};
export default function ContentIndex() {
  const entries = getSiteEntries().filter((entry) => entry.path !== '/content-index/');
  return (
    <Document
      title="Find your next useful page."
      eyebrow="CONTENT INDEX"
      lead="A complete index of the published tools, data and policies. Editorial drafts and migration previews are excluded."
    >
      {(['tools', 'content', 'site'] as const).map((group) => (
        <section key={group}>
          <h2>
            {group === 'tools'
              ? 'Interactive tools'
              : group === 'content'
                ? 'Insights and research'
                : 'Data, methods and site information'}
          </h2>
          <ul>
            {entries
              .filter((entry) => sitemapGroup(entry.path) === group)
              .map((entry) => (
                <li key={entry.path}>
                  <a href={entry.path}>{entry.title}</a>
                </li>
              ))}
          </ul>
        </section>
      ))}
      <section>
        <h2>Follow published insights</h2>
        <p>
          <a href="/feed.xml">Subscribe using RSS</a>. Only approved published articles enter the
          editorial feed.
        </p>
      </section>
    </Document>
  );
}
