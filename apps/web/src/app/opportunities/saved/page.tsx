import type { Metadata } from 'next';
import { OpportunityNavigation } from '../../../components/opportunity-navigation';
import { SavedOpportunities } from '../../../components/opportunity-save';
import styles from '../../../components/opportunities.module.css';
export const metadata: Metadata = {
  title: 'Your saved opportunities',
  alternates: { canonical: '/opportunities/saved/' },
  robots: { index: false, follow: false },
};
export default function Saved() {
  return (
    <div className={`shell ${styles.page}`}>
      <OpportunityNavigation current="/opportunities/" />
      <header className={styles.hero}>
        <span className={styles.eyebrow}>Keep a shortlist</span>
        <h1>Your saved opportunities.</h1>
        <p>
          Stored locally in this browser, with no account required. Saved roles may expire; check
          the original listing before applying.
        </p>
      </header>
      <SavedOpportunities />
    </div>
  );
}
