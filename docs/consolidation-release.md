# Consolidation release and rollback

The app is TypeScript/JavaScript on Node.js/Next.js. Its permanent background service is `insightginie-web`, listening on **127.0.0.1:3000** for the existing Cloudflare tunnel. Port3011 is temporary candidate verification. No WordPress host or DNS cutover is part of this release.

## Verify a candidate

```sh
npm ci
npm run lint
npm run typecheck
npm test
node --test scripts/observability/observability.test.mjs scripts/operations/prune-analytics.test.mjs scripts/seo/discovery.test.mjs
npx tsx scripts/content-sync/validate.ts
SITE_INDEXABLE=true NEXT_BUILD_DIR=.next-candidate NEXT_PUBLIC_ADS_ENABLED=true npm run build
```

Start this build on loopback3011 using `NEXT_BUILD_DIR=.next-candidate`, `APP_SITE_ORIGIN=http://127.0.0.1:3011`, matching `ANALYTICS_SITE_ORIGIN`, and separate ignored analytics/operations directories. Use test-only admin and token secrets; never share them with production. The Playwright configuration documents test credentials.

```sh
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3011 PLAYWRIGHT_JSON_OUTPUT_NAME=artifacts/final-playwright.json npx playwright test --output=artifacts/final-e2e --reporter=json
VERIFY_BASE_URL=http://127.0.0.1:3011 VERIFY_REPORT_PREFIX=consolidation- node scripts/verification/lighthouse.mjs
```

Review visual snapshots before updating them. Keep independent suites in separate output directories. Check dependency audit, noindex previews, canonical/sitemap agreement, private frame isolation, numeric boundaries, CSRF/rate limits and consent. Lighthouse is a lab test; it does not establish field p75 LCP/INP/CLS.

After all required local checks pass, record `artifacts/candidate-acceptance.json` with the actual `apps/web/.next-candidate/BUILD_ID`, `status: passed`, check results and evidence references. The deployment helper refuses a different/unaccepted build. Commit source and reviewed reports before promotion.

## Promote

Stop only the candidate process on3011 before moving its build. Leave the live service active until the promotion script reaches its brief switch.

```sh
python3 scripts/deploy/promote.py --verify-only
python3 scripts/deploy/promote.py --promote
curl --fail http://127.0.0.1:3000/api/health/
```

The helper archives the previous live build, systemd units and protected runtime environment under `artifacts/releases/pre-consolidation-*` with restricted permissions, then installs the candidate and checks the health route and four major pages. Failure attempts automatic restoration. `docs/verification/consolidation-deployment.json` records the exact archive, commit and build. Recheck public HTTPS behavior and real browser flows through Cloudflare. Keep `no-transform` on nonce-bearing HTML while Rocket Loader is enabled. Do not spoof `cf-connecting-ip` in public tests; that header belongs to Cloudflare and can trigger Error1000. A successful loopback check is insufficient for release acceptance.

Production configuration is `/etc/insightginie/runtime.env`. The helper generates `ASK_SECURITY_SECRET` and `ADMIN_ACCESS_KEY` if missing and stores a protected copy in ignored root `.env`. Admin username is `admin`; retrieve its secret locally without posting it to chat or an issue. No Git, CMS or arbitrary credentials are copied into the web process. When `ASK_DATADOG_ENABLED=true` is explicitly configured, the helper copies only the validated Datadog provider allowlist into the protected server runtime; these credentials never enter browser code. The selector retains its run ledger/cache in `/var/lib/insightginie/datadog-ask`. The metrics worker uses its own `/etc/insightginie/datadog.env`.

## Roll back

Use the exact `rollbackDirectory` from the deployment receipt:

```sh
python3 scripts/deploy/promote.py --rollback /root/ig-new/artifacts/releases/ACTUAL-ARCHIVE-NAME
curl --fail http://127.0.0.1:3000/api/health/
```

This restores the old build, runtime configuration and units, retaining the replaced build for diagnosis. Recheck the public homepage and income calculator. Metrics can be disabled independently with `systemctl disable --now insightginie-metrics.timer`; the separately controlled public selector can be disabled with `ASK_DATADOG_ENABLED=false` and a web-service restart. Its durable budget state must survive rollback. Neither operation changes WordPress, source datasets or editorial snapshots. A web-build archive is **not** a WordPress backup or a completed WordPress restore test.

## External acceptance

The final blog consolidation still requires a full backup/restore test, scoped redirect/backend control, complete per-URL preservation checks and editorial approval. The current preview gate must stay closed. Search Console, backlink, ad-revenue and field Web Vitals baselines remain unavailable until their actual account data is connected. See [MANUAL_REQUIRED.md](../MANUAL_REQUIRED.md).
