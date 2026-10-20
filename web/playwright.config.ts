import { defineConfig } from '@playwright/test';

/**
 * 모바일 레이아웃 회귀 테스트(실제 Chromium 헤드리스). `npm run test:mobile`.
 * 개발 서버를 띄우고 API 응답은 테스트가 가로채(page.route) 가짜 데이터를 준다. 서버·DB 가 필요 없다.
 * 폰 세로 3종(320·375·414)과 가로 모드(812x375)에서 측정하고, 터치 기기로 에뮬레이션한다.
 * 브라우저는 Playwright 가 받은 내장 Chromium 이다(시스템 Chrome 을 쓰지 않는다: 테스트마다 Dock 아이콘이 깜빡인다).
 * 브라우저가 없으면 이 폴더에서 `npx playwright install chromium`.
 */
const PORT = Number(process.env.E2E_PORT ?? 4174);
// 컨테이너(비루트)에서는 Chromium 샌드박스가 못 뜨므로 CI 에서만 끈다(러너는 일회용 환경이다).
const launchOptions = process.env.CI ? { args: ['--no-sandbox'] } : {};
const touch = { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } as const;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.mobile.e2e.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: `http://localhost:${PORT}`, trace: 'off', launchOptions },
  projects: [
    { name: 'phone-320', use: { ...touch, viewport: { width: 320, height: 568 } } },
    { name: 'phone-375', use: { ...touch, viewport: { width: 375, height: 812 } } },
    { name: 'phone-414', use: { ...touch, viewport: { width: 414, height: 896 } } },
    { name: 'phone-landscape', use: { ...touch, viewport: { width: 812, height: 375 } } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://localhost:${PORT}/interview/`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
