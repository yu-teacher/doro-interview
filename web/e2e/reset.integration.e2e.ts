import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * 학습 현황 초기화를 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro + 실제 백엔드·DB·브라우저로 확인한다.
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌린다. 데스크톱 프로젝트에서만 돌린다. 쓰기가 PUT 이라 게이트웨이의 `limit_except GET HEAD PUT` 도 그대로 통과한다.
 */
test.skip(process.env.E2E_BFF !== '1', 'E2E_BFF=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490';
const CSRF = { 'X-Interview-Csrf': '1' };

async function newUserContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'fake_user', value: crypto.randomUUID(), url: BASE }]);
  return { context, page: await context.newPage() };
}

async function firstSlug(request: APIRequestContext): Promise<string> {
  const categories = ((await (await request.get('/interview/api/v1/categories')).json()) as { data: { topics: { slug: string }[] }[] }).data;
  for (const c of categories) {
    for (const t of c.topics) {
      const view = ((await (await request.get(`/interview/api/v1/topics/${t.slug}`)).json()) as { data: { questions: { slug: string }[] } }).data;
      if (view.questions.length >= 1) {
        return view.questions[0].slug;
      }
    }
  }
  throw new Error('공개된 질문이 없다');
}

test('초기화하면 학습 체크와 시험 기록이 사라지고 확인창 흐름이 게이트웨이를 통과한다', async ({ browser, request }) => {
  const { context, page } = await newUserContext(browser);
  try {
    const slug = await firstSlug(request);
    await page.goto('/interview/me');
    await page.getByRole('link', { name: /로그인/ }).first().click();
    await expect(page.getByRole('banner').getByRole('button', { name: '로그아웃' })).toBeVisible(); // 내 공부 화면 아래에도 로그아웃이 있어 헤더로 좁힌다

    // 체크 하나 + 시험 하나(틀림)
    expect((await context.request.put(`/interview/api/v1/progress/${slug}`, { data: { learned: true }, headers: CSRF })).status()).toBe(200);
    const id = crypto.randomUUID();
    expect((await context.request.put(`/interview/api/v1/quiz/${id}`, { data: { count: 1, includeUnlearned: false }, headers: CSRF })).status()).toBe(200);
    expect((await context.request.put(`/interview/api/v1/quiz/${id}/items/1`, { data: { result: 'WRONG' }, headers: CSRF })).status()).toBe(200);
    const before = ((await (await context.request.get('/interview/api/v1/me/stats')).json()) as { data: { askedLast30Days: number } }).data;
    expect(before.askedLast30Days).toBe(1);
    const progressBefore = ((await (await context.request.get('/interview/api/v1/progress/summary')).json()) as { data: { learned: number } }).data;
    expect(progressBefore.learned).toBe(1);

    // 화면에서 초기화
    await page.reload();
    await page.getByRole('button', { name: '학습 현황 초기화…' }).click();
    const dialog = page.getByRole('dialog', { name: '학습 현황을 초기화할까요?' });
    await expect(dialog).toBeVisible();
    const put = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().endsWith('/api/v1/me/reset'));
    await dialog.getByRole('button', { name: '초기화' }).click();
    expect((await put).status()).toBe(200);
    await expect(page.getByText('학습 현황을 초기화했습니다.')).toBeVisible();

    const after = ((await (await context.request.get('/interview/api/v1/me/stats')).json()) as { data: { askedLast30Days: number; mostMissed: unknown[] } }).data;
    expect(after.askedLast30Days).toBe(0);
    expect(after.mostMissed).toEqual([]);
    const progressAfter = ((await (await context.request.get('/interview/api/v1/progress/summary')).json()) as { data: { learned: number } }).data;
    expect(progressAfter.learned).toBe(0);
    expect((await context.request.get(`/interview/api/v1/quiz/${id}`)).status()).toBe(404);
  } finally {
    await context.close();
  }
});
