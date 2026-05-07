import { reactRouter } from '@react-router/dev/vite';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, defaultHandler) {
        // 'use client' / 'use server' directives are meaningless in this
        // SPA + prerender setup (ssr: false). Rollup strips them and warns,
        // emitting noisy "Can't resolve original location of error" lines
        // because the directive position can't be mapped back via sourcemap.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.code === 'SOURCEMAP_ERROR') return;
        defaultHandler(warning);
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});
