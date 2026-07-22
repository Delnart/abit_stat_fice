import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  // Nest DI потребує emitDecoratorMetadata — esbuild його не вміє, swc вміє
  plugins: [swc.vite({ module: { type: 'es6' } })],
});
