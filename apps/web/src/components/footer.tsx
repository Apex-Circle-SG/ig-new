import { SiteLink as Link } from '@insightginie/ui';
import { BrandMark } from '@insightginie/ui';
import { AdvertisingPreferences } from './advertising-preferences';
import { AnalyticsPreferences } from './analytics-preferences';
export function Footer({
  adsEnabled,
  adPreference,
  advertisingPage,
}: {
  adsEnabled: boolean;
  adPreference: string | undefined;
  advertisingPage: boolean;
}) {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-main">
          <div>
            <Link prefetch={false} href="/" className="brand">
              <BrandMark size={24} />
              <span>
                insight<span className="brand-light">ginie</span>.
              </span>
            </Link>
            <p>A little perspective for life’s big decisions.</p>
            <p className="footer-note">
              Independent data. Transparent calculations.
              <br />
              Built around you.
            </p>
          </div>
          <div>
            <h2>Explore</h2>
            <Link prefetch={false} href="/tools/">
              Tools
            </Link>
            <Link prefetch={false} href="/data/">
              Our data
            </Link>
            <Link prefetch={false} href="/methodology/">
              Methodology
            </Link>
            <Link prefetch={false} href="/insights/">
              Insights
            </Link>
            <Link prefetch={false} href="/research/">
              Research
            </Link>
            <Link prefetch={false} href="/ask/">
              Ask Ginie
            </Link>
          </div>
          <div>
            <h2>InsightGinie</h2>
            <Link prefetch={false} href="/about/">
              About us
            </Link>
            <Link prefetch={false} href="/editorial-policy/">
              Editorial policy
            </Link>
            <Link prefetch={false} href="/contact/">
              Contact
            </Link>
            <Link prefetch={false} href="/corrections-policy/">
              Corrections
            </Link>
            <Link prefetch={false} href="/authors/">
              Who maintains the site
            </Link>
            <Link prefetch={false} href="/content-index/">
              Content index
            </Link>
          </div>
          <div>
            <h2>Your privacy</h2>
            <Link prefetch={false} href="/privacy/">
              Privacy policy
            </Link>
            <Link prefetch={false} href="/terms/">
              Terms of use
            </Link>
            <Link prefetch={false} href="/advertising-disclosure/">
              Advertising disclosure
            </Link>
            <Link prefetch={false} href="/ai-disclosure/">
              AI-use disclosure
            </Link>
            <Link prefetch={false} href="/finance-disclaimer/">
              Finance disclaimer
            </Link>
            <AnalyticsPreferences />
            {adsEnabled ? (
              <AdvertisingPreferences preference={adPreference} showNotice={advertisingPage} />
            ) : (
              <Link prefetch={false} href="/privacy/#cookies">
                Cookie settings
              </Link>
            )}
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getUTCFullYear()} InsightGinie</span>
          <span>For understanding. For exploring. For your next move.</span>
          <span>Educational information, not financial advice.</span>
        </div>
      </div>
    </footer>
  );
}
