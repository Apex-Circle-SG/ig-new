# Local development

Use Node 22 or newer and npm. At the repository root run `npm ci` then `npm run dev`; open http://localhost:3000. Workspaces resolve shared TypeScript packages directly. All essential calculator data are public versioned snapshots in Git; no environment variables are needed for anonymous calculations.

For production-mode verification run `NEXT_PUBLIC_ADS_ENABLED=true npm run build` then `NEXT_PUBLIC_ADS_ENABLED=true npm run start`. The advertising browser checks require that flag. Playwright starts a production server automatically if one is not already present. `npx playwright install chromium` installs the browser; minimal Linux environments may need `npx playwright install --with-deps chromium`.

Run `npm run test:all` for lint, types, unit tests, the advertising-enabled build and browser checks. Use the database runbook for PostgreSQL integration checks. `npm run ingest:census` downloads the current pinned source. To adopt a new source year, update the explicit source constants, year/header/threshold validators, transformation version and tests; inspect the diff before publication.

Copy `.env.example` only for the integrations being configured. Next.js reads variables from `apps/web/.env.local`; command-line ingest/database jobs read their process environment. Never source arbitrary `.env` contents as shell code. GitHub credentials are only for Git operations, never application configuration.

Useful routes: `/`, `/calc/`, `/calc/individual-income-percentile/`, `/data/census-cps/`, `/methodology/individual-income/`, `/api/health/`. Unknown paths return 404. No legacy redirect or 410 rule is active until evidence review and cutover.
