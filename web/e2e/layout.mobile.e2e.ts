import { expect, test, type Page } from '@playwright/test';
import { installApi, QUIZ_ACTIVE_ID, QUIZ_DONE_ID, type SessionMode } from './fixtures';
import { auditAxe, auditLayout } from './mobileAudit';

/** 화면 8종(+오류)을 라이트·다크 모드로 열어 레이아웃과 접근성(색 대비 포함)을 실제 브라우저에서 잰다. */
interface Case {
  name: string;
  path: string;
  ready: (page: Page) => Promise<void>;
  /** 로그인 상태(기본 비로그인) */
  session?: SessionMode;
  /** 화면을 연 뒤 잴 상태로 만드는 조작(확인창 열기 등) */
  act?: (page: Page) => Promise<void>;
}

const PAGES: Case[] = [
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
  // M2: 로그인 상태의 화면(체크박스·진도 막대·노트)과 세션을 알 수 없는 상태
  { name: '홈(로그인·진도)', path: '/', session: 'authenticated', ready: (p) => p.getByRole('progressbar').first().waitFor() },
  { name: '홈(세션 오류)', path: '/', session: 'error', ready: (p) => p.getByRole('button', { name: '다시 시도' }).waitFor() },
  { name: '주제(로그인·체크박스)', path: '/t/transaction', session: 'authenticated', ready: (p) => p.getByRole('checkbox', { name: /학습함/ }).first().waitFor() },
  { name: '주제(내 체크 필터)', path: '/t/transaction?ls=no', session: 'authenticated', ready: (p) => p.getByRole('checkbox', { name: /학습함/ }).first().waitFor() },
  {
    name: '주제(일괄 확인창)', path: '/t/transaction', session: 'authenticated',
    ready: (p) => p.getByRole('checkbox', { name: /학습함/ }).first().waitFor(),
    act: async (p) => {
      await p.getByRole('button', { name: '모두 학습함으로 표시' }).click();
      await p.getByRole('dialog').waitFor();
    },
  },
  // M3: 시험·현황·훑기
  { name: '시험 시작', path: '/quiz', session: 'authenticated', ready: (p) => p.getByRole('button', { name: '시험 시작' }).waitFor() },
  { name: '시험 시작(비로그인)', path: '/quiz', ready: (p) => p.getByRole('link', { name: '로그인하고 시험 보기' }).waitFor() },
  { name: '시험 진행(질문)', path: `/quiz/${QUIZ_ACTIVE_ID}`, session: 'authenticated', ready: (p) => p.getByRole('textbox').waitFor() },
  {
    name: '시험 진행(모범 답변 공개)', path: `/quiz/${QUIZ_ACTIVE_ID}`, session: 'authenticated',
    ready: (p) => p.getByRole('textbox').waitFor(),
    act: async (p) => {
      await p.getByRole('textbox').fill('프록시가 감싸서 처리합니다. '.repeat(20));
      await p.getByRole('button', { name: '모범 답변 보기' }).click();
      await p.getByRole('button', { name: '맞음' }).waitFor();
    },
  },
  { name: '시험 결과', path: `/quiz/${QUIZ_DONE_ID}`, session: 'authenticated', ready: (p) => p.getByRole('link', { name: /사전에서 보기/ }).first().waitFor() },
  { name: '내 현황', path: '/stats', session: 'authenticated', ready: (p) => p.getByRole('region', { name: '자주 틀린 질문' }).waitFor() },
  { name: '훑기 주제 선택', path: '/skim', ready: (p) => p.getByRole('link', { name: 'JPA' }).waitFor() },
  { name: '훑기(키워드 공개)', path: '/skim/transaction', ready: (p) => p.getByRole('button', { name: '키워드 보기' }).waitFor(), act: (p) => p.getByRole('button', { name: '키워드 보기' }).click() },
  { name: '질문 상세(로그인·노트)', path: '/q/tx-04', session: 'authenticated', ready: (p) => p.getByRole('textbox', { name: '이 질문에 대한 내 노트' }).waitFor() },
];

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`${scheme} 모드`, () => {
    test.use({ colorScheme: scheme });

    for (const { name, path, ready, session = 'anonymous', act } of PAGES) {
      test(`${name}: 레이아웃`, async ({ page }) => {
        await installApi(page, session);
        await page.goto(`/interview${path}`);
        await ready(page);
        await act?.(page);
        // 질문 상세는 근거·코드를 펼친 상태도 잰다(가장 넓어지는 상태)
        if (path === '/q/tx-04') {
          await page.getByText('근거 · 코드 · 실험 설명 보기').click();
          await page.locator('pre code').first().waitFor();
        }
        expect(await auditLayout(page)).toEqual([]);
      });

      test(`${name}: 접근성(색 대비 포함)`, async ({ page }) => {
        await installApi(page, session);
        await page.goto(`/interview${path}`);
        await ready(page);
        await act?.(page);
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
