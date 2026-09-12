# Deployment

## Current status

The first vertical slice runs on this host at `http://127.0.0.1:3000`, supervised
by the enabled `insightginie-web.service` systemd unit. It uses the validated
public-data snapshot and needs no remote database. The application is
TypeScript/JavaScript running on Node.js with Next.js; Python is used only for
legacy audit tooling. Cloudflared can connect to port **3000** on the same host.

The tunnel and its public hostname are managed by the operator. No Vercel project,
deployment token, or hosted database is configured. External tunnel behavior must
be verified after the tunnel is connected.

Production WordPress remains separate. Do not change DNS, remove WordPress,
delete its publishing system, or apply legacy dispositions until the backup and
migration gates in [the migration plan](migration-plan.md) pass.

## Background service on this host

The checked-in unit is [deploy/insightginie-web.service](../deploy/insightginie-web.service).
Its paths target this checkout at `/root/ig-new` and the installed `/usr/bin/node`.
It runs the production build, automatically restarts on exit, starts after reboot,
and writes logs to the journal. It listens only on loopback for the local tunnel.
The service does not import the repository's Git credentials into its environment.

```sh
sudo systemctl status insightginie-web --no-pager
sudo systemctl restart insightginie-web
sudo journalctl -u insightginie-web -n 50 --no-pager
curl --fail http://127.0.0.1:3000/api/health/
```

After building and checking a new release, restart this service. For a first
installation on the same host:

```sh
npm ci
npm run build
sudo install -m 0644 deploy/insightginie-web.service /etc/systemd/system/insightginie-web.service
sudo systemctl daemon-reload
sudo systemctl enable --now insightginie-web
```

Build before installing the unit because its writable Next.js cache path must
exist. Avoid rebuilding in place while serving traffic; stop the service for a
maintenance release or prepare a separate release directory. Runtime source
files are read-only to the service, except for the Next.js build/cache directory.
Search indexing remains disabled for this preview.

For a temporary tunnel, the operator can run:

```sh
cloudflared tunnel --url http://127.0.0.1:3000
```

For a named tunnel, use `http://127.0.0.1:3000` as its ingress service.

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
