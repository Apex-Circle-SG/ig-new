import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getKnowledgeArticles } from '../../../../lib/library';
import styles from '../../library.module.css';
import { SecurityQuestions } from './security-questions';
import { PaymentDirectory } from './payment-directory';
import { SystemCommands } from './system-commands';
import { GamesDirectory } from './games-directory';
import { AiGuide } from './ai-guide';
import { CollectionGuide, isCollectionArticle } from './collection-guide';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }>; searchParams?: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = (await getKnowledgeArticles()).find((item) => item.slug === slug);
  return article ? { title: article.title, description: article.summary, alternates: { canonical: `/library/knowledge/${article.slug}/` } } : {};
}

export default async function KnowledgePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const articles = await getKnowledgeArticles();
  const article = articles.find((item) => item.slug === slug);
  if (!article) notFound();
  if (isCollectionArticle(article.slug)) {
    const query = article.slug === 'academic-reference-catalogue' ? await searchParams : undefined;
    return <CollectionGuide article={article} articles={articles} referenceId={typeof query?.reference === 'string' ? query.reference : undefined} />;
  }
  if (article.topic === 'Artificial intelligence') return <AiGuide article={article} articles={articles} />;
  const related = articles.filter((item) => item.slug !== slug && item.topic === article.topic && item.group === article.group).slice(0, 3);
  return <article className={`shell ${styles.article}`}>
    <a href="/library/" className={styles.back}>← Back to Library</a>
    <header><div className={styles.eyebrow}>{article.topic} · {article.group}</div><h1>{article.title}</h1><p className={styles.articleSummary}>{article.summary}</p></header>
    <p className={styles.note}>Adapted from the knowledge collection. Educational information; verify changing details before making decisions.</p>
    <nav className={styles.contents} aria-label="On this page"><strong>On this page</strong><ol>{article.sections.map((section, index) => <li key={section.heading}><a href={`#section-${index + 1}`}>{section.heading}</a></li>)}</ol></nav>
    {article.sections.map((section, index) => <section key={section.heading} id={`section-${index + 1}`}><h2>{section.heading}</h2><p>{section.body}</p></section>)}
    {article.slug === 'games-source-directory' && <GamesDirectory />}
    {article.slug === 'real-world-assets' && <p><Link href="/library/knowledge/property-housing/">Explore property and housing →</Link> · <Link href="/library/knowledge/singapore-land-title/">Understand Singapore property titles →</Link></p>}
    {article.slug === 'metaverse-history' && <p><Link href="/library/knowledge/games-source-directory/">Browse the games source directory →</Link> · <Link href="/library/knowledge/blockchain-layers/">Explore blockchain layers →</Link></p>}
    {article.slug === 'games-source-directory' && <p><Link href="/library/knowledge/metaverse-history/">Explore the metaverse timeline →</Link> · <Link href="/calculators/roulette/">Explore roulette probability →</Link></p>}
    {article.slug === 'system-administration' && <section><h2>Explore system administration</h2><div className={styles.sciencePaths}><div><h3>Linux</h3><ul><li><Link href="/library/knowledge/linux-everyday/">Everyday operations</Link></li><li><Link href="/library/knowledge/linux-remote-development/">Remote access and development</Link></li><li><Link href="/library/knowledge/linux-maintenance/">Maintenance and cleanup</Link></li></ul></div><div><h3>Operating systems</h3><ul><li><Link href="/library/knowledge/privacy-operating-systems/">Privacy and security systems</Link></li><li><Link href="/library/knowledge/windows-ssh-wireless/">Windows SSH and wireless reports</Link></li><li><Link href="/library/knowledge/cybersecurity/">Cybersecurity essentials</Link></li></ul></div></div></section>}
    <SystemCommands slug={article.slug} />
    {article.group === 'Systems and operations' && article.slug !== 'system-administration' && <p><Link href="/library/knowledge/system-administration/">Explore system administration →</Link></p>}
    {article.slug === 'linux-maintenance' && <p><Link href="/library/knowledge/containers-and-cloud/">Explore containers and cloud infrastructure →</Link></p>}
    {article.slug === 'windows-ssh-wireless' && <p><Link href="/library/knowledge/linux-remote-development/">Linux remote access and development →</Link></p>}
    {article.slug === 'payments' && <section><h2>Explore payments</h2><div className={styles.sciencePaths}><div><h3>Learn the basics</h3><ul><li><Link href="/library/knowledge/payment-flow/">How a card payment works</Link></li><li><Link href="/library/knowledge/payment-stack/">The payment stack</Link></li></ul></div><div><h3>Compare services</h3><ul><li><Link href="/library/knowledge/payment-providers/">Payment provider directory</Link></li><li><Link href="/library/knowledge/cybersecurity/">Cybersecurity essentials</Link></li></ul></div></div></section>}
    {article.slug === 'payment-flow' && <section aria-label="Card payment overview"><h2>A card payment at a glance</h2><div className={styles.scienceFlow}><span>Checkout</span><span>Authorization</span><span>Clearing</span><span>Settlement</span><span>Merchant payout</span></div><p>This is a simplified flow; steps and timing vary.</p></section>}
    {article.slug === 'payment-providers' && <PaymentDirectory />}
    {article.topic === 'Payments' && article.slug !== 'payments' && <p><Link href="/library/knowledge/payments/">Explore the payments hub →</Link></p>}
    {article.slug === 'payment-stack' && <p><Link href="/library/knowledge/api-fundamentals/">Explore API fundamentals →</Link> · <Link href="/library/knowledge/security-controls/">Security controls →</Link></p>}
    {article.slug === 'quantum-science' && <section><h2>Choose a path</h2><div className={styles.sciencePaths}><div><h3>Quantum technology and security</h3><ul><li><Link href="/library/knowledge/quantum-entanglement/">Entanglement and key distribution</Link></li><li><Link href="/library/knowledge/shors-algorithm/">Shor’s algorithm</Link></li><li><Link href="/library/knowledge/post-quantum-cryptography/">Lattices, ML-KEM and SLH-DSA</Link></li></ul></div><div><h3>Physics and the universe</h3><ul><li><Link href="/library/knowledge/light-and-attoseconds/">Light and attoseconds</Link></li><li><Link href="/library/knowledge/gravity-and-expanding-universe/">Gravity and cosmic expansion</Link></li></ul></div></div></section>}
    {article.slug === 'quantum-entanglement' && <section aria-label="Key distribution overview"><h2>From quantum states to a key</h2><div className={styles.scienceFlow}><span>Share states</span><span>Measure</span><span>Check errors</span><span>Derive key</span></div><p>Participants also use an authenticated classical channel. The steps vary by protocol.</p></section>}
    {article.slug === 'post-quantum-cryptography' && <section aria-label="Cryptography comparison"><h2>Two different jobs</h2><div className={styles.sciencePaths}><div><h3>ML-KEM</h3><p>Establish shared key material</p></div><div><h3>SLH-DSA</h3><p>Sign and verify messages</p></div></div></section>}
    {article.topic === 'Science & Quantum' && article.slug !== 'quantum-science' && <p><Link href="/library/knowledge/quantum-science/">Explore science and quantum →</Link></p>}
    {(article.slug === 'post-quantum-cryptography' || article.slug === 'shors-algorithm') && <p><Link href="/library/knowledge/cybersecurity/">Explore the cybersecurity hub →</Link></p>}
    {article.slug === 'cybersecurity' && <p><Link href="/library/knowledge/post-quantum-cryptography/">Explore post-quantum cryptography →</Link></p>}
    {article.slug === 'cybersecurity' && <section><h2>Explore cybersecurity</h2><ul><li><Link href="/library/knowledge/cyber-attacks/">Common cyberattacks</Link></li><li><Link href="/library/knowledge/network-spoofing/">Network interception and spoofing</Link></li><li><Link href="/library/knowledge/security-controls/">Security controls and operations</Link></li><li><Link href="/library/knowledge/security-questionnaire/">Security assessment questionnaire</Link></li></ul></section>}
    {article.slug === 'security-questionnaire' && <SecurityQuestions />}
    {article.topic === 'Cybersecurity' && article.slug !== 'cybersecurity' && <p><Link href="/library/knowledge/cybersecurity/">Explore the cybersecurity hub →</Link></p>}
    {article.slug === 'network-spoofing' && <p><Link href="/library/knowledge/networking-osi/">Read the networking and OSI guide →</Link></p>}
    {article.slug === 'security-controls' && <p><Link href="/library/knowledge/api-fundamentals/">Read the API fundamentals guide →</Link></p>}
    {article.topic === 'Technology' && <p><Link href="/library/knowledge/technology/">Explore the Technology hub →</Link> · <Link href="/library/knowledge/project-management/">Explore Project Management →</Link></p>}
    {related.length > 0 && <section><h2>Related knowledge</h2><ul>{related.map((item) => <li key={item.slug}><a href={`/library/knowledge/${item.slug}/`}>{item.title}</a></li>)}</ul></section>}
    {article.relatedToolCategory && <section><h2>Related tools</h2><a href={`/library/?tools=${encodeURIComponent(article.relatedToolCategory)}#tools-heading`}>Explore {article.relatedToolCategory} tools →</a></section>}
    <section><h2>Further reading</h2><ul>{article.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} ↗</a></li>)}</ul></section>
  </article>;
}
