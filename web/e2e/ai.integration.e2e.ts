import { expect, test, type APIResponse, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * AI 피드백(M6)을 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro 의 가짜 AI 공급자 + 실제 백엔드·DB·브라우저로 확인한다(docs/M6-PLAN.md S4).
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌리고, 백엔드는 AI 를 켜고(사용자당 3회) 기준 주소를 가짜 Doro 로 둔다.
 * 실제 Anthropic 서버는 부르지 않는다: 실제 공급자 코드(요청 모양·헤더)는 가짜 서버로 확인된다.
 */
test.skip(process.env.E2E_BFF !== '1', 'E2E_BFF=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});
test.describe.configure({ mode: 'serial' });

const DORO = process.env.E2E_DORO_URL ?? 'http://127.0.0.1:18085';
const BASE = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490';
const CSRF = { 'X-Interview-Csrf': '1' };
const API_KEY = 'fake-ai-key-for-e2e';
const uuid = () => crypto.randomUUID();

interface Actor { context: BrowserContext; page: Page; user: string }

async function newActor(browser: Browser): Promise<Actor> {
  const context = await browser.newContext();
  const user = uuid();
  await context.addCookies([{ name: 'fake_user', value: user, url: BASE }]);
  const page = await context.newPage();
  await page.goto('/interview/');
  await page.getByRole('link', { name: /로그인/ }).first().click();
  await expect(page.getByRole('button', { name: '로그아웃' })).toBeVisible();
  return { context, page, user };
}

const data = async <T>(res: APIResponse): Promise<T> => ((await res.json()) as { data: T }).data;
const put = (a: Actor, url: string, body: unknown) => a.context.request.put(`/interview/api/v1${url}`, { data: body, headers: CSRF });

async function startQuiz(a: Actor, count: number): Promise<string> {
  const id = uuid();
  const res = await put(a, `/quiz/${id}`, { count, includeUnlearned: true });
  expect(res.status()).toBe(200);
  return id;
}

interface Fb { feedback: string; cached: boolean; remainingToday: number }
let alice: Actor;
let bob: Actor;

test.beforeAll(async ({ browser }) => {
  alice = await newActor(browser);
  bob = await newActor(browser);
});
test.afterAll(async () => {
  await alice?.context.close();
  await bob?.context.close();
});

test('상태는 켜짐과 남은 횟수이고, 비로그인은 401 이다', async ({ request }) => {
  const status = await data<{ enabled: boolean; perUserPerDay: number; remainingToday: number }>(await alice.context.request.get('/interview/api/v1/me/ai'));
  expect(status).toEqual({ enabled: true, perUserPerDay: 3, remainingToday: 3 });
  expect((await request.get('/interview/api/v1/me/ai')).status()).toBe(401);
});

test('피드백은 PUT 으로 게이트웨이를 통과하고, 같은 문항은 저장본이며, 한도(3회)를 넘으면 429 다', async () => {
  const session = await startQuiz(alice, 5);
  const fb = (seq: number, answer: string) => put(alice, `/quiz/${session}/items/${seq}/feedback`, { answerText: answer });

  const first = await fb(1, '프록시는 대리자입니다');
  expect(first.status()).toBe(200);
  expect(first.headers()['cache-control']).toContain('no-store');
  const body = await data<Fb>(first);
  expect(body.feedback).toContain('[가짜 AI] 프록시는 대리자입니다');
  expect(body.cached).toBe(false);
  expect(body.remainingToday).toBe(2);

  const again = await data<Fb>(await fb(1, '다른 답으로 다시'));
  expect(again).toMatchObject({ cached: true, feedback: body.feedback });
  expect(again.remainingToday).toBe(2); // 저장본은 횟수를 쓰지 않는다

  expect((await fb(2, 'b')).status()).toBe(200);
  expect((await fb(3, 'c')).status()).toBe(200);
  const limited = await fb(4, 'd');
  expect(limited.status()).toBe(429);
  expect(((await limited.json()) as { code: string }).code).toBe('AI-429-01');
  expect((await fb(1, 'x')).status()).toBe(200); // 한도에 닿아도 저장본은 계속 준다
  expect((await data<{ remainingToday: number }>(await alice.context.request.get('/interview/api/v1/me/ai'))).remainingToday).toBe(0);

  // 지난 시험을 열면 피드백이 붙어 있다
  const reopened = await data<{ items: { seq: number; feedback?: string }[] }>(await alice.context.request.get(`/interview/api/v1/quiz/${session}`));
  expect(reopened.items.find((i) => i.seq === 1)?.feedback).toContain('[가짜 AI]');
  expect(reopened.items.find((i) => i.seq === 4)?.feedback).toBeUndefined();
});

test('남의 시험·형식이 틀린 본문·CSRF 없는 요청은 막힌다', async () => {
  const session = await startQuiz(bob, 2);
  const url = `/interview/api/v1/quiz/${session}/items/1/feedback`;
  expect((await put(alice, `/quiz/${session}/items/1/feedback`, { answerText: '남의 시험' })).status()).toBe(404);
  expect((await put(bob, `/quiz/${session}/items/1/feedback`, { answerText: '' })).status()).toBe(400);
  expect((await put(bob, `/quiz/${session}/items/1/feedback`, { answerText: 'x', extra: 1 })).status()).toBe(400);
  expect((await bob.context.request.put(url, { data: { answerText: 'x' } })).status()).toBe(403); // CSRF 헤더 없음
});

test('공급자가 실패하면 503, 한도는 쓰지 않고, 시험은 계속되며, 키는 응답에 없다', async () => {
  const session = await startQuiz(bob, 3);
  const fail = await put(bob, `/quiz/${session}/items/1/feedback`, { answerText: 'FAIL-ME 부탁' });
  expect(fail.status()).toBe(503);
  const failBody = await fail.text();
  expect(failBody).toContain('AI-503-01');
  expect(failBody).not.toContain(API_KEY);
  expect(failBody).not.toContain('boom');
  expect((await data<{ remainingToday: number }>(await bob.context.request.get('/interview/api/v1/me/ai'))).remainingToday).toBe(3);

  expect((await put(bob, `/quiz/${session}/items/1`, { result: 'WRONG', seconds: 4 })).status()).toBe(200); // 시험은 계속된다
  const ok = await put(bob, `/quiz/${session}/items/2/feedback`, { answerText: '정상 답' });
  expect(ok.status()).toBe(200);
  expect(await ok.text()).not.toContain(API_KEY);

  // 가짜 공급자가 받은 요청: 키·버전 헤더가 맞고, 사용자 글은 시스템 프롬프트가 아니라 메시지에만 있다
  const last = (await (await bob.context.request.get(`${DORO}/dev/ai-last`)).json()) as { keyOk: boolean; body: { system: string; messages: { content: string }[] } };
  expect(last.keyOk).toBe(true);
  expect(last.body.system).not.toContain('정상 답');
  expect(last.body.messages[0].content).toContain('<candidate>\n정상 답\n</candidate>');
});

test('화면에서: 모범 답변을 연 뒤 AI 피드백을 받고, 새로고침해도 남고, 결과 화면에서 펼쳐 본다', async ({ browser }) => {
  const carol = await newActor(browser);
  const errors: string[] = [];
  carol.page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
  carol.page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  try {
    const page = carol.page;
    await page.goto('/interview/quiz');
    await page.getByLabel(/문제 수/).fill('1');
    await page.getByRole('checkbox', { name: /체크하지 않은 질문도 포함/ }).check();
    await page.getByRole('button', { name: '시험 시작' }).click();
    await expect(page).toHaveURL(/\/interview\/quiz\/[0-9a-f-]{36}$/);
    const url = page.url();

    await page.getByRole('textbox', { name: /내 답/ }).fill('내가 아는 대로 답합니다 <b>x</b>');
    await page.getByRole('button', { name: '모범 답변 보기' }).click();
    await expect(page.getByRole('heading', { name: 'AI 피드백' })).toBeVisible();
    await expect(page.getByText(/외부 AI 서비스로 전송됩니다/)).toBeVisible();
    await expect(page.getByText(/오늘 3회 남았습니다/)).toBeVisible();
    const sent = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().endsWith('/items/1/feedback'));
    await page.getByRole('button', { name: 'AI 피드백 받기' }).click();
    expect((await sent).status()).toBe(200);
    const box = page.getByTestId('ai-feedback');
    await expect(box).toContainText('[가짜 AI] 내가 아는 대로 답합니다 <b>x</b>');
    expect(await page.locator('main b').count()).toBe(0); // 일반 텍스트

    // 새로고침: 저장된 피드백이 모범 답변을 연 뒤 바로 보인다(다시 요청하지 않는다)
    await page.reload();
    await expect(page).toHaveURL(url);
    await page.getByRole('button', { name: '모범 답변 보기' }).click();
    await expect(page.getByTestId('ai-feedback')).toContainText('[가짜 AI]');
    await expect(page.getByRole('button', { name: 'AI 피드백 받기' })).toHaveCount(0);

    await page.getByRole('button', { name: '틀림', exact: true }).click();
    await expect(page.getByRole('heading', { name: '시험 결과' })).toBeVisible();
    await page.getByText('AI 피드백 보기').click();
    await expect(page.getByTestId('ai-feedback')).toContainText('[가짜 AI]');
    expect(errors).toEqual([]);
  } finally {
    await carol.context.close();
  }
});
