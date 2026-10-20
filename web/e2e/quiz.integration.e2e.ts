import { execFileSync } from 'node:child_process';
import { expect, test, type APIRequestContext, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * 랜덤 면접(M3)을 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro + 실제 백엔드·DB·브라우저로 확인한다(docs/M3-PLAN.md S9).
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌린다. 데스크톱 프로젝트에서만 돌린다(휴대폰 레이아웃은 모바일 감사가 잰다).
 * 시험 쓰기가 전부 PUT 이라 게이트웨이의 `limit_except GET HEAD PUT` 을 그대로 통과하는지(M3 D1)도 여기서 확인된다.
 */
test.skip(process.env.E2E_BFF !== '1', 'E2E_BFF=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});
test.describe.configure({ mode: 'serial' });

const DORO = process.env.E2E_DORO_URL ?? 'http://127.0.0.1:18085';
const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490';
const CSRF = { 'X-Interview-Csrf': '1' };
const uuid = () => crypto.randomUUID();

async function newUserContext(browser: Browser): Promise<{ context: BrowserContext; page: Page; user: string }> {
  const context = await browser.newContext();
  const user = uuid();
  await context.addCookies([{ name: 'fake_user', value: user, url: BASE }]);
  return { context, page: await context.newPage(), user };
}

async function login(page: Page) {
  await page.getByRole('link', { name: /로그인/ }).first().click();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
}

async function firstQuestion(request: APIRequestContext): Promise<{ slug: string; title: string }> {
  const categories = ((await (await request.get('/interview/api/v1/categories')).json()) as { data: { topics: { slug: string }[] }[] }).data;
  for (const c of categories) {
    for (const t of c.topics) {
      const view = ((await (await request.get(`/interview/api/v1/topics/${t.slug}`)).json()) as { data: { questions: { slug: string; title: string }[] } }).data;
      if (view.questions.length >= 1) {
        return view.questions[0];
      }
    }
  }
  throw new Error('공개된 질문이 없다');
}

/** DB 를 직접 센다(탈퇴 동기화가 시험 기록을 지웠는지 API 로는 볼 수 없다). 컨테이너가 없으면 null. */
function countRows(sql: string): number | null {
  const container = process.env.E2E_PG_CONTAINER;
  if (!container) {
    return null;
  }
  const out = execFileSync('docker', ['exec', container, 'psql', '-U', 'doro_admin', '-d', 'service_interview', '-tA', '-c', sql], { encoding: 'utf-8' });
  return Number(out.trim());
}

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

/** 시험 하나를 시작해 한 문제를 풀고 결과 화면까지 간다. 풀이는 `answer` 로 고른다. */
async function takeQuiz(page: Page, answer: '맞음' | '틀림'): Promise<string> {
  await page.goto('/interview/quiz');
  await page.getByLabel(/문제 수/).fill('1');
  const put = page.waitForResponse((r) => r.request().method() === 'PUT' && /\/api\/v1\/quiz\/[0-9a-f-]{36}$/.test(r.url()));
  await page.getByRole('button', { name: '시험 시작' }).click();
  expect((await put).status()).toBe(200);
  await expect(page).toHaveURL(/\/interview\/quiz\/[0-9a-f-]{36}$/);
  const id = page.url().split('/').pop() as string;
  await page.getByRole('textbox').fill('프록시가 감싸서 처리합니다.');
  await page.getByRole('button', { name: '모범 답변 보기' }).click();
  const result = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes(`/quiz/${id}/items/1`));
  await page.getByRole('button', { name: answer, exact: true }).click();
  expect((await result).status()).toBe(200);
  await expect(page.getByRole('heading', { name: '시험 결과' })).toBeVisible();
  return id;
}

let alice: { context: BrowserContext; page: Page; user: string };
let target: { slug: string; title: string };
let firstSession = '';

test.beforeAll(async ({ browser, request }) => {
  alice = await newUserContext(browser);
  target = await firstQuestion(request);
});
test.afterAll(async () => {
  await alice?.context.close();
});

test('체크한 질문이 없으면 안내하고, 체크하면 시험을 볼 수 있다(PUT 이 게이트웨이를 통과한다)', async () => {
  const errors = watch(alice.page);
  await alice.page.goto('/interview/quiz');
  await login(alice.page);
  await expect(alice.page).toHaveURL(/\/interview\/quiz$/);
  await alice.page.getByRole('button', { name: '시험 시작' }).click();
  await expect(alice.page.getByRole('alert')).toContainText('시험을 볼 질문이 없습니다');
  await expect(alice.page.getByRole('link', { name: '질문 은행에서 학습한 질문을 체크하기' })).toBeVisible();
  // 풀이 비었을 때의 400 은 의도한 응답이라 브라우저가 "Failed to load resource" 로 남긴다. 그 줄만 비우고 이후의 오류를 본다.
  expect(errors).toEqual(['console.error: Failed to load resource: the server responded with a status of 400 ()']);
  errors.length = 0;

  const checked = await alice.context.request.put(`/interview/api/v1/progress/${target.slug}`, { data: { learned: true }, headers: CSRF });
  expect(checked.status()).toBe(200);

  firstSession = await takeQuiz(alice.page, '틀림');
  await expect(alice.page.getByText('1문제 중 0문제 맞음 (0%)')).toBeVisible();
  await expect(alice.page.getByRole('link', { name: '사전에서 보기' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('틀린 질문은 다시 공부 후보로 보이고, 현황에도 나온다(체크는 풀리지 않는다)', async () => {
  await alice.page.goto('/interview/');
  await expect(alice.page.getByRole('heading', { name: '다시 공부 후보 (1)' })).toBeVisible();
  await expect(alice.page.getByRole('link', { name: target.title })).toBeVisible();

  await alice.page.goto(`/interview/q/${encodeURIComponent(target.slug)}`);
  await expect(alice.page.getByText(/최근 시험에서 이 질문을 틀렸습니다/)).toBeVisible();

  await alice.page.goto('/interview/stats');
  await expect(alice.page.getByRole('region', { name: '자주 틀린 질문' })).toContainText(target.title);
  await expect(alice.page.getByText('1회', { exact: true })).toBeVisible();

  const summary = ((await (await alice.context.request.get('/interview/api/v1/progress/summary')).json()) as { data: { learned: number } }).data;
  expect(summary.learned).toBe(1);
});

test('새로고침하면 안 푼 문제부터 이어서 한다', async () => {
  await alice.page.goto('/interview/quiz');
  await alice.page.getByLabel(/문제 수/).fill('1');
  await alice.page.getByRole('button', { name: '시험 시작' }).click();
  await expect(alice.page).toHaveURL(/\/interview\/quiz\/[0-9a-f-]{36}$/);
  const url = alice.page.url();
  await expect(alice.page.getByText('1 / 1')).toBeVisible();
  await alice.page.reload();
  await expect(alice.page).toHaveURL(url);
  await expect(alice.page.getByText('1 / 1')).toBeVisible();
  await expect(alice.page.getByRole('button', { name: '모범 답변 보기' })).toBeVisible();
  // 같은 id 로 다시 시작을 보내도 같은 세션이다(멱등)
  const id = url.split('/').pop() as string;
  const again = await alice.context.request.put(`/interview/api/v1/quiz/${id}`, { data: { count: 1, includeUnlearned: false }, headers: CSRF });
  expect(again.status()).toBe(200);
});

test('시험 중 모범 답변은 보기 전에는 내려오지 않는다', async () => {
  const requested: string[] = [];
  alice.page.on('request', (r) => requested.push(r.url()));
  await alice.page.reload();
  await expect(alice.page.getByRole('button', { name: '모범 답변 보기' })).toBeVisible();
  expect(requested.some((u) => u.includes('/api/v1/questions/'))).toBe(false);
});

test('맞게 풀면 후보에서 사라진다', async () => {
  // 풀지 않은 세션이 남아 있어도 새 시험은 시작된다. 이어서 한 문제를 맞게 푼다.
  await takeQuiz(alice.page, '맞음');
  await expect(alice.page.getByText('1문제 중 1문제 맞음 (100%)')).toBeVisible();
  await alice.page.goto('/interview/');
  await expect(alice.page.getByRole('heading', { name: /다시 공부 후보/ })).toHaveCount(0);
  await alice.page.goto(`/interview/q/${encodeURIComponent(target.slug)}`);
  await expect(alice.page.getByText(/최근 시험에서 이 질문을 틀렸습니다/)).toHaveCount(0);
});

test('다른 사용자는 남의 시험에 접근하지 못하고 통계도 따로다', async ({ browser }) => {
  const bob = await newUserContext(browser);
  try {
    await bob.page.goto('/interview/');
    await login(bob.page);
    const get = await bob.context.request.get(`/interview/api/v1/quiz/${firstSession}`);
    expect(get.status()).toBe(404);
    const put = await bob.context.request.put(`/interview/api/v1/quiz/${firstSession}/items/1`, { data: { result: 'CORRECT', seconds: 1 }, headers: CSRF });
    expect(put.status()).toBe(404);
    const stats = ((await (await bob.context.request.get('/interview/api/v1/me/stats')).json()) as { data: { sessionsLast30Days: number } }).data;
    expect(stats.sessionsLast30Days).toBe(0);
  } finally {
    await bob.context.close();
  }
});

test('쿠키로 쓰는 시험 요청도 CSRF 헤더가 없으면 403 이고, 비로그인은 401 이다', async ({ request }) => {
  const noCsrf = await alice.context.request.put(`/interview/api/v1/quiz/${uuid()}`, { data: { count: 1, includeUnlearned: false } });
  expect(noCsrf.status()).toBe(403);
  const anon = await request.get(`/interview/api/v1/quiz/${firstSession}`);
  expect(anon.status()).toBe(401);
});

test('Doro 에서 탈퇴하면 동기화가 시험 기록을 지운다', async () => {
  const before = countRows(`SELECT count(*) FROM quiz_session WHERE user_id = '${alice.user}'`);
  if (before !== null) {
    expect(before).toBeGreaterThan(0);
  }
  expect((await alice.context.request.post(`${DORO}/dev/deleted?user=${alice.user}`)).status()).toBe(200);
  // 동기화 주기는 2초다. 지워질 때까지 기다린다.
  await expect
    .poll(async () => (await alice.context.request.get(`/interview/api/v1/quiz/${firstSession}`)).status(), { timeout: 30_000, intervals: [500] })
    .not.toBe(200);
  if (before !== null) {
    await expect.poll(() => countRows(`SELECT count(*) FROM quiz_session WHERE user_id = '${alice.user}'`), { timeout: 30_000 }).toBe(0);
    expect(countRows(`SELECT count(*) FROM quiz_question_stats WHERE user_id = '${alice.user}'`)).toBe(0);
    expect(countRows(`SELECT count(*) FROM quiz_item WHERE session_id = '${firstSession}'`)).toBe(0);
  }
});
