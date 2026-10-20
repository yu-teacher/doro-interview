import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

/** 게이트웨이에서 /interview/ 하위 경로로 마운트한다. 서비스 워커(PWA)는 M2 에서 게이트웨이·실제 브라우저 검증과 함께 붙인다. */
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8088';

export default defineConfig({
  base: '/interview/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 3007,
    proxy: {
      // 게이트웨이처럼 /interview 를 떼고 백엔드로 전달한다
      '/interview/api': {
        target: API_TARGET,
        changeOrigin: false,
        rewrite: (path) => path.replace(/^\/interview/, ''),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
