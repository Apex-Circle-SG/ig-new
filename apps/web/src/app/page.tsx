import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Globe2,
  Lightbulb,
  MousePointer2,
  Palette,
} from 'lucide-react';
import { safeJsonLd } from '@insightginie/seo';
import {
  catalog,
  type CatalogStats,
  type EarningMethod,
  type OpportunityResults,
} from '../lib/opportunities';
import styles from './home.module.css';

const routes = [
  {
    name: 'Find remote work',
    label: 'A role that fits your life',
    href: '/opportunities/',
    icon: Globe2,
    text: 'Explore employer-listed roles. Check the country, arrangement and listed pay before you apply.',
    color: 'violet',
  },
  {
    name: 'Get paid for your perspective',
    label: 'Research & testing',
    href: '/earn/paid-research/',
    icon: MousePointer2,
    text: 'Website testing, research interviews and mock juries. Learn how selection and eligibility work.',
    color: 'green',
  },
  {
    name: 'Make something worth selling',
    label: 'Creative services & products',
    href: '/earn/creative-services/',
    icon: Palette,
    text: 'Turn a useful skill into an offer, or explore templates, assets and other digital products.',
    color: 'peach',
  },
  {
    name: 'Try an unusual idea',
    label: 'Small business experiments',
    href: '/ideas/',
    icon: Lightbulb,
    text: 'Playful services and tiny businesses, with a possible buyer and a small experiment to try.',
    color: 'yellow',
  },
];
export default async function Home() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const [stats, roles, methods] = await Promise.all([
    catalog<CatalogStats>('/v1/stats'),
    catalog<OpportunityResults>('/v1/opportunities?category=jobs&paid=1'),
    catalog<{ items: EarningMethod[] }>('/v1/methods'),
  ]);
  const featuredIds = ['website-user-testing', 'mock-jury', 'sell-notion-templates'];
  const featured = featuredIds.flatMap((id) => methods?.items.find((m) => m.id === id) ?? []);
  const jobs =
    roles?.items
      .filter((job) => /\d/.test(job.reward))
      .filter(
        (job, index, items) =>
          items.findIndex((other) => other.organization === job.organization) === index,
      )
      .slice(0, 3) ?? [];
  return (
    <>
      <script
        type="application/ld+json"
        nonce={nonce}
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'InsightGinie',
            url: 'https://insightginie.com',
            description:
              'Remote opportunities, creative earning methods and practical decision tools.',
          }),
        }}
      />
      <section className={`shell ${styles.hero}`}>
        <div>
          <p className={styles.eyebrow}>YOUR NEXT MOVE STARTS HERE</p>
          <h1>
            Find your next
            <br />
            way to <span>earn.</span>
          </h1>
          <p className={styles.intro}>
            A remote role. A creative side project. A surprisingly useful skill. Discover
            possibilities—and what it actually takes to get started.
          </p>
          <div className={styles.actions}>
            <Link href="/opportunities/" className={styles.primary}>
              Find remote work <ArrowRight size={18} />
            </Link>
            <Link href="/earn/" className={styles.secondary}>
              Explore ways to earn <ArrowUpRight size={18} />
            </Link>
          </div>
          <div className={styles.checks}>
            <span>
              <Check size={15} /> Free to explore
            </span>
            <span>
              <Check size={15} /> No account needed
            </span>
            <span>
              <Check size={15} /> Original sources linked
            </span>
          </div>
        </div>
        <div className={styles.board}>
          <div className={styles.boardTop}>
            <span>THE POSSIBILITY BOARD</span>
            <span className={styles.dot}>Explore a different route</span>
          </div>
          <Link className={styles.spotlight} href="/earn/website-user-testing/">
            <div className={styles.motif} aria-hidden="true">
              <MousePointer2 size={42} />
              <span>“Where do I click?”</span>
            </div>
            <span className={styles.eyebrow}>PAID RESEARCH & TESTING</span>
            <h2>Your confusion can be useful feedback.</h2>
            <p>
              Some companies pay eligible participants to try websites and explain what’s confusing.
              You’ll need to qualify for each test.
            </p>
            <strong>
              See how website testing works <ArrowUpRight size={17} />
            </strong>
          </Link>
          <div className={styles.boardBottom}>
            <span>Curiosity → practical first step</span>
            <Link href="/earn/">
              Explore the methods <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>
      <div className={styles.band}>
        <div className={`shell ${styles.bandInner}`}>
          {stats ? (
            <>
              <span>
                <strong>{stats.opportunities.toLocaleString('en-US')}</strong> active source
                listings
              </span>
              <span>
                <strong>{stats.methods}</strong> earning guides
              </span>
              <span>
                <strong>{stats.ideas}</strong> business experiments
              </span>
            </>
          ) : (
            <span>Explore remote work, earning guides and business experiments</span>
          )}
          <Link href="/opportunities/sources/">
            See our sources & updates <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <section className={`shell ${styles.calculatorFeature}`}>
        <div>
          <p className={styles.eyebrow}>MAKE THE NUMBERS WORK</p>
          <h2>Understand where you stand.</h2>
          <p>
            Compare your income, explore cash runway and see what automation really costs. Free
            calculators. No account needed. Your inputs stay in your browser.
          </p>
        </div>
        <Link href="/calculators/" className={styles.primary}>
          Explore calculators <ArrowRight size={18} />
        </Link>
      </section>
      <section className={`shell ${styles.section}`}>
        <div className={styles.sectionTop}>
          <div>
            <p className={styles.eyebrow}>CHOOSE YOUR STARTING POINT</p>
            <h2>More than one way forward.</h2>
          </div>
          <p>Find a route that matches your skills, time and curiosity.</p>
        </div>
        <div className={styles.routes}>
          {routes.map(({ icon: Icon, ...route }) => (
            <Link
              key={route.href}
              href={route.href}
              className={`${styles.route} ${styles[route.color]}`}
            >
              <Icon size={29} />
              <span className={styles.eyebrow}>{route.label}</span>
              <h3>{route.name}</h3>
              <p>{route.text}</p>
              <span className={styles.routeArrow}>
                <ArrowUpRight size={22} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className={styles.workSection}>
        <div className={`shell ${styles.section}`}>
          <div className={styles.sectionTop}>
            <div>
              <p className={styles.eyebrow}>REMOTE WORK · SOURCE-LISTED PAY</p>
              <h2>A few roles to explore.</h2>
            </div>
            <Link href="/opportunities/" className={styles.textLink}>
              Browse all opportunities <ArrowRight size={17} />
            </Link>
          </div>
          {jobs.length ? (
            <div className={styles.jobs}>
              {jobs.map((job) => (
                <article key={job.id} className={styles.job}>
                  <span className={styles.eyebrow}>{job.organization}</span>
                  <h3>
                    <Link href={`/opportunities/${job.id}/`}>{job.title}</Link>
                  </h3>
                  <p className={styles.pay}>{job.reward}</p>
                  <p>
                    <Globe2 size={16} /> {job.location}
                  </p>
                  <p>{job.employment_type || 'Arrangement not supplied'}</p>
                  <div className={styles.jobFoot}>
                    <span>Via {job.source_name}</span>
                    <Link href={`/opportunities/${job.id}/`}>
                      See the role <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <p>
              We couldn’t load paid-role examples right now.{' '}
              <Link href="/opportunities/">Browse the opportunity catalog →</Link>
            </p>
          )}
          <p className={styles.note}>
            Remote can be restricted to specific countries. Pay and eligibility come from the
            source; confirm current details with the employer.
          </p>
        </div>
      </section>
      <section className={`shell ${styles.section}`}>
        <div className={styles.sectionTop}>
          <div>
            <p className={styles.eyebrow}>BEYOND THE JOB BOARD</p>
            <h2>“Wait, that’s a way to earn?”</h2>
          </div>
          <Link href="/earn/" className={styles.textLink}>
            Explore all earning guides <ArrowRight size={17} />
          </Link>
        </div>
        <div className={styles.methods}>
          {featured.map((method, index) => (
            <article key={method.id} className={styles.method}>
              <div
                className={`${styles.methodArt} ${styles[['green', 'peach', 'violet'][index]]}`}
                aria-hidden="true"
              >
                <span>
                  {['Speak your mind.', 'Consider the case.', 'Package your process.'][index]}
                </span>
                <span className={styles.artNumber}>0{index + 1}</span>
              </div>
              <span className={styles.eyebrow}>{method.category}</span>
              <h3>
                <Link href={`/earn/${method.id}/`}>{method.title}</Link>
              </h3>
              <p>{method.description}</p>
              <Link href={`/earn/${method.id}/`} className={styles.textLink}>
                See the first step <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
        {!featured.length && (
          <p>
            Our earning guides are temporarily unavailable.{' '}
            <Link href="/earn/">Try the guide directory →</Link>
          </p>
        )}
        <p className={styles.note}>
          These are methods to explore, not available paid assignments or promises of income.
        </p>
      </section>
      <section className={`shell ${styles.bottom}`}>
        <div>
          <p className={styles.eyebrow}>SMALL EXPERIMENT. REAL LEARNING.</p>
          <h2>
            You don’t need a million-dollar idea.
            <br />
            Start with one useful offer.
          </h2>
          <p>
            Explore unusual services and tiny businesses. Each idea includes a potential buyer, a
            first experiment and the catch.
          </p>
          <Link href="/ideas/" className={styles.primary}>
            Find an idea to test <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
