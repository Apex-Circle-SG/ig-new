import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/ingest/**/*.test.ts', 'tests/unit/**/*.test.ts'],
  },
});
