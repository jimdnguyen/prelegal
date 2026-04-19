import { defineConfig, type ConfigEnv } from 'vitest/config';
import solidPlugin from 'vite-plugin-solid';

export default defineConfig(({ mode }: ConfigEnv) => ({
  plugins: [solidPlugin({ hot: mode !== 'test' })],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8' as const,
      reporter: ['text', 'text-summary'],
    },
  },
}));
