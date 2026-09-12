# Deployment

## Current status

The first vertical slice can run locally from its validated public-data snapshot.
No Vercel project binding, deployment token, database URL, or existing hosting
integration was available for staging verification in this session. Git access
does not confer hosting access. A local production build is not a staging deployment.

Production WordPress remains separate. Do not change DNS, remove WordPress,
delete its publishing system, or apply legacy dispositions until the backup and
migration gates in [the migration plan](migration-plan.md) pass.

## Vercel monorepo setup

Use one Vercel project for `apps/web` with the Next.js framework preset:

| Setting                                     | Value                                                    |
| ------------------------------------------- | -------------------------------------------------------- |
| Root Directory                              | `apps/web`                                               |
| Include source files outside Root Directory | Enabled, for `packages/*`                                |
| Install Command                             | `cd ../.. && npm ci`                                     |
| Build Command                               | `cd ../.. && npm run build`                              |
| Output Directory                            | Next.js default `.next`, relative to `apps/web`          |
| Node.js                                     | 22.x or another version satisfying the repository engine |

The repository-root build command delegates to `@insightginie/web`. Do not use
`apps/web/.next` as the output path when Root Directory is already `apps/web`.
The lockfile and shared workspaces must remain available during installation.
Verify these project settings in the first preview; automatic framework detection
is useful but does not substitute for a deployed check. See Vercel's
[monorepo guide](https://vercel.com/docs/monorepos) and
[Next.js integration](https://vercel.com/docs/frameworks/full-stack/nextjs).

For a CLI-driven preview, provide `VERCEL_TOKEN`, `VERCEL_ORG_ID` and
`VERCEL_PROJECT_ID` through a protected environment, link the project, then deploy
from the repository root using its saved project settings. Keep `.vercel/` and
credentials out of Git. No production flag is needed for a preview.

## Environment

Preview: `SITE_INDEXABLE=false`, `NEXT_PUBLIC_SITE_URL=https://insightginie.com`,
and advertising disabled. Keep the canonical host consistent while sending
non-indexing directives on previews. Use preview access protection when available.

The first calculator needs no database, LLM, email, ad or Census API key at request
time. Only configure optional providers when the corresponding integration has
been implemented and tested. Server secrets must never use `NEXT_PUBLIC_` names.
For PostgreSQL, use a direct TLS connection for migrations and a separately scoped
runtime connection. Apply migrations once through a controlled release job, not
on every serverless invocation.

## Release verification

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`
and `npm run test:e2e`. Run Lighthouse against the production server. A preview
release also needs a real-browser calculator flow, empty/error states, mobile
navigation, source links, public health response, canonical metadata, and robots
checks at the deployed URL. Record URL, commit, date and evidence in the release
report. Lab Lighthouse scores do not prove field Core Web Vitals targets.

Before public cutover: complete and restore-test the WordPress files/database
backup; finish legacy URL review and redirect/410 tests; validate domain/TLS/CDN;
set up error/uptime alerts; review policies and obtain human trademark clearance;
then explicitly authorize the cutover. Enable production indexing only when these
gates pass. Roll back by restoring the prior deployment and routing, preserving
dataset/scenario history rather than destructive database rollback.
