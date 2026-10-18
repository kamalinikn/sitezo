import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// appType 'spa' makes both the dev server and `vite preview` serve index.html
// for any route (e.g. /services), so direct visits and refreshes work.
export default defineConfig({
  base: '/',
  appType: 'spa',
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } },
  preview: { port: 4173, proxy: { '/api': 'http://localhost:5000' } },
});
