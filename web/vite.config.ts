import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { normalizeBasePath, viteBase } from './src/utils/basePath';

/** 게이트웨이에서 하위 경로(기본 /interview/)로 마운트한다. 서비스 워커(PWA)는 sw/sw.ts 이고 정책은 docs/M2-PLAN.md §6 이다. */
const THEME_COLOR = '#0f172a';
const API_TARGET = process.env.VITE_DEV_API_TARGET ?? 'http://localhost:8088';

// 공개 하위 경로(예: /interview, 개발 배포는 /dev/interview). 빌드 때 VITE_BASE_PATH 로 정하고 비우면 /interview 다.
// 컨테이너 안의 파일 위치는 항상 /interview 이고, 다른 공개 경로는 게이트웨이가 /interview 로 되돌려 전달한다.
const BASE_PATH = normalizeBasePath(process.env.VITE_BASE_PATH);
const BASE = viteBase(BASE_PATH);

// 게이트웨이처럼 기준 경로를 떼고 백엔드로 전달한다(개발 서버와 미리보기 서버가 같은 규칙을 쓴다)
const proxy = {
  [`${BASE_PATH}/api`]: {
    target: API_TARGET,
    changeOrigin: false,
    rewrite: (path: string) => path.slice(BASE_PATH.length),
  },
};

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'sw',
      filename: 'sw.ts',
      // 새 서비스 워커는 설치만 하고 대기한다. 적용 시점은 src/pwa/updater.ts 가 정한다(안전한 순간에만).
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '도로 면접',
        short_name: '도로 면접',
        description: '개발 면접 질문 은행과 학습 체크',
        lang: 'ko',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: THEME_COLOR,
        theme_color: THEME_COLOR,
        icons: [
          { src: `${BASE}icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: `${BASE}icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      // 빌드 산출물만 미리 캐시한다(런타임 캐시 없음: API 는 절대 캐시하지 않는다). 경로는 base 기준 상대 주소로 들어간다.
      injectManifest: { globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'] },
    }),
  ],
  server: { port: 3007, proxy },
  preview: { port: 4175, proxy },
  test: {
    environment: 'node',
    // vitest 는 base 를 무시하고 BASE_URL 을 '/' 로 두므로, 시험에서도 앱과 같은 값을 보게 넣는다(빌드에서는 base 가 넣는 값과 같다).
    env: { BASE_URL: BASE },
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/testing/setup.ts'],
  },
});
