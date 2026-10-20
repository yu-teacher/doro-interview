import { expect, test, type APIRequestContext, type BrowserContext, type Page } from '@playwright/test';

/**
 * 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro(BFF·JWKS) + 실제 백엔드·DB·브라우저로 로그인 흐름을 확인한다(docs/M2-PLAN.md S8).
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌린다. 가짜 Doro 는 우리가 읽은 BFF 규격을 흉내 낸 것이라, 진짜 로그인(PKCE·IAM 화면)은 여기서 확인되지 않는다.
 * 데스크톱 프로젝트에서만 돌린다(휴대폰 화면의 로그인 상태 레이아웃은 모바일 감사가 따로 잰다).
 */
test.skip(process.env.E2E_BFF !== '1', 'E2E_BFF=1 (scripts/e2e-test.sh) 에서만 돌린다');
test.beforeEach(({ browserName: _b }, info) => {
  test.skip(info.project.name !== 'desktop', '데스크톱 프로젝트에서만 돌린다');
});
test.describe.configure({ mode: 'serial' });

const DORO = process.env.E2E_DORO_URL ?? 'http://127.0.0.1:18085';
const CSRF = { 'X-Interview-Csrf': '1' };
const uuid = () => crypto.randomUUID();

interface Session { authenticated: boolean; user?: { userId: string } }

async function newUser(context: BrowserContext, user = uuid()): Promise<string> {
  await context.addCookies([{ name: 'fake_user', value: user, url: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:18490' }]);
  return user;
}

async function sessionOf(request: APIRequestContext, headers: Record<string, string> = {}): Promise<Session> {
  const res = await request.get('/interview/api/v1/bff/session', { headers });
  expect(res.status()).toBe(200);
  return ((await res.json()) as { data: Session }).data;
}

/** 공개 주제 하나(질문 2개 이상)와 그 질문 slug 들. 내용을 못 박지 않고 API 가 준 값을 쓴다. */
async function pickTopic(request: APIRequestContext): Promise<{ topic: string; name: string; questions: string[] }> {
  const categories = ((await (await request.get('/interview/api/v1/categories')).json()) as { data: { topics: { slug: string; name: string }[] }[] }).data;
  for (const c of categories) {
    for (const t of c.topics) {
      const view = ((await (await request.get(`/interview/api/v1/topics/${t.slug}`)).json()) as { data: { questions: { slug: string }[] } }).data;
      if (view.questions.length >= 2) {
        return { topic: t.slug, name: t.name, questions: view.questions.map((q) => q.slug) };
      }
    }
  }
  throw new Error('질문이 2개 이상인 주제가 없다');
}

/** 브라우저 오류(콘솔 error — CSP 위반 포함, 처리되지 않은 예외)를 모은다. */
function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(`console.error: ${m.text()}`));
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  return errors;
}

const checks = (page: Page) => page.getByRole('checkbox', { name: /^학습함: / });
const loggedIn = (page: Page) => page.getByRole('button', { name: '로그아웃' });

async function login(page: Page) {
  await page.getByRole('link', { name: '로그인' }).first().click();
  await expect(loggedIn(page)).toBeVisible();
}

test('비로그인: 읽기는 그대로이고 체크 UI 는 없고 로그인 링크가 있다', async ({ page, request }) => {
  const { topic, name } = await pickTopic(request);
  const errors = watch(page);
  await page.goto(`/interview/t/${topic}`);
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  await expect(page.getByRole('link', { name: '로그인하고 학습 체크하기' })).toBeVisible();
  await expect(checks(page)).toHaveCount(0);
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  expect(await sessionOf(request)).toEqual({ authenticated: false });
  expect(errors).toEqual([]);
});

test('로그인하면 보던 화면으로 돌아오고, 체크는 새로고침해도 남는다', async ({ page, context, request }) => {
  const { topic, name, questions } = await pickTopic(request);
  const user = await newUser(context);
  const errors = watch(page);
  await page.goto(`/interview/t/${topic}`);
  await login(page);
  await expect(page).toHaveURL(new RegExp(`/interview/t/${topic}$`)); // 돌아온 경로
  await expect(page.getByRole('heading', { level: 1, name })).toBeVisible();
  expect(await sessionOf(context.request)).toEqual({ authenticated: true, user: { userId: user } });

  await expect(checks(page)).toHaveCount(questions.length);
  await expect(page.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', '0');
  const put = page.waitForResponse((r) => r.request().method() === 'PUT' && r.url().includes('/api/v1/progress/'));
  await checks(page).first().check();
  expect((await put).status()).toBe(200);
  await expect(page.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', '1');

  await page.reload();
  await expect(checks(page).first()).toBeChecked();
  await expect(page.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', '1');
  // 홈의 진도 막대도 같은 값이다
  await page.goto('/interview/');
  await expect(page.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', '1');
  expect(errors).toEqual([]);
});

test('다른 사용자는 남의 체크를 보지 못한다', async ({ browser, request }) => {
  const { topic, name, questions } = await pickTopic(request);
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  try {
    await newUser(alice); await newUser(bob);
    const a = await alice.newPage(); const b = await bob.newPage();
    await a.goto(`/interview/t/${topic}`); await login(a);
    await a.getByRole('button', { name: '모두 학습함으로 표시' }).click();
    await a.getByRole('button', { name: '표시하기' }).click();
    await expect(a.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', String(questions.length));

    await b.goto(`/interview/t/${topic}`); await login(b);
    await expect(checks(b)).toHaveCount(questions.length);
    for (const box of await checks(b).all()) {
      await expect(box).not.toBeChecked();
    }
    await expect(b.getByRole('progressbar', { name: `${name} 학습 진도` })).toHaveAttribute('aria-valuenow', '0');
  } finally {
    await alice.close(); await bob.close();
  }
});

test('주제 일괄 체크는 확인창을 거치고, 새로고침해도 남고, 해제할 수 있다', async ({ page, context, request }) => {
  const { topic, name, questions } = await pickTopic(request);
  await newUser(context);
  const errors = watch(page);
  await page.goto(`/interview/t/${topic}`); await login(page);
  const bar = page.getByRole('progressbar', { name: `${name} 학습 진도` });

  await page.getByRole('button', { name: '모두 학습함으로 표시' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText(`${questions.length}개 질문을 학습 완료로 표시합니다.`);
  await expect(dialog.getByRole('button', { name: '취소' })).toBeFocused();
  await dialog.getByRole('button', { name: '취소' }).click();
  await expect(bar).toHaveAttribute('aria-valuenow', '0'); // 취소는 아무것도 바꾸지 않는다

  await page.getByRole('button', { name: '모두 학습함으로 표시' }).click();
  await page.getByRole('button', { name: '표시하기' }).click();
  await expect(bar).toHaveAttribute('aria-valuenow', String(questions.length));
  await page.reload();
  await expect(bar).toHaveAttribute('aria-valuenow', String(questions.length));

  await page.getByRole('button', { name: '모두 해제' }).click();
  await page.getByRole('button', { name: '해제하기' }).click();
  await expect(bar).toHaveAttribute('aria-valuenow', '0');
  expect(errors).toEqual([]);
});

test('내 노트는 저장되고 새로고침해도 남고 다른 사용자에게는 없다', async ({ browser, request }) => {
  const { questions } = await pickTopic(request);
  const slug = questions[0];
  const alice = await browser.newContext();
  const bob = await browser.newContext();
  try {
    await newUser(alice); await newUser(bob);
    const a = await alice.newPage(); const b = await bob.newPage();
    const errors = watch(a);
    await a.goto(`/interview/q/${slug}`); await login(a);
    const box = a.getByRole('textbox', { name: '이 질문에 대한 내 노트' });
    await expect(box).toBeVisible();
    const memo = `헷갈린 점 <b>굵게</b> & "따옴표" ${Date.now()}`;
    await box.fill(memo);
    await a.getByRole('button', { name: '저장' }).click();
    await expect(a.getByText('저장했습니다.')).toBeVisible();
    await a.reload();
    await expect(a.getByRole('textbox', { name: '이 질문에 대한 내 노트' })).toHaveValue(memo);
    expect(await a.locator('main b').count()).toBe(0); // HTML 로 해석되지 않는다
    expect(errors).toEqual([]);

    await b.goto(`/interview/q/${slug}`); await login(b);
    await expect(b.getByRole('textbox', { name: '이 질문에 대한 내 노트' })).toHaveValue('');
  } finally {
    await alice.close(); await bob.close();
  }
});

test('로그아웃하면 체크 UI 가 사라지고 서비스도 익명으로 본다', async ({ page, context, request }) => {
  const { topic } = await pickTopic(request);
  await newUser(context);
  await page.goto(`/interview/t/${topic}`); await login(page);
  await loggedIn(page).click();
  await expect(page.getByRole('link', { name: '로그인' }).first()).toBeVisible();
  await expect(checks(page)).toHaveCount(0);
  expect(await sessionOf(context.request)).toEqual({ authenticated: false });
  expect((await context.cookies()).some((c) => c.name === 'doro_interview_session' && c.value !== '')).toBe(false);
});

test('CSRF 헤더 없이 쿠키로 쓰는 요청은 게이트웨이가 403 으로 끝낸다', async ({ page, context, request }) => {
  const { questions } = await pickTopic(request);
  await newUser(context);
  await page.goto('/interview/'); await login(page);
  const url = `/interview/api/v1/progress/${questions[0]}`;
  const noCsrf = await context.request.put(url, { data: { learned: true } });
  expect(noCsrf.status()).toBe(403);
  expect(((await noCsrf.json()) as { code: string }).code).toBe('AUTH-403-03');
  const withCsrf = await context.request.put(url, { data: { learned: true }, headers: CSRF });
  expect(withCsrf.status()).toBe(200);
  // 허용하지 않는 메서드(A6): 게이트웨이의 limit_except 가 403 을 만든다. 같은 @bff_forbidden 문구로 보이는지 기록한다.
  const del = await context.request.delete(url, { headers: CSRF });
  expect(del.status()).toBe(403);
  const delBody = await del.text();
  test.info().annotations.push({ type: "A6", description: `DELETE → ${del.status()} ${delBody}` });
  console.log(`A6: DELETE → ${del.status()} ${delBody}`);
  // 로그아웃 POST 도 CSRF 헤더가 필요하다(BFF 가 확인한다)
  expect((await context.request.post('/interview/api/v1/bff/logout')).status()).toBe(403);
});

test('위조·직접 Bearer: 쿠키가 없으면 클라이언트 값이 통과해 서비스가 서명으로 판단하고, 쿠키가 있으면 BFF 토큰이 이긴다', async ({ context, request, playwright }) => {
  const forged = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImZha2UtZG9yby1raWQifQ.eyJzdWIiOiIxMTExMTExMS0xMTExLTExMTEtMTExMS0xMTExMTExMTExMTEifQ.AAAA';
  // 쿠키 없음 + 위조 토큰: 서명이 틀려 익명
  expect(await sessionOf(request, { Authorization: `Bearer ${forged}` })).toEqual({ authenticated: false });
  // 쿠키 없음 + 진짜 서명 토큰(API 키·직접 호출과 같은 경로): 통과해 인증된다
  const someone = uuid();
  const { token } = (await (await request.get(`${DORO}/dev/token?user=${someone}`)).json()) as { token: string };
  expect(await sessionOf(request, { Authorization: `Bearer ${token}` })).toEqual({ authenticated: true, user: { userId: someone } });

  // 쿠키 있음 + 다른 사용자의 토큰을 헤더로 보냄: 게이트웨이가 BFF 토큰으로 덮어쓰므로 쿠키의 사용자로 보인다
  const mine = await newUser(context);
  const page = await context.newPage();
  await page.goto('/interview/'); await login(page);
  expect(await sessionOf(context.request, { Authorization: `Bearer ${token}` })).toEqual({ authenticated: true, user: { userId: mine } });
  await page.close();
  void playwright;
});

test('BFF 가 장애일 때 쿠키 있는 요청은 503, 쿠키 없는 읽기는 정상이고 복구되면 돌아온다', async ({ page, context, request }) => {
  await newUser(context);
  await page.goto('/interview/'); await login(page);
  expect((await request.post(`${DORO}/dev/outage?on=1`)).status()).toBe(200);
  try {
    const res = await context.request.get('/interview/api/v1/bff/session');
    expect(res.status()).toBe(503);
    const body = (await res.json()) as { code: string };
    expect(body.code).toBe('AUTH-503-02');
    expect(res.headers()['retry-after']).toBe('5');

    // 쿠키가 없는 공개 읽기는 BFF 가 죽어 있어도 그대로다
    expect((await request.get('/interview/api/v1/categories')).status()).toBe(200);
    expect(await sessionOf(request)).toEqual({ authenticated: false });
  } finally {
    await request.post(`${DORO}/dev/outage?on=0`);
  }
  expect((await sessionOf(context.request)).authenticated).toBe(true); // 복구되면 같은 쿠키로 다시 로그인 상태다
});
