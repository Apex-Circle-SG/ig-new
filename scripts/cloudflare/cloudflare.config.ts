import { bindings, defineConfig, defineWorker } from 'cf/config';

const stage = process.env.IG_CLOUDFLARE_TARGET !== 'production';
const origin = stage ? 'https://insightginie-site-stage.aloycwl.workers.dev' : 'https://insightginie.com';
export default defineConfig({
  worker: defineWorker({
    name: stage ? 'insightginie-site-stage' : 'insightginie-site',
    entrypoint: 'vinext/server/fetch-handler',
    compatibilityDate: '2026-11-04',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: stage,
    previewUrls: false,
    assets: { htmlHandling: 'none', notFoundHandling: 'none', runWorkerFirst: ['/*', '!/_next/static/*', '!/*/_next/static/*'] },
    env: {
      ASSETS: bindings.assets(),
      SITE_DB: bindings.d1(stage
        ? { name: 'insightginie-site-stage', id: 'a37e4af0-928a-4b61-9d5f-0084bca43c9e' }
        : { name: 'insightginie-site-state', id: '77d1bf25-2cd3-4fa0-ae49-84570dd0f311' }),
      SITE_INDEXABLE: bindings.text(stage ? 'false' : 'true'),
      NEXT_PUBLIC_ADS_ENABLED: bindings.text(stage ? 'false' : 'true'),
      ADMIN_USERNAME: bindings.text('admin'),
      ASK_DATADOG_ENABLED: bindings.text(stage ? 'false' : 'true'),
      ASK_DATADOG_GENERAL_ENABLED: bindings.text(stage ? 'false' : 'true'),
      ASK_DATADOG_STATE_DIRECTORY: bindings.text('/state'),
      ANALYTICS_DIRECTORY: bindings.text('/state'),
      OPERATIONS_DIRECTORY: bindings.text('/state'),
      APP_SITE_ORIGIN: bindings.text(origin),
      ANALYTICS_SITE_ORIGIN: bindings.text(origin),
      ASK_SECURITY_SECRET: bindings.secret(),
      ADMIN_ACCESS_KEY: bindings.secret(),
      ...(stage ? {} : {
        INDEXNOW_KEY: bindings.secret(),
        DD_API_KEY: bindings.secret(),
        DD_APP_KEY: bindings.secret(),
        DD_REGION: bindings.secret(),
        DD_AGENT_ID: bindings.secret(),
        DD_BITS_WORKFLOW_ID: bindings.secret(),
        ASK_DATADOG_PUBLIC_AGENT_ID: bindings.secret(),
        ASK_DATADOG_MAX_DAILY_RUNS: bindings.secret(),
        ASK_DATADOG_MAX_MONTHLY_RUNS: bindings.secret(),
      }),
    },
  }),
});
