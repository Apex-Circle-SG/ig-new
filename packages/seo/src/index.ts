export const canonical = (path: string) => `https://insightginie.com${path}`;
export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: canonical(item.path),
    })),
  };
}
export function webApplicationSchema(name: string, path: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    url: canonical(path),
    description,
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Any',
    isAccessibleForFree: true,
  };
}
export function safeJsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}
export { evaluatePageQuality, type PageCandidate } from './quality';
