'use client';

import { useState } from 'react';
import providers from '../../../../lib/library/payment-providers.json';
import roles from '../../../../lib/library/payment-source-roles.json';
import styles from '../../library.module.css';

const reviewed = [
  { name: 'Stripe', category: 'Payment platform', url: 'https://stripe.com/payments' },
  { name: 'Adyen', category: 'Payment platform', url: 'https://www.adyen.com/payments' },
  { name: 'Primer', category: 'Orchestration', url: 'https://primer.io/' },
  { name: 'Verifone', category: 'Terminal management', url: 'https://www.verifone.com/vhq-next-gen' },
  { name: 'Chargebee', category: 'Subscription billing', url: 'https://www.chargebee.com/docs/billing/2.0/getting-started/accessing_chargebee' },
  { name: 'Visa Acceptance Solutions', category: 'Dispute management', url: 'https://corporate.visa.com/en/solutions/acceptance/chargebacks.html' },
];

export function PaymentDirectory() {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const matches = (value: string) => value.toLowerCase().includes(q);
  const verified = reviewed.filter((entry) => matches(`${entry.name} ${entry.category}`));
  const other = providers.filter((entry) => matches(entry.name));
  const sourceRoles = roles.map((entry) => ({ ...entry, names: entry.names.filter((name) => matches(`${entry.role} ${name}`)) })).filter((entry) => entry.names.length);
  return <section aria-labelledby="provider-directory"><h2 id="provider-directory">Explore providers</h2>
    <label className={styles.search}><span>Search providers and services</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name or service" /></label>
    <h3>Reviewed examples</h3><p>Service descriptions are based on the linked provider pages; check current availability and terms.</p>
    <ul>{verified.map((entry) => <li key={entry.name}><a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name} ↗</a> — {entry.category}</li>)}</ul>
    <h3>Additional names from the source</h3><p>These links are starting points only. Services and market eligibility have not been individually verified; website reachability was checked in November 2026. A blocked check does not establish whether the business operates.</p>
    <ul>{other.map((entry) => <li key={entry.name}>{entry.url ? <a href={entry.url} target="_blank" rel="noopener noreferrer">{entry.name} ↗</a> : <strong>{entry.name}</strong>} — {entry.status}</li>)}</ul>
    <h3>Roles in the original notes</h3><p>The source grouped the following examples by role. These assignments have not been individually verified; names and services may have changed, and one company can cover several roles.</p>
    {sourceRoles.map((entry) => <details key={entry.role} open={Boolean(q)}><summary>{entry.role}</summary><p>{entry.names.join(', ')}</p></details>)}
    {verified.length === 0 && other.length === 0 && sourceRoles.length === 0 && <p>No providers found. Try another search.</p>}
  </section>;
}
