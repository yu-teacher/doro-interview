import { execFileSync } from 'node:child_process';
import { expect, test, type APIResponse, type Browser, type BrowserContext, type Page } from '@playwright/test';

/**
 * 내 질문(M4)을 게이트웨이(실제 조각·CSP 강제) + 가짜 Doro + 실제 백엔드·DB 로 확인한다(docs/M4-PLAN.md S4).
 * scripts/e2e-test.sh 가 E2E_BFF=1 로 돌린다. 데스크톱 프로젝트에서만 돌린다.
 * 추가·수정·삭제·일괄이 전부 PUT 이라 게이트웨이의 `limit_except GET HEAD PUT` 을 그대로 통과하는지(DELETE 는 막힘)도 여기서 확인된다.
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

function countRows(sql: string): number | null {
  const container = process.env.E2E_PG_CONTAINER;
  if (!container) {
    return null;
  }
  const out = execFileSync('docker', ['exec', container, 'psql', '-U', 'doro_admin', '-d', 'service_interview', '-tA', '-c', sql], { encoding: 'utf-8' });
  return Number(out.trim());
}

interface Mine { id: string; slug: string; title: string; learned: boolean; reviewCandidate: boolean }
interface Quiz { sessionId: string; items: { seq: number; questionSlug: string; title: string | null; topicSlug: string | null; topicName: string | null; result: string | null }[] }

let alice: Actor;
let bob: Actor;
const q1 = uuid();
const q2 = uuid();

test.beforeAll(async ({ browser }) => {
  alice = await newActor(browser);
  bob = await newActor(browser);
});
test.afterAll(async () => {
  await alice?.context.close();
  await bob?.context.close();
});

const put = (a: Actor, url: string, body: unknown, headers: Record<string, string> = CSRF) => a.context.request.put(`/interview/api/v1${url}`, { data: body, headers });
const get = (a: Actor, url: string) => a.context.request.get(`/interview/api/v1${url}`);

test('추가·수정·일괄이 PUT 으로 게이트웨이를 통과하고 응답은 저장하지 않는다', async () => {
  const created = await put(alice, `/mine/${q1}`, { title: '강사님이 짚어 준 질문', answerText: '내 답', keywords: ['a', 'b'], tier: 'DEEP', sourceLabel: '강사 추천' });
  expect(created.status()).toBe(200);
  expect(created.headers()['cache-control']).toContain('no-store');
  const body = await data<Mine>(created);
  expect(body.slug).toBe(`my-${q1}`);
  expect(body.learned).toBe(false);

  const edited = await put(alice, `/mine/${q1}`, { title: '수정한 제목', answerText: '내 답', keywords: ['a'], tier: 'DEEP', sourceLabel: '강사 추천' });
  expect((await data<Mine>(edited)).title).toBe('수정한 제목');

  const batch = await put(alice, '/mine', { items: [{ id: q2, title: '두 번째' }, { id: uuid(), title: '세 번째' }] });
  expect(batch.status()).toBe(200);
  const list = await data<Mine[]>(await get(alice, '/mine'));
  expect(list).toHaveLength(3);
});

test('CSRF 헤더가 없으면 403, DELETE 는 게이트웨이가 403, 비로그인은 401 이다', async ({ request }) => {
  expect((await put(alice, `/mine/${uuid()}`, { title: 'x' }, {})).status()).toBe(403);
  const del = await alice.context.request.delete(`/interview/api/v1/mine/${q1}`, { headers: CSRF });
  expect(del.status()).toBe(403);
  expect((await request.get('/interview/api/v1/mine')).status()).toBe(401);
  expect((await get(alice, '/mine')).status()).toBe(200);
});

test('다른 사용자는 남의 내 질문을 보거나 바꾸거나 지울 수 없다', async () => {
  expect((await get(bob, `/mine/${q1}`)).status()).toBe(404);
  expect((await put(bob, `/mine/${q1}`, { title: '가로채기' })).status()).toBe(404);
  expect((await put(bob, `/mine/${q1}/deleted`, { deleted: true })).status()).toBe(404);
  expect((await put(bob, `/progress/my-${q1}`, { learned: true })).status()).toBe(404);
  expect(await data<Mine[]>(await get(bob, '/mine'))).toHaveLength(0);
  expect((await data<Mine>(await get(alice, `/mine/${q1}`))).title).toBe('수정한 제목');
});

test('공용 응답에는 내 질문이 섞이지 않는다', async ({ request }) => {
  const anon = await (await request.get('/interview/api/v1/categories')).text();
  const asAlice = await (await get(alice, '/categories')).text();
  for (const text of [anon, asAlice]) {
    expect(text).not.toContain('my-');
    expect(text).not.toContain('수정한 제목');
  }
  const search = await (await get(alice, '/search?q=' + encodeURIComponent('수정한'))).text();
  expect(search).not.toContain(`my-${q1}`);
});

test('체크하고 시험을 보면 내 질문이 출제되고, 틀리면 후보가 되고, 맞으면 사라진다', async () => {
  expect((await put(alice, `/progress/my-${q1}`, { learned: true })).status()).toBe(200);
  const s1 = uuid();
  const started = await put(alice, `/quiz/${s1}`, { count: 5, includeUnlearned: false, topics: ['@mine'] });
  expect(started.status()).toBe(200);
  const quiz = await data<Quiz>(started);
  expect(quiz.items).toHaveLength(1);
  expect(quiz.items[0]).toMatchObject({ questionSlug: `my-${q1}`, title: '수정한 제목', topicSlug: '@mine', topicName: '내 질문' });
  expect(JSON.stringify(quiz)).not.toContain('내 답'); // 내가 적은 답은 시험 응답에 실리지 않는다(보기 전에는 내려오지 않는다)

  expect((await put(alice, `/quiz/${s1}/items/1`, { result: 'WRONG', seconds: 7 })).status()).toBe(200);
  const candidates = await data<{ slug: string; topicName: string }[]>(await get(alice, '/review-candidates'));
  expect(candidates).toEqual([expect.objectContaining({ slug: `my-${q1}`, topicName: '내 질문' })]);
  expect((await data<Mine>(await get(alice, `/mine/${q1}`))).reviewCandidate).toBe(true);

  const s2 = uuid();
  await put(alice, `/quiz/${s2}`, { count: 5, includeUnlearned: false, topics: ['@mine'] });
  expect((await put(alice, `/quiz/${s2}/items/1`, { result: 'CORRECT', seconds: 4 })).status()).toBe(200);
  expect(await data<unknown[]>(await get(alice, '/review-candidates'))).toHaveLength(0);
});

test('삭제는 PUT 이고, 체크·통계는 사라지고 지난 시험은 깨지지 않는다', async () => {
  const history = uuid();
  await put(alice, `/progress/my-${q2}`, { learned: true });
  await put(alice, `/quiz/${history}`, { count: 5, includeUnlearned: false, topics: ['@mine'] });
  const before = await data<Quiz>(await get(alice, `/quiz/${history}`));
  expect(before.items.length).toBeGreaterThan(0);

  const deleted = await put(alice, `/mine/${q2}/deleted`, { deleted: true });
  expect(deleted.status()).toBe(200);
  expect((await get(alice, `/mine/${q2}`)).status()).toBe(404);
  expect((await put(alice, `/mine/${q2}/deleted`, { deleted: true })).status()).toBe(404);

  const after = await data<Quiz>(await get(alice, `/quiz/${history}`));
  const gone = after.items.find((i) => i.questionSlug === `my-${q2}`);
  if (gone) {
    expect(gone.title).toBeNull(); // 지워진 질문은 제목 없이 나온다
  }
  const checked = countRows(`SELECT count(*) FROM user_progress WHERE user_id = '${alice.user}' AND question_slug = 'my-${q2}'`);
  if (checked !== null) {
    expect(checked).toBe(0);
  }
});

test('Doro 에서 탈퇴하면 동기화가 내 질문과 체크를 지운다', async () => {
  const before = countRows(`SELECT count(*) FROM my_question WHERE user_id = '${alice.user}'`);
  if (before !== null) {
    expect(before).toBeGreaterThan(0);
  }
  expect((await alice.context.request.post(`${DORO}/dev/deleted?user=${alice.user}`)).status()).toBe(200);
  if (before !== null) {
    await expect.poll(() => countRows(`SELECT count(*) FROM my_question WHERE user_id = '${alice.user}'`), { timeout: 30_000 }).toBe(0);
    expect(countRows(`SELECT count(*) FROM user_progress WHERE user_id = '${alice.user}'`)).toBe(0);
  }
});
