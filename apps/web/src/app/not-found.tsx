import { SiteLink as Link } from '@insightginie/ui';
export default function NotFound() {
  return (
    <div className="shell error-page">
      <span className="eyebrow">404 · A DIFFERENT DIRECTION</span>
      <h1>There’s no insight at this address.</h1>
      <p>Try the income calculator or head back to explore.</p>
      <Link prefetch={false} href="/calc/individual-income-percentile/" className="button primary">
        Explore your income →
      </Link>
      <Link prefetch={false} href="/" className="text-link">
        Back to home
      </Link>
    </div>
  );
}
