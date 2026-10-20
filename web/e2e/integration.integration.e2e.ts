import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { auditAxe, auditLayout } from './mobileAudit';

/**
 * 실제 백엔드·DB·브라우저로 읽기 경로 전체를 확인한다. 특정 질문 내용을 못 박지 않고 **API 가 돌려준 데이터를 기준**으로 삼아
 * 콘텐츠가 늘거나 검수가 진행돼도 깨지지 않게 한다(스크립트는 개발용 스위치를 켠 서버를 띄우므로 비공개 주제도 보인다).
 */

// 백엔드 응답 모양(web/src/api/types.ts 와 같다). 어느 쪽이든 바뀌면 이 시험이 실패해 양쪽을 함께 고치게 한다.
const KEYS = {
  topicSummary: ['baseVersion', 'counts', 'description', 'name', 'slug'],
  counts: ['basic', 'deep', 'tricky'],
  category: ['name', 'slug', 'topics'],
  questionSummary: ['concepts', 'difficulty', 'hasExtra', 'importance', 'keywords', 'slug', 'tier', 'title', 'topicSlug'],
  topicView: ['categoryName', 'categorySlug', 'questions', 'sources', 'summary'],
  questionDetail: [
    'baseVersion', 'categorySlug', 'concepts', 'detailMd', 'difficulty', 'followups', 'hasExtra', 'importance', 'keywords', 'needsReview',
    'nextSlug', 'prevSlug', 'prerequisites', 'related', 'reviewedAt', 'slug', 'sources', 'spokenAnswer', 'status', 'tier', 'title',
    'topicName', 'topicSlug', 'topicSources',
  ],
  conceptView: ['description', 'name', 'questionCount', 'slug'],
  searchResult: ['hits', 'total', 'words'],
  searchHit: ['matchedIn', 'question', 'score', 'topicName'],
};

const keysOf = (o: object) => Object.keys(o).sort();
/** 기대 키 목록도 같은 방식으로 정렬해 비교한다(손으로 정렬 순서를 맞추지 않는다). */
const expectKeys = (list: string[]) => [...list].sort();

interface Question { slug: string; tier: string; title: string; hasExtra: boolean; importance: number | null }
interface Detail extends Question { spokenAnswer: string; detailMd: string; topicSlug: string }

async function api<T>(request: APIRequestContext, path: string): Promise<T> {
  const res = await request.get(`/interview/api/v1/${path}`);
  expect(res.status(), path).toBe(200);
  const body = (await res.json()) as { success: boolean; data: T };
  expect(body.success).toBe(true);
  return body.data;
}

/** 브라우저 오류(콘솔 error, 처리되지 않은 예외, 4xx/5xx 이외의 요청 실패)를 모은다. */
function watchErrors(page: Page, allow: (url: string, status: number) => boolean = () => false) {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') {
      errors.push(`console.error: ${m.text()}`);
    }
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && !allow(r.url(), r.status())) {
      errors.push(`http ${r.status()}: ${r.url()}`);
    }
  });
  return errors;
}

let topicSlug: string;
let questions: Question[];
let sample: Detail; // 코드 블록과 배지가 있는 질문(데이터에서 고른다)

test.beforeAll(async ({ playwright, baseURL }) => {
  const request = await playwright.request.newContext({ baseURL });
  const categories = await api<{ topics: { slug: string; counts: { basic: number; deep: number; tricky: number } }[] }[]>(request, 'categories');
  const topics = categories.flatMap((c) => c.topics);
  expect(topics.length, '공개(또는 개발용 노출) 주제가 하나는 있어야 한다').toBeGreaterThan(0);
  // 질문이 가장 많은 주제를 쓴다
  topicSlug = topics.sort((a, b) => b.counts.basic + b.counts.deep + b.counts.tricky - (a.counts.basic + a.counts.deep + a.counts.tricky))[0].slug;
  const view = await api<{ questions: Question[] }>(request, `topics/${topicSlug}`);
  questions = view.questions;
  expect(questions.length).toBeGreaterThan(3);
  for (const q of questions) {
    const d = await api<Detail>(request, `questions/${q.slug}`);
    if (d.detailMd.includes('```') && /\((공식 문서|보충|실험 확인)\)|^- 공식 문서:/m.test(d.detailMd)) {
      sample = d;
      break;
    }
  }
  expect(sample, '코드 블록과 근거 표기가 모두 있는 질문이 이 주제에 하나는 있어야 한다').toBeTruthy();
  await request.dispose();
});

test.describe('API 계약', () => {
  test('응답 모양이 웹이 기대하는 것과 같다', async ({ request }) => {
    const categories = await api<{ topics: object[] }[]>(request, 'categories');
    expect(keysOf(categories[0])).toEqual(expectKeys(KEYS.category));
    const topic = categories[0].topics[0] as { counts: object };
    expect(keysOf(topic)).toEqual(expectKeys(KEYS.topicSummary));
    expect(keysOf(topic.counts)).toEqual(expectKeys(KEYS.counts));

    const view = await api<{ questions: object[] }>(request, `topics/${topicSlug}`);
    expect(keysOf(view)).toEqual(expectKeys(KEYS.topicView));
    expect(keysOf(view.questions[0])).toEqual(expectKeys(KEYS.questionSummary));

    expect(keysOf(await api<object>(request, `questions/${sample.slug}`))).toEqual(expectKeys(KEYS.questionDetail));

    const concepts = await api<object[]>(request, 'concepts');
    if (concepts.length > 0) {
      expect(keysOf(concepts[0])).toEqual(expectKeys(KEYS.conceptView));
    }

    const search = await api<{ hits: object[] }>(request, 'search?q=' + encodeURIComponent('프록시'));
    expect(keysOf(search)).toEqual(expectKeys(KEYS.searchResult));
    expect(search.hits.length).toBeGreaterThan(0);
    expect(keysOf(search.hits[0])).toEqual(expectKeys(KEYS.searchHit));
  });

  test('ETag 로 재검증하면 304 이고 오류 응답은 표준 규격이다', async ({ request }) => {
    const first = await request.get('/interview/api/v1/categories');
    const etag = first.headers()['etag'];
    expect(etag).toBeTruthy();
    expect(first.headers()['cache-control']).toBe('no-cache');
    const second = await request.get('/interview/api/v1/categories', { headers: { 'If-None-Match': etag } });
    expect(second.status()).toBe(304);
    const missing = await request.get('/interview/api/v1/questions/does-not-exist');
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toMatchObject({ success: false, code: 'COMMON-404-01', status: 404 });
  });
});

test.describe('읽기 흐름', () => {
  test('홈 → 주제 → 질문: 모범 답변, 접힌 근거·코드, 배지, 하이라이트', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto('/interview/');
    await page.locator(`a[href="/interview/t/${topicSlug}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/interview/t/${topicSlug}$`));
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(questions.length);

    await page.locator(`a[href="/interview/q/${sample.slug}"]`).click();
    await expect(page.getByRole('heading', { level: 1, name: sample.title })).toBeVisible();
    const answer = page.getByRole('region', { name: '모범 답변' });
    const head = sample.spokenAnswer.replace(/[`*]/g, '').slice(0, 14);
    await expect(answer).toContainText(head);

    const details = page.locator('details', { hasText: '근거 · 코드 · 실험 설명 보기' });
    await expect(details).not.toHaveAttribute('open', '');
    await details.getByText('근거 · 코드 · 실험 설명 보기').click();
    await expect(details.locator('[data-badge]').first()).toBeVisible();
    await expect(details.locator('pre code').first()).toBeVisible();
    // 하이라이트: 코드 조각에 hljs 토큰이 있고 색이 본문 글자색과 다르다
    const token = details.locator('pre code [class^="hljs-"]').first();
    await expect(token).toBeAttached();
    const colors = await token.evaluate((el) => ({ token: getComputedStyle(el).color, body: getComputedStyle(el.closest('pre') as Element).color }));
    expect(colors.token).not.toBe(colors.body);
    expect(await page.title()).toContain(sample.title.slice(0, 10));
    expect(errors).toEqual([]);
  });

  test('필터는 URL 에 남고 새로고침해도 유지되며 초기화로 돌아온다', async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(`/interview/t/${topicSlug}`);
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(questions.length);
    const deep = questions.filter((q) => q.tier === 'DEEP').length;
    await page.getByRole('button', { name: new RegExp(`^심화 \\(${deep}\\)$`) }).click();
    await expect(page).toHaveURL(/tier=DEEP/);
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(deep);
    await page.reload();
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(deep);
    await expect(page.getByRole('button', { name: /^심화 / })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: '필터 초기화' }).click();
    await expect(page).not.toHaveURL(/tier=/);
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(questions.length);
    expect(errors).toEqual([]);
  });

  test('검색: 결과 수가 API 와 같고 결과를 눌러 질문으로 간다', async ({ page, request }) => {
    const errors = watchErrors(page);
    const word = '프록시';
    const expected = await api<{ total: number; hits: { question: Question }[] }>(request, 'search?q=' + encodeURIComponent(word));
    await page.goto('/interview/');
    await page.getByRole('searchbox', { name: '질문 검색' }).fill(word);
    await page.getByRole('searchbox', { name: '질문 검색' }).press('Enter');
    await expect(page).toHaveURL(/\/interview\/search\?q=/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(`${expected.total}건`);
    const first = expected.hits[0].question;
    await page.locator(`a[href="/interview/q/${first.slug}"]`).first().click();
    await expect(page.getByRole('heading', { level: 1, name: first.title })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('주소를 직접 열어도 된다(SPA 폴백)', async ({ page }) => {
    await page.goto(`/interview/q/${sample.slug}`);
    await expect(page.getByRole('heading', { level: 1, name: sample.title })).toBeVisible();
    await page.goto(`/interview/t/${topicSlug}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('없는 질문은 찾을 수 없음 안내이고 브라우저에는 404 한 번뿐이다', async ({ page }) => {
    const errors = watchErrors(page, (url, status) => status === 404 && url.endsWith('/does-not-exist'));
    await page.goto('/interview/q/does-not-exist');
    await expect(page.getByRole('heading', { level: 1, name: '찾을 수 없는 질문입니다.' })).toBeVisible();
    expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
  });

  test('개념 화면: 개념이 있으면 목록→상세, 없으면 안내', async ({ page, request }) => {
    const concepts = await api<{ slug: string; name: string; questionCount: number }[]>(request, 'concepts');
    await page.goto('/interview/concepts');
    if (concepts.length === 0) {
      await expect(page.getByText('아직 공개된 개념이 없습니다.')).toBeVisible();
      return;
    }
    await page.locator(`a[href="/interview/c/${concepts[0].slug}"]`).click();
    await expect(page.getByRole('heading', { level: 1, name: concepts[0].name })).toBeVisible();
    await expect(page.locator('main ul li a[href*="/q/"]')).toHaveCount(concepts[0].questionCount);
  });
});

test.describe('접근성·키보드', () => {
  test('Tab 첫 대상은 건너뛰기 링크이고 누르면 본문으로 포커스가 간다', async ({ page, isMobile }) => {
    test.skip(Boolean(isMobile), '키보드 시험은 데스크톱에서만 한다');
    await page.goto(`/interview/t/${topicSlug}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: '본문으로 건너뛰기' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  for (const scheme of ['light', 'dark'] as const) {
    test(`실제 데이터 질문 화면의 접근성(색 대비 포함) — ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/interview/q/${sample.slug}`);
      await page.getByRole('heading', { level: 1, name: sample.title }).waitFor();
      await page.getByText('근거 · 코드 · 실험 설명 보기').click();
      await page.locator('pre code [class^="hljs-"]').first().waitFor();
      expect(await auditAxe(page)).toEqual([]);
    });

    test(`실제 데이터 주제 화면의 접근성(색 대비 포함) — ${scheme}`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: scheme });
      await page.goto(`/interview/t/${topicSlug}`);
      await page.getByRole('heading', { level: 1 }).waitFor();
      expect(await auditAxe(page)).toEqual([]);
    });
  }

  test('실제 데이터의 레이아웃(넘침·잘림·터치 영역)', async ({ page }) => {
    await page.goto(`/interview/t/${topicSlug}`);
    await page.getByRole('heading', { level: 1 }).waitFor();
    expect(await auditLayout(page)).toEqual([]);
    await page.goto(`/interview/q/${sample.slug}`);
    await page.getByRole('heading', { level: 1, name: sample.title }).waitFor();
    await page.getByText('근거 · 코드 · 실험 설명 보기').click();
    await page.locator('pre code').first().waitFor();
    expect(await auditLayout(page)).toEqual([]);
  });
});
