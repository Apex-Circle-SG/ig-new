# Deployment

## Current status

The current release includes Datadog-backed Ask Ginie, finance tools, editorial previews, research, privacy controls and protected operations. See [current acceptance](ginie-migration-acceptance.md) and follow [the candidate promotion and rollback procedure](consolidation-release.md). Public WordPress content is preserved locally; the blog-host cutover remains blocked by backup/restore and hosting authority.

The application runs on this host at `http://127.0.0.1:3000`, supervised
by the enabled `insightginie-web.service` systemd unit. It uses the validated
public-data snapshot and needs no remote database. The application is
TypeScript/JavaScript running on Node.js with Next.js; Python supports audit,
migration and release tooling. Cloudflared can connect to port **3000** on the same host.

The operator's Cloudflare tunnel connects `https://insightginie.com` to this
service. No Vercel project, deployment token, or hosted database is configured.
Verify the public hostname after every release.

The local legacy WordPress publisher was removed in an earlier operator-approved
cleanup. Remote legacy hosting and the preserved URL inventory remain separate.
This SEO release does not apply legacy redirects or delete remote backups;
dispositions still require the evidence in [the migration plan](migration-plan.md).

## Background service on this host

The checked-in unit is [deploy/insightginie-web.service](../deploy/insightginie-web.service).
Its paths target this checkout at `/root/ig-new` and the installed `/usr/bin/node`.
The current service selects `apps/web/.next-live` through `NEXT_BUILD_DIR`;
the default `.next` is available for independent development builds.
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
SITE_INDEXABLE=true NEXT_BUILD_DIR=.next-live NEXT_PUBLIC_ADS_ENABLED=true npm run build
sudo install -m 0644 deploy/insightginie-web.service /etc/systemd/system/insightginie-web.service
sudo systemctl daemon-reload
sudo systemctl enable --now insightginie-web
```

Build before installing the unit because its writable Next.js cache path must
exist. Avoid rebuilding in place while serving traffic; stop the service for a
maintenance release or prepare a separate release directory. Runtime source
files are read-only to the service, except for the Next.js build/cache directory.
The reviewed public routes now use SITE_INDEXABLE=true; preview deployments must retain false.

For a temporary tunnel, the operator can run:

```sh
cloudflared tunnel --url http://127.0.0.1:3000
```

For a named tunnel, use `http://127.0.0.1:3000` as its ingress service.

### Troubleshooting a Hostinger 403

On 2026-09-12 at 03:41 UTC, `https://insightginie.com/` returned HTTP 403 with
`platform: hostinger`, `panel: hpanel`, and `x-turbo-charged-by: LiteSpeed`.
The public `/api/health/` returned a Hostinger HTML 404. In contrast, the local
homepage returned 200 with `Host: insightginie.com`, and the local health endpoint
returned validated dataset JSON. Cloudflared's active configuration already
mapped `insightginie.com` to `http://localhost:3000`.

These responses show that public requests still reach the old hosting origin.
The application and local ingress are healthy. Check the root record in
Cloudflare **DNS → Records** and configure this web destination:

| Setting      | Value                                                   |
| ------------ | ------------------------------------------------------- |
| Type         | CNAME                                                   |
| Name         | `@` (insightginie.com)                                  |
| Target       | `3ee8c20b-055d-43cc-8b9e-ec173cf1ef34.cfargotunnel.com` |
| Proxy status | Proxied                                                 |

Record the previous web destination for rollback. Replace conflicting root
A/AAAA/CNAME web records; preserve unrelated records such as mail and TXT.
The tunnel UUID is a routing identifier, not a credential. The root DNS record
and tunnel must belong to the same Cloudflare account. If this DNS destination
is already correct, inspect Cloudflare origin overrides, Workers routes and
load-balancer rules for routes that still send this hostname to Hostinger.

Cloudflare proxies/flattening hide the configured CNAME target from ordinary
public DNS answers, so those answers alone cannot verify the account-side
destination. The available connector token runs the tunnel; no Cloudflare DNS
management credential or account certificate is configured here. No DNS record
was modified during diagnosis.

After correcting the route, verify that `https://insightginie.com/api/health/`
returns the same JSON as the local endpoint and test the calculator through the
public hostname. See Cloudflare's [tunnel DNS instructions](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/routing-to-tunnel/dns/)
and [origin troubleshooting](https://developers.cloudflare.com/tunnel/troubleshooting/https-origins/).

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

The first calculator needs no database, LLM, email or Census API key at request
time. AdSense uses the public publisher ID and a regional loading policy described
in [advertising](advertising.md). Only configure other optional providers when their integration has
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

The current application is already public. The September 13 operator request
authorizes indexing the 13 reviewed application routes. Legacy migration and
future expansion remain separate: preserve and restore-test remote backups,
review URL dispositions, configure external alerts, and complete policy and
human trademark review. No legacy article batch is published or redirected by
this release. Roll back by restoring the prior deployment and service unit,
preserving dataset history rather than destructively rolling back data.

## September 2026 launch configuration

The hosted unit enables indexing and advertising, reads `/etc/insightginie/runtime.env`
for INDEXNOW_KEY, and uses systemd StateDirectory `insightginie`. Daily aggregate
counters live under `/var/lib/insightginie/analytics`. A daily persistent timer
runs `insightginie-analytics-prune.service` independently of visitor activity.
Install the checked-in service/timer units and enable the timer after deployment.
Do not import the repository Git credentials into the web service.

INDEXNOW_KEY is a random ownership-verification value served at
`/indexnow-key.txt`; it is separate from account credentials. Generate it once,
preserve it between releases, and submit only verified live sitemap URLs using
[scripts/seo](../scripts/seo/README.md). Google/Bing account APIs remain optional
and require their own authorized credentials.
