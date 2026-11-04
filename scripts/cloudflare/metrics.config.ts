import { bindings, defineConfig, defineWorker, triggers } from 'cf/config';

const stage = process.env.IG_CLOUDFLARE_TARGET !== 'production';
export default defineConfig({
  worker: defineWorker({
    name: stage ? 'insightginie-metrics-stage' : 'insightginie-metrics',
    entrypoint: './metrics.ts',
    compatibilityDate: '2026-11-04',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: false,
    triggers: [triggers.scheduled({ schedule: '* * * * *' })],
    env: {
      SITE_DB: bindings.d1(stage
        ? { name: 'insightginie-site-stage', id: 'a37e4af0-928a-4b61-9d5f-0084bca43c9e' }
        : { name: 'insightginie-site-state', id: '77d1bf25-2cd3-4fa0-ae49-84570dd0f311' }),
      DD_METRICS_ENABLED: bindings.text(stage ? 'false' : 'true'),
      DD_API_KEY: stage ? bindings.text('disabled') : bindings.secret(),
    },
  }),
});
