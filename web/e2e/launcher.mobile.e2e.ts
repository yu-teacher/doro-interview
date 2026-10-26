import { expect, test, type Page } from '@playwright/test';
import { installApi } from './fixtures';
import { auditAxe, auditLayout } from './mobileAudit';

/** 허브가 제공하는 서비스 목록(/services.json)을 가짜로 대체한다. */
async function mockServices(page: Page, body: unknown, status = 200) {
  await page.route('**/services.json', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) }),
  );
}

const manifest = {
  version: 1,
  services: [
    { id: 'blog', name: 'DORO.log', desc: '개발자 오픈 기술 블로그', href: '/dev/blog/', audience: 'developer' },
    { id: 'party', name: '도로 파티', desc: '친구들과 지도에 핀 모으기', href: '/party/', audience: 'general' },
    { id: 'games', name: '도로 게임 천국', desc: '웹 미니게임', href: '/games/', audience: 'general' },
    { id: 'interview', name: '도로 면접', desc: '면접 질문 은행', href: '/dev/interview/', audience: 'developer' },
  ],
};

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`면접: 서비스 목록 버튼 (${scheme} 모드)`, () => {
    test.use({ colorScheme: scheme });
    test.beforeEach(async ({ page }) => installApi(page, 'anonymous'));

    test('누르면 Doro Dev 홈과 개발자 서비스 링크가 뜨고 현재 서비스가 표시되며 화면 안에 들어오고 접근성을 지킨다', async ({ page }) => {
      await mockServices(page, manifest);
      await page.goto('/interview/');
      await page.getByRole('button', { name: '도로 서비스 목록' }).click();

      const nav = page.getByRole('navigation', { name: '도로 서비스 목록' });
      await expect(nav.getByRole('link', { name: /^Doro Dev 홈/ })).toHaveAttribute('href', '/dev/');
      await expect(nav.getByRole('link', { name: /DORO\.log/ })).toHaveAttribute('href', '/dev/blog/');
      await expect(nav.getByRole('link', { name: /도로 파티/ })).toHaveCount(0);
      await expect(nav.getByRole('link', { name: /도로 게임/ })).toHaveCount(0);
      await expect(nav.getByRole('link', { name: /허브/ })).toHaveCount(0);
      await expect(nav.locator('[aria-current="page"]')).toContainText('도로 면접');

      await page.waitForLoadState('networkidle');
      const box = await nav.boundingBox();
      const viewport = page.viewportSize();
      expect(box && viewport && box.x >= 0 && box.x + box.width <= viewport.width, '목록 창이 화면 밖으로 나갔다').toBe(true);
      expect(await auditLayout(page)).toEqual([]);
      expect(await auditAxe(page)).toEqual([]);
    });

    test('관리자에게만 Doro 허브(/) 링크가 하나 더 보이고 접근성을 지킨다', async ({ page }) => {
      await installApi(page, 'authenticated', { admin: true });
      await mockServices(page, manifest);
      await page.goto('/interview/');
      await page.getByRole('button', { name: '도로 서비스 목록' }).click();
      const nav = page.getByRole('navigation', { name: '도로 서비스 목록' });
      await expect(nav.getByRole('link', { name: /^Doro 허브/ })).toHaveAttribute('href', '/');
      await expect(nav.getByRole('link', { name: /도로 파티/ })).toHaveCount(0);
      await page.waitForLoadState('networkidle');
      expect(await auditLayout(page)).toEqual([]);
      expect(await auditAxe(page)).toEqual([]);
    });

    test('로그인한 일반 사용자에게는 허브 링크가 없다', async ({ page }) => {
      await installApi(page, 'authenticated');
      await mockServices(page, manifest);
      await page.goto('/interview/');
      await page.getByRole('button', { name: '도로 서비스 목록' }).click();
      const nav = page.getByRole('navigation', { name: '도로 서비스 목록' });
      await expect(nav.getByRole('link', { name: /DORO\.log/ })).toBeVisible();
      await expect(nav.getByRole('link', { name: /허브/ })).toHaveCount(0);
    });

    test('목록을 못 읽으면 Doro Dev 홈 링크와 안내만 보이고 접근성을 지킨다', async ({ page }) => {
      await mockServices(page, { error: 'down' }, 500);
      await page.goto('/interview/');
      await page.getByRole('button', { name: '도로 서비스 목록' }).click();
      const nav = page.getByRole('navigation', { name: '도로 서비스 목록' });
      await expect(nav.getByRole('link', { name: /^Doro Dev 홈/ })).toHaveAttribute('href', '/dev/');
      await expect(nav.getByRole('link', { name: /^Doro Dev 홈/ })).toBeVisible();
      await expect(nav.getByText('불러오지 못했어요')).toBeVisible();
      expect(await auditAxe(page)).toEqual([]);
    });
  });
}

test.describe('면접: 서비스 목록 버튼 닫기', () => {
  test.beforeEach(async ({ page }) => installApi(page, 'anonymous'));

  test('Esc 로 닫는다', async ({ page }) => {
    await mockServices(page, manifest);
    await page.goto('/interview/');
    const button = page.getByRole('button', { name: '도로 서비스 목록' });
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('바깥을 누르면 닫는다', async ({ page }) => {
    await mockServices(page, manifest);
    await page.goto('/interview/');
    const button = page.getByRole('button', { name: '도로 서비스 목록' });
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await page.locator('main').click({ position: { x: 5, y: 5 } });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
