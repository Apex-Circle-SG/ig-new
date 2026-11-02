import type { ReactNode } from 'react';
import styles from './guide-article.module.css';

/**
 * Shared template for every InsightGinie guide page.
 *
 * New guides must use this component instead of hand-writing their own
 * <main> markup: it guarantees the site shell, eyebrow, title size,
 * answer callout, section spacing and link styling stay identical, and it
 * avoids a second <main> nested inside the root layout's <main>.
 */
export default function GuideArticle({
  title,
  intro,
  answer,
  children,
}: {
  title: string;
  intro?: string;
  answer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="shell">
      <article className={styles.article}>
        <div className={styles.eyebrow}>US income, explained in bands</div>
        <h1>{title}</h1>
        {intro ? <p className={styles.intro}>{intro}</p> : null}
        {answer ? <div className={styles.answer}>{answer}</div> : null}
        {children}
      </article>
    </div>
  );
}
