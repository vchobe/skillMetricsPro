import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cartographer from '@replit/vite-plugin-cartographer';
import errorModal from '@replit/vite-plugin-runtime-error-modal';
import shadcnTheme from '@replit/vite-plugin-shadcn-theme-json';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), cartographer(), errorModal(), shadcnTheme()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zod', 'drizzle-zod', '@tanstack/react-query', '@hookform/resolvers/zod'],
    exclude: ['drizzle-orm'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'zod': ['zod', 'drizzle-zod', '@hookform/resolvers/zod'],
          'react-query': ['@tanstack/react-query']
        }
      }
    }
  }
});