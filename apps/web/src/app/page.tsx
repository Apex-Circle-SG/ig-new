import { headers } from 'next/headers';
import { SiteLink as Link } from '@insightginie/ui';
import {
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Check,
  CircleDollarSign,
  Compass,
  Database,
  Fingerprint,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getIndividualIncomeDistribution } from '@insightginie/datasets';
import { calculateIndividualIncomePercentile } from '@insightginie/calculators';
import { safeJsonLd } from '@insightginie/seo';
import { IncomeTool } from '../components/income-tool';
import { Command } from '../components/command';
export default async function Home() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;
  const distribution = getIndividualIncomeDistribution();
  const initialOutput = calculateIndividualIncomePercentile(
    { annualIncome: 75000 },
    {
      distribution,
      calculatedAt: distribution?.datasetVersion.retrievedAt ?? '2026-09-12T00:00:00.000Z',
    },
  );
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
            description: 'Personal income comparisons based on public US data.',
          }),
        }}
      />
      <section className="hero shell">
        <div className="hero-copy">
          <div className="eyebrow">
            <span className="tiny-spark">✦</span> A LITTLE PERSPECTIVE CHANGES EVERYTHING
          </div>
          <h1>
            Understand
            <br />
            where you <span>stand.</span>
          </h1>
          <p className="hero-description">
            Your numbers tell a story. See how your income compares, understand the context, and
            explore what could come next.
          </p>
          <Command />
          <div className="hero-suggestions">
            <span>Start here</span>
            <Link prefetch={false} href="/calc/individual-income-percentile/">
              How does my income compare? <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="hero-reassurance">
            <span>
              <Check size={15} /> Free to explore
            </span>
            <span>
              <Check size={15} /> No account needed
            </span>
            <span>
              <Check size={15} /> Real US data
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="preview-orbit orbit-one" />
          <div className="preview-orbit orbit-two" />
          <div className="preview-label">
            <Sparkles size={14} /> A number becomes an insight
          </div>
          <IncomeTool distribution={distribution} initialOutput={initialOutput} compact />
          <div className="preview-footnote">
            <LockIcon />
            Your financial picture belongs to you.
          </div>
        </div>
      </section>
      <div className="trust-strip">
        <div className="shell trust-strip-inner">
          <span>
            REAL SOURCES.
            <br />
            <strong>A CLEARER PICTURE.</strong>
          </span>
          <div>
            <Database size={23} />
            <span>
              US Census Bureau<small>Our first income dataset</small>
            </span>
          </div>
          <div>
            <ShieldCheck size={24} />
            <span>
              Transparent methods<small>Every assumption explained</small>
            </span>
          </div>
          <div>
            <Fingerprint size={24} />
            <span>
              Private by design<small>Your income stays in your browser</small>
            </span>
          </div>
        </div>
      </div>
      <section className="shell section" id="explore">
        <div className="section-top">
          <div>
            <div className="eyebrow">FOLLOW YOUR CURIOSITY</div>
            <h2>Good questions. Clearer answers.</h2>
            <p>Start with where you are. Then explore where you could go.</p>
          </div>
          <Link prefetch={false} href="/calc/" className="text-link">
            Explore calculators <ArrowRight size={16} />
          </Link>
        </div>
        <div className="insight-grid">
          <Link
            prefetch={false}
            className="insight-card active-card"
            href="/calc/individual-income-percentile/"
          >
            <div className="card-top">
              <span className="feature-icon violet">
                <BarChart3 size={23} />
              </span>
              <span className="pill available">Ready to explore</span>
            </div>
            <h3>
              Where does my
              <br />
              income stand?
            </h3>
            <p>Put your individual income in context with the US income distribution.</p>
            <div className="card-bottom">
              <span>Income percentile</span>
              <ArrowUpRight size={21} />
            </div>
          </Link>
          <div className="insight-card upcoming-card">
            <div className="card-top">
              <span className="feature-icon green">
                <MapPin size={23} />
              </span>
              <span className="pill">Up next</span>
            </div>
            <h3>
              What if I moved
              <br />
              somewhere new?
            </h3>
            <p>Compare what a salary could mean in a different city.</p>
            <div className="card-bottom">
              <span>Cost of living & relocation</span>
              <Compass size={20} />
            </div>
          </div>
          <div className="insight-card upcoming-card">
            <div className="card-top">
              <span className="feature-icon peach">
                <CircleDollarSign size={23} />
              </span>
              <span className="pill">Up next</span>
            </div>
            <h3>
              What actually
              <br />
              comes home?
            </h3>
            <p>Understand how taxes could change the salary on your offer.</p>
            <div className="card-bottom">
              <span>Take-home pay</span>
              <ArrowUpRight size={21} />
            </div>
          </div>
        </div>
      </section>
      <section className="principles-section">
        <div className="shell principles-inner">
          <div>
            <div className="eyebrow">LESS GUESSWORK. MORE UNDERSTANDING.</div>
            <h2>
              You bring the question.
              <br />
              We bring the context.
            </h2>
            <p>
              Big decisions deserve more than a single number. We make public data personal, with
              the workings always in view.
            </p>
            <Link prefetch={false} href="/about/" className="text-link">
              Meet InsightGinie <ArrowRight size={16} />
            </Link>
          </div>
          <div className="principle-list">
            <div>
              <span>01</span>
              <div>
                <h3>Start with real data</h3>
                <p>
                  Published US Census figures, with the source and year right beside your result.
                </p>
              </div>
            </div>
            <div>
              <span>02</span>
              <div>
                <h3>Make it about you</h3>
                <p>
                  Enter a number. See a comparison. Change an input and explore a different
                  scenario.
                </p>
              </div>
            </div>
            <div>
              <span>03</span>
              <div>
                <h3>Understand the whole picture</h3>
                <p>See the assumptions and limits, so an estimate never looks like a certainty.</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="shell closing-section">
        <div className="closing-card">
          <span className="closing-spark">✦</span>
          <div>
            <h2>Your next insight starts with one number.</h2>
            <p>No sign-up. No pressure. Just a little more clarity.</p>
          </div>
          <Link
            prefetch={false}
            href="/calc/individual-income-percentile/"
            className="button primary"
          >
            See where I stand <ArrowRight size={17} />
          </Link>
        </div>
      </section>
    </>
  );
}
function LockIcon() {
  return <ShieldCheck size={14} />;
}
