import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * 꼬리질문 모의면접(docs/M7-PLAN.md S5)을 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro + 실제 백엔드·DB·브라우저로 확인한다.
 * 실제 질문 은행(content/)의 사람이 검수한 FOLLOWUP 연결로 꼬리질문이 이어지는지, 쓰기(PUT)가 게이트웨이를 통과하는지 본다.
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌린다. 데스크톱 프로젝트에서만 돌린다(휴대폰 레이아웃은 모바일 감사가 잰다).
 */
test.skip(process.env.E2E_BFF !== '1', 'E2E_BFF=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});
test.describe.configure({ mode: 'serial' });

const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490';
const CSRF = { 'X-Interview-Csrf': '1' };

async function newUserContext(browser: Browser): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext();
  await context.addCookies([{ name: 'fake_user', value: crypto.randomUUID(), url: BASE }]);
  return { context, page: await context.newPage() };
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

let user: { context: BrowserContext; page: Page };

test.beforeAll(async ({ browser }) => {
  user = await newUserContext(browser);
});
test.afterAll(async () => {
  await user?.context.close();
});

test('본 질문에 맞으면 실제 연결의 꼬리질문이 이어지고, 건너뛰면 결과로 간다', async () => {
  const { page } = user;
  const errors = watch(page);
  await page.goto('/interview/mock');
  await page.getByRole('link', { name: /로그인/ }).first().click();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  await expect(page).toHaveURL(/\/interview\/mock$/);

  await page.getByRole('radio', { name: '1개' }).check();
  await page.getByRole('radio', { name: '2단계' }).check();
  await page.getByRole('checkbox', { name: /체크하지 않은 질문도/ }).check();
  const started = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/api\/v1\/mock\/[0-9a-f-]{36}$/.test(r.url()));
  await page.getByRole('button', { name: '모의면접 시작' }).click();
  expect((await started).status()).toBe(200);
  await expect(page).toHaveURL(/\/interview\/mock\/[0-9a-f-]{36}$/);
  const id = page.url().split('/').pop() as string;

  await expect(page.getByTestId('turn-origin')).toHaveText('본 질문');
  await expect(page.getByTestId('speak-timer')).toContainText('남은 시간');
  const mainTitle = await page.getByRole('heading', { level: 2 }).innerText();
  await page.getByRole('button', { name: '모범 답변 보기' }).click();
  await expect(page.getByRole('heading', { name: '모범 답변' })).toBeVisible();
  const recorded = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes(`/mock/${id}/turns/1`));
  await page.getByRole('button', { name: '맞음', exact: true }).click();
  expect((await recorded).status()).toBe(200);

  // 본 질문은 꼬리질문(FOLLOWUP)이 있는 질문만 뽑히므로 맞으면 반드시 꼬리질문이 이어진다
  await expect(page.getByTestId('turn-origin')).toHaveText('꼬리질문 1단계');
  await expect(page.getByText(/앞 질문에 이어서/)).toContainText(mainTitle.replaceAll('`', ''));
  await page.getByRole('button', { name: '건너뛰기' }).click();

  await expect(page.getByRole('heading', { name: '모의면접 결과' })).toBeVisible();
  await expect(page.getByRole('list', { name: '질문 줄기' }).getByText('꼬리질문 1단계')).toBeVisible();
  expect(errors).toEqual([]);

  // 새로고침해도 같은 결과(서버가 흐름을 저장한다)
  await page.reload();
  await expect(page.getByRole('heading', { name: '모의면접 결과' })).toBeVisible();
});

test('모의면접 쓰기는 PUT 만 통과하고, 남의 세션은 404 다', async ({ browser }) => {
  const res = await user.context.request.put(`/interview/api/v1/mock/${crypto.randomUUID()}`, {
    data: { mainCount: 1, maxDepth: 0, includeUnlearned: true },
    headers: CSRF,
  });
  expect(res.status()).toBe(200);
  const id = ((await res.json()) as { data: { sessionId: string } }).data.sessionId;
  const post = await user.context.request.post(`/interview/api/v1/mock/${id}/finish`, { data: {}, headers: CSRF });
  expect(post.status()).toBe(403); // 게이트웨이의 limit_except GET HEAD PUT

  const other = await newUserContext(browser);
  try {
    await other.page.goto('/interview/mock');
    await other.page.getByRole('link', { name: /로그인/ }).first().click();
    await expect(other.page.getByRole('button', { name: '로그아웃' })).toBeVisible();
    const peek = await other.context.request.get(`/interview/api/v1/mock/${id}`);
    expect(peek.status()).toBe(404);
  } finally {
    await other.context.close();
  }
});
