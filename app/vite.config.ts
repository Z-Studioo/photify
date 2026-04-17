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
  server: {
    host: true,
    port: 5173,
    strictPort: false,
  },
});
