import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
export function Document({
  title,
  eyebrow = 'A LITTLE MORE CONTEXT',
  lead,
  children,
}: {
  title: string;
  eyebrow?: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <article className="shell document-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link prefetch={false} href="/">
          Home
        </Link>
        <ChevronRight size={13} />
        <span>{title}</span>
      </nav>
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p className="page-lead">{lead}</p>
      {children}
    </article>
  );
}
