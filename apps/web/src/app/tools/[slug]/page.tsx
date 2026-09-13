import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import {
  calculateFinancialTool,
  FINANCE_FORMULA_VERSION,
  FINANCE_TOOLS,
  formatFinanceValue,
  getFinanceTool,
} from '@insightginie/calculators';
import { breadcrumbSchema, safeJsonLd, webApplicationSchema } from '@insightginie/seo';
import { SiteLink as Link } from '@insightginie/ui';
import { PrivateFinanceTool } from '../../../components/finance/private-finance-tool';
import { FinanceTrust } from '../../../components/finance-trust';
import styles from '../../../components/finance/finance-tool.module.css';
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tool = getFinanceTool((await params).slug);
  if (!tool) return { title: 'Tool not found', robots: { index: false, follow: false } };
  return {
    title: tool.title,
    description: tool.description,
    alternates: { canonical: `/tools/${tool.id}/` },
    openGraph: {
      title: tool.title,
      description: tool.description,
      url: `/tools/${tool.id}/`,
      siteName: 'InsightGinie',
      type: 'website',
      images: ['/opengraph-image/'],
    },
  };
}
export default async function ToolPage({ params }: Props) {
  const tool = getFinanceTool((await params).slug);
  if (!tool) notFound();
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const example = calculateFinancialTool(tool.id, tool.defaultInputs);
  return (
    <div className={`shell ${styles.page}`}>
      <script
        nonce={nonce}
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd([
            breadcrumbSchema([
              { name: 'Home', path: '/' },
              { name: 'Tools', path: '/tools/' },
              { name: tool.title, path: `/tools/${tool.id}/` },
            ]),
            webApplicationSchema(tool.title, `/tools/${tool.id}/`, tool.description),
          ]),
        }}
      />
      <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/tools/">Tools</Link>
        <span aria-hidden="true">/</span>
        <span>{tool.title}</span>
      </nav>
      <header className={styles.header}>
        <div className={styles.eyebrow}>{tool.category}</div>
        <h1>{tool.title}</h1>
        <p>{tool.description}</p>
        <div className={styles.badges}>
          <span>Private in your browser</span>
          <span>No account required</span>
          <span>Transparent formula</span>
        </div>
      </header>
      <PrivateFinanceTool toolId={tool.id} />
      <div className={styles.sections}>
        <section className={styles.section} id="methodology">
          <h2>How this calculation works</h2>
          <ol>
            {tool.methodology.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ol>
        </section>
        <aside className={`${styles.example} ${styles.section}`}>
          <h2>A worked example</h2>
          <p>
            These public example inputs are illustrative. Your private scenario does not change this
            example.
          </p>
          <dl>
            {tool.fields.map((field) => (
              <div key={field.key}>
                <dt>{field.label}</dt>
                <dd>
                  {Array.isArray(field.defaultValue)
                    ? field.defaultValue
                        .map((value) => formatFinanceValue(value, 'currency'))
                        .join(' · ')
                    : formatFinanceValue(
                        field.defaultValue,
                        field.unit === '$' ? 'currency' : field.unit === '%' ? 'percent' : 'number',
                      )}
                  {field.unit && !['$', '%'].includes(field.unit) ? ` ${field.unit}` : ''}
                </dd>
              </div>
            ))}
          </dl>
          <dl>
            {example.rows.slice(0, 2).map((row) => (
              <div key={row.label}>
                <dt>{row.label}</dt>
                <dd>{formatFinanceValue(row.value, row.format)}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </div>
      <FinanceTrust
        sources={tool.sources}
        publishedAt="2026-09-13"
        updatedAt="2026-09-13"
        formulaVersion={FINANCE_FORMULA_VERSION}
        methodologyPath="/research-methodology/"
      />
      <section className={styles.related}>
        <h2>Keep exploring</h2>
        <ul>
          {FINANCE_TOOLS.filter(
            (candidate) => candidate.id !== tool.id && candidate.category === tool.category,
          )
            .slice(0, 3)
            .map((candidate) => (
              <li key={candidate.id}>
                <Link href={`/tools/${candidate.id}/`}>{candidate.title}</Link>
              </li>
            ))}
          <li>
            <Link href="/tools/">All finance tools</Link>
          </li>
          <li>
            <Link href="/ask/">Ask InsightGinie</Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
