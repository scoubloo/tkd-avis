import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    // Les tests de bout en bout sont pilotés par Playwright, pas par Vitest.
    include: ['tests/unit/**/*.test.ts'],
  },
});
