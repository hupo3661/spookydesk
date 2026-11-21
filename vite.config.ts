import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base defaults to '/' for local dev and root deployments. The GitHub Pages
// workflow sets VITE_BASE=/spookydesk/ so asset URLs resolve under the
// project subpath.
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [react()],
});
