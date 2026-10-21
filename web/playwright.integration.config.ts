import { defineConfig } from '@playwright/test';

/**
 * 통합 e2e: 실제 백엔드(jar) + 실제 DB + 빌드한 웹 + 실제 Chromium(헤드리스, 내장). `scripts/e2e-test.sh` 가 서버를 띄우고 이 설정으로 실행한다.
 * 서버는 이 설정이 띄우지 않는다(DB·jar·웹을 한 번에 관리하는 스크립트의 몫이다).
 */
const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4175';
const launchOptions = process.env.CI ? { args: ['--no-sandbox'] } : {};

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.integration.e2e.ts',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  // 로컬(macOS Docker Desktop)에서는 게이트웨이→호스트 연결이 가끔 끊겨 한 시험이 30초 멈춘다(docs/M6-PLAN.md 끝). 로컬에서만 한 번 다시 시도하고, CI 는 그대로 엄격하다.
  retries: process.env.CI ? 0 : 1,
  reporter: [['list']],
  use: { baseURL, trace: 'off', launchOptions },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    { name: 'phone-375', use: { isMobile: true, hasTouch: true, deviceScaleFactor: 2, viewport: { width: 375, height: 812 } } },
  ],
});
