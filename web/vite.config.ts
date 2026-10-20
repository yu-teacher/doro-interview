import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** 게이트웨이에서 /interview/ 하위 경로로 마운트한다. PWA·스타일은 M1 에서 붙인다. */
export default defineConfig({
  base: '/interview/',
  plugins: [react()],
  server: { port: 3007 },
});
