import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // never inline assets as data: URIs: the Content-Security-Policy keeps font-src and img-src strict (see vercel.json)
  build: { assetsInlineLimit: 0 },
  test: { include: ['tests/**/*.test.{ts,tsx}'] },
});
