import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteLink as Link } from '@insightginie/ui';
import { getContentBySlug, contentPublication } from '../../../lib/content';
import styles from '../content.module.css';

type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const article = getContentBySlug((await params).slug);
  if (!article) return { title: 'Article not found', robots: { index: false, follow: false } };
  const publication = contentPublication(article);
  return {
    title: article.title,
    description: article.excerpt.slice(0, 160),
    alternates: { canonical: publication.canonical },
    robots: { index: publication.indexable, follow: true },
    openGraph: {
      type: 'article',
      title: article.title,
      description: article.excerpt.slice(0, 160),
      url: publication.canonical,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
      authors: [article.author.name],
    },
  };
}

export default async function Insight({ params }: Props) {
  const article = getContentBySlug((await params).slug);
  if (!article) notFound();
  const publication = contentPublication(article);
  const date = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { dateStyle: 'long', timeZone: 'UTC' });
  return (
    <div className={`${styles.page} ${styles.article}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/insights/">Insights</Link> / Article
      </nav>
      <p className={styles.eyebrow}>
        {publication.preview ? 'Preserved article · migration preview' : 'From the publication'}
      </p>
      <h1>{article.title}</h1>
      <div className={styles.meta}>
        <span>By {article.author.name}</span>
        <span>
          Published <time dateTime={article.publishedAt}>{date(article.publishedAt)}</time>
        </span>
        <span>
          Updated <time dateTime={article.updatedAt}>{date(article.updatedAt)}</time>
        </span>
      </div>
      {publication.preview && (
        <aside className={`${styles.notice} ${styles.section}`} aria-label="Publication status">
          <p>
            <strong>This is a preserved preview of the original article.</strong>
          </p>
          <p>
            Original author attribution and publication dates are retained. This article has not
            received a new InsightGinie editorial or professional review. Some source embeds may be
            omitted for safe display.
          </p>
          <a href={article.originalUrl} rel="noopener noreferrer">
            Read the original publication →
          </a>
        </aside>
      )}
      {article.featuredMedia && (
        <figure className={styles.figure}>
          {/* Public source image and its original caption; no remote image optimizer fetch. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.heroImage}
            src={article.featuredMedia.url}
            alt={article.featuredMedia.alt}
            width={article.featuredMedia.width ?? undefined}
            height={article.featuredMedia.height ?? undefined}
            referrerPolicy="no-referrer"
            loading="lazy"
          />
          {article.featuredMedia.captionHtml && (
            <figcaption
              className={styles.caption}
              dangerouslySetInnerHTML={{ __html: article.featuredMedia.captionHtml }}
            />
          )}
        </figure>
      )}
      <article
        className={styles.prose}
        aria-label="Preserved article content"
        dangerouslySetInnerHTML={{ __html: article.html }}
      />
      <section className={styles.section}>
        <h2>Source and preservation details</h2>
        <p className={styles.lead}>
          Content retrieved {date(article.retrievedAt)}. The source publication owns the original
          attribution; preserving it does not verify every claim.
        </p>
        <div className={styles.actions}>
          <a href={article.originalUrl} rel="noopener noreferrer">
            Original article
          </a>
          <Link href="/editorial-policy/">Editorial policy</Link>
          <Link href="/insights/">More insights</Link>
        </div>
        {article.warnings.length > 0 && (
          <ul>
            {article.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
