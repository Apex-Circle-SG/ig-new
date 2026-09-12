# ADR 0001: Source-backed first slice

Status: accepted, 2026-09-12.

The supplied repository had no code. Build one complete individual-income path before household/relocation/tax expansion. Use npm workspaces and shared Zod contracts, a pure calculator engine with an injected clock, and a Next.js server-rendered shell with local client calculations.

Census API requests without a key returned HTML, so use authoritative publicly downloadable CPS PINC-11 files. This supplies individual total money income, not merely earnings, with closed bands through $250k and explicit open tails. The comparison population is all people15+, not only earners. Never conceal this distinction.

PostgreSQL remains the durable source-of-record design. A validated immutable public snapshot is bundled into this initial anonymous application; it does not store private information. Deployments do not need live dataset APIs or a live database to render the calculator. Transactional normalized database publication is separately tested and awaits provisioning.

Staging defaults noindex. WordPress migration tooling is read-only until backups, evidence and reviewed dispositions exist. No broad redirects, unsupported city metrics, fake authors, placeholder AI chat or unvalidated salary pages.

Performance refinement: the initial example is computed on the server using the
same deterministic engine and passed as a typed result. The browser loads its
calculator engine on input focus or submission. This keeps validation code off the
initial rendering path without moving private inputs to a server. Loading and
failed-download states preserve the previous result. Zod uses a tree-shakeable
namespace import and disables JIT probing to respect the no-eval CSP. Public links
load their destination on navigation; speculative prefetching is disabled.
