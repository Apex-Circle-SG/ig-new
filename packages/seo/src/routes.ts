/**
 * Reviewed public pages. A route is added only after it has useful, working
 * content; creating a directory or matching a URL prefix never publishes it.
 * Financial tools embedded within these pages have separate, excluded routes.
 */
export const PUBLIC_INDEXABLE_PATHS = [
  '/',
  '/calc/',
  '/calc/individual-income-percentile/',
  '/data/',
  '/data/census-cps/',
  '/data/us-income-distribution/',
  '/methodology/',
  '/methodology/individual-income/',
  '/about/',
  '/editorial-policy/',
  '/privacy/',
  '/terms/',
  '/contact/',
  '/tools/',
  '/tools/ai-workflow-roi/',
  '/tools/cash-runway/',
  '/tools/break-even/',
  '/tools/business-loan/',
  '/tools/drawdown-recovery/',
  '/tools/portfolio-concentration/',
  '/insights/',
  '/research/',
  '/ask/',
  '/authors/',
  '/authors/insightginie/',
  '/corrections-policy/',
  '/advertising-disclosure/',
  '/ai-disclosure/',
  '/finance-disclaimer/',
  '/research-methodology/',
  '/content-index/',
] as const;

/** Advertising inventory is all reviewed public pages, never private tools. */
export const PUBLIC_AD_PATHS = PUBLIC_INDEXABLE_PATHS.filter((path) => path !== '/ask/');

export const PUBLIC_ROUTE_IDS: Readonly<Record<string, string>> = Object.fromEntries(
  PUBLIC_INDEXABLE_PATHS.map((path) => [
    path,
    path === '/' ? 'home' : path.slice(1, -1).replaceAll('/', ':'),
  ]),
);

export function publicRouteId(pathname: string): string | undefined {
  return PUBLIC_ROUTE_IDS[canonicalPathname(pathname)];
}

type IndexingEnvironment = {
  SITE_INDEXABLE?: string;
  VERCEL_ENV?: string;
};

export function siteIsIndexable(
  environment: IndexingEnvironment = {
    SITE_INDEXABLE: process.env.SITE_INDEXABLE,
    VERCEL_ENV: process.env.VERCEL_ENV,
  },
) {
  return environment.SITE_INDEXABLE === 'true' && environment.VERCEL_ENV !== 'preview';
}

function canonicalPathname(pathname: string) {
  // Callers supply URL.pathname, not a URL or query string containing inputs.
  if (!pathname.startsWith('/') || /[?#\\]/.test(pathname) || pathname.includes('//')) return '';
  return pathname.endsWith('/') ? pathname : `${pathname}/`;
}

export function isPublicIndexablePath(pathname: string) {
  return (PUBLIC_INDEXABLE_PATHS as readonly string[]).includes(canonicalPathname(pathname));
}

export function isPublicAdvertisingPath(pathname: string) {
  return (PUBLIC_AD_PATHS as readonly string[]).includes(canonicalPathname(pathname));
}
