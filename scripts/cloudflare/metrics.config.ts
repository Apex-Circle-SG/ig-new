import { bindings, defineConfig, defineWorker, triggers } from 'cf/config';

const stage = process.env.IG_CLOUDFLARE_TARGET !== 'production';
export default defineConfig({
  worker: defineWorker({
    name: stage ? 'insightginie-metrics-stage' : 'insightginie-metrics',
    entrypoint: './metrics.ts',
    compatibilityDate: '2026-11-04',
    compatibilityFlags: ['nodejs_compat'],
    workersDev: false,
    triggers: [triggers.scheduled({ schedule: '*/5 * * * *' })],
    env: {
      TIDB_HOST: bindings.secret(),
      TIDB_USERNAME: bindings.secret(),
      TIDB_PASSWORD: bindings.secret(),
      TIDB_DATABASE: bindings.secret(),
      TIDB_NAMESPACE: bindings.text(stage ? 'stage' : 'site'),
      DD_METRICS_ENABLED: bindings.text(stage ? 'false' : 'true'),
      DD_API_KEY: stage ? bindings.text('disabled') : bindings.secret(),
    },
  }),
});
