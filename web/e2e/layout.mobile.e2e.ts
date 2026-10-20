import { expect, test, type Page } from '@playwright/test';
import { installApi } from './fixtures';
import { auditAxe, auditLayout } from './mobileAudit';

/** 화면 8종(+오류)을 라이트·다크 모드로 열어 레이아웃과 접근성(색 대비 포함)을 실제 브라우저에서 잰다. */
const PAGES: { name: string; path: string; ready: (page: Page) => Promise<void> }[] = [
  { name: '홈', path: '/', ready: (p) => p.getByRole('heading', { level: 2, name: '스프링' }).waitFor() },
  { name: '주제(필터 포함)', path: '/t/transaction', ready: (p) => p.getByRole('heading', { level: 1 }).waitFor() },
  { name: '주제(필터 적용)', path: '/t/transaction?tier=DEEP&imp=ge2&extra=1&concept=proxy', ready: (p) => p.getByRole('heading', { level: 1 }).waitFor() },
  { name: '질문 상세', path: '/q/tx-04', ready: (p) => p.locator('[data-badge]').first().waitFor({ state: 'attached' }) },
  { name: '개념 목록', path: '/concepts', ready: (p) => p.getByRole('heading', { level: 1, name: '개념' }).waitFor() },
  { name: '개념 상세', path: '/c/proxy', ready: (p) => p.getByRole('heading', { level: 1, name: '프록시' }).waitFor() },
  { name: '검색 결과', path: '/search?q=프록시', ready: (p) => p.getByRole('heading', { level: 1 }).waitFor() },
  { name: '검색 결과 없음', path: '/search?q=없음', ready: (p) => p.getByRole('heading', { level: 1, name: '검색 결과 없음' }).waitFor() },
  { name: '없는 질문(404)', path: '/q/none', ready: (p) => p.getByRole('alert').waitFor() },
  { name: '서버 오류', path: '/t/boom', ready: (p) => p.getByRole('alert').waitFor() },
];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} 모드`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path, ready } of PAGES) {
      test(`${name}: 레이아웃`, async ({ page }) => {
        await installApi(page);
        await page.goto(`/interview${path}`);
        await ready(page);
        // 질문 상세는 근거·코드를 펼친 상태도 잰다(가장 넓어지는 상태)
        if (path === '/q/tx-04') {
          await page.getByText('근거 · 코드 · 실험 설명 보기').click();
          await page.locator('pre code').first().waitFor();
        }
        expect(await auditLayout(page)).toEqual([]);
      });

      test(`${name}: 접근성(색 대비 포함)`, async ({ page }) => {
        await installApi(page);
        await page.goto(`/interview${path}`);
        await ready(page);
        if (path === '/q/tx-04') {
          await page.getByText('근거 · 코드 · 실험 설명 보기').click();
          await page.locator('pre code').first().waitFor();
        }
        expect(await auditAxe(page)).toEqual([]);
      });
    }
  });
}

test('코드 블록은 자체 스크롤이고 페이지는 옆으로 밀리지 않는다', async ({ page }) => {
  await installApi(page);
  await page.goto('/interview/q/tx-04');
  await page.getByText('근거 · 코드 · 실험 설명 보기').click();
  const pre = page.locator('pre').first();
  await pre.waitFor();
  const vw = page.viewportSize()?.width ?? 0;
  const m = await pre.evaluate((el) => ({ scroll: el.scrollWidth, client: el.clientWidth, overflowX: getComputedStyle(el).overflowX, doc: document.documentElement.scrollWidth }));
  expect(m.overflowX).toBe('auto');
  expect(m.scroll).toBeGreaterThan(m.client);
  expect(m.doc).toBeLessThanOrEqual(vw + 1);
});

test('긴 이름과 주소는 줄바꿈되어 가로로 넘치지 않는다', async ({ page }) => {
  await installApi(page);
  await page.goto('/interview/q/tx-04');
  await page.getByRole('heading', { level: 1 }).waitFor();
  const vw = page.viewportSize()?.width ?? 0;
  const doc = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(doc).toBeLessThanOrEqual(vw + 1);
});
