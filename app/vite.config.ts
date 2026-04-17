import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'next/navigation': path.resolve(
        __dirname,
        './src/mocks/next-navigation.ts'
      ),
    },
  },
  // SSR-specific config. Libraries listed here are bundled into the
  // server build instead of being `require`d from node_modules, which
  // is required for ESM-only / CSS-importing packages.
  ssr: {
    noExternal: [
      'framer-motion',
      'motion',
      /^@radix-ui\//,
      'radix-ui',
      'lucide-react',
      '@dr.pogodin/react-helmet',
      'sonner',
      'react-loader-spinner',
      'react-compare-image',
      'react-easy-crop',
      'react-image-crop',
      '@tanstack/react-query',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      'recharts',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
  },
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});
