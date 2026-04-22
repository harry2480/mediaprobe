/// <reference types="vitest" />
import path from 'path';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  base: '/mediaprobe/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    wasm(),
    topLevelAwait()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  }
});
