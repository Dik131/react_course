import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// vite.config.js / vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), VitePWA()],
});
