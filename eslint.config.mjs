import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { settings: { next: { rootDir: 'apps/web/' } } },
  globalIgnores([
    '**/.next/**',
    '**/.next-live/**',
    '**/.next-candidate/**',
    '**/node_modules/**',
    'artifacts/**',
    'playwright-report/**',
    'test-results/**',
    'backups/**',
    'graphify-out/**',
    '**/next-env.d.ts',
  ]),
]);
