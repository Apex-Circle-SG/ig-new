import type { AnchorHTMLAttributes } from 'react';

/** A fresh document prevents third-party scripts following users into financial tools. */
export function SiteLink({
  prefetch,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & { prefetch?: boolean }) {
  void prefetch;
  return <a {...props} />;
}
