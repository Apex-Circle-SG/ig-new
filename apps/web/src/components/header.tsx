import { SiteLink as Link } from '@insightginie/ui';
import { ArrowUpRight } from 'lucide-react';
import { BrandMark } from '@insightginie/ui';
export function Header() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link prefetch={false} href="/" className="brand" aria-label="InsightGinie home">
          <BrandMark />
          <span>
            insight<span className="brand-light">ginie</span>
            <span className="brand-dot">.</span>
          </span>
        </Link>
        <nav className="desktop-nav" aria-label="Main navigation">
          <Link prefetch={false} href="/insights/">
            Insights
          </Link>
          <Link prefetch={false} href="/tools/">
            Tools
          </Link>
          <Link prefetch={false} href="/research/">
            Research
          </Link>
          <Link prefetch={false} href="/methodology/">
            Methodology
          </Link>
        </nav>
        <Link prefetch={false} href="/ask/" className="header-cta">
          Ask Genie <ArrowUpRight size={16} />
        </Link>
        <details className="mobile-nav">
          <summary aria-label="Menu">
            Menu <span aria-hidden="true">☰</span>
          </summary>
          <nav aria-label="Mobile navigation">
            <Link prefetch={false} href="/">
              Home
            </Link>
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
              Ask Genie
            </Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
