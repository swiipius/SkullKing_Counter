import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

export default defineConfig({
  plugins: [preact()],
  server: {
    // Local dev: /api goes to the leaderboard API started with `npm run api:dev`.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        headers: { 'X-Api-Key': process.env.LEADERBOARD_API_KEY ?? 'dev-key-local' },
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'server/**/*.test.ts', 'proxy.test.ts'],
  },
});
