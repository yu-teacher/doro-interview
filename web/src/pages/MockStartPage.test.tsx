// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const PREFS = '/interview/api/v1/me/prefs';
const startPuts = (requests: { method: string; path: string }[]) => requests.filter((r) => r.method === 'PUT' && /\/mock\/[0-9a-f-]{36}$/.test(r.path));

const start = (routes: Record<string, unknown> = {}, session: unknown = authed()) => {
  const api = mockApi({ [SESSION_URL]: session, [PREFS]: { includeUnlearnedDefault: false }, ...routes });
  renderApp('/mock');
  return api;
};

/** 시작 요청을 받으면 첫 턴이 있는 세션을 돌려주는 가짜 서버. */
const okStart = respond((url) =>
  okResponse({
    sessionId: url.pathname.split('/').pop(),
    mainCount: 3,
    plannedMains: 3,
    maxDepth: 2,
    includeUnlearned: false,
    startedAt: '2026-11-26T01:00:00Z',
    finishedAt: null,
    turns: [],
  }),
);

describe('모의면접 시작 화면', () => {
  it('비로그인이면 로그인 안내를 보이고 시작 단추가 없다', async () => {
    start({}, anonymous());
    const link = await screen.findByRole('link', { name: '로그인하고 모의면접 보기' });
    expect(link.getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2Fmock');
    expect(screen.queryByRole('button', { name: '모의면접 시작' })).toBeNull();
  });

  it('기본값은 본 질문 3개·꼬리 2단계이고 최대 문항 수를 보여 준다', async () => {
    start();
    await screen.findByRole('button', { name: '모의면접 시작' });
    expect((screen.getByRole('radio', { name: '3개' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('radio', { name: '2단계' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByText(/최대 9문항/)).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: '0단계' }));
    expect(screen.getByText(/꼬리질문 없이 본 질문만 · 최대 3문항/)).toBeTruthy();
  });

  it('고른 값으로 PUT 시작을 보내고 모의면접 화면으로 간다', async () => {
    const { fn, requests } = start({ '/interview/api/v1/mock/any': null });
    const original = fn.getMockImplementation()!;
    fn.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await original(input, init); // 요청을 기록한다(없는 주소라 404 를 돌려준다)
      const url = new URL(String(input), 'http://localhost');
      if (init?.method === 'PUT' && /\/mock\/[0-9a-f-]{36}$/.test(url.pathname)) {
        return (okStart as (u: URL) => Response)(url);
      }
      if (/\/mock\/[0-9a-f-]{36}$/.test(url.pathname)) {
        return (okStart as (u: URL) => Response)(url); // 이동한 화면의 조회
      }
      return res;
    });
    await screen.findByRole('button', { name: '모의면접 시작' });
    fireEvent.click(screen.getByRole('radio', { name: '2개' }));
    fireEvent.click(screen.getByRole('radio', { name: '1단계' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '심화' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /체크하지 않은 질문도/ }));
    fireEvent.click(screen.getByRole('button', { name: '모의면접 시작' }));
    await waitFor(() => expect(startPuts(requests)).toHaveLength(1));
    expect(startPuts(requests)[0]).toMatchObject({ body: { mainCount: 2, maxDepth: 1, includeUnlearned: true, tiers: ['DEEP'] } });
    // 시작한 세션 화면으로 간다(턴이 없는 세션은 곧바로 결과 화면이다)
    expect(await screen.findByRole('heading', { level: 2, name: '모의면접 결과' })).toBeTruthy();
  });

  it('풀이 비면 서버의 안내와 질문 은행 링크를 보여 준다', async () => {
    const { fn } = start();
    const original = fn.getMockImplementation()!;
    fn.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) =>
      init?.method === 'PUT' ? errorResponse(400, 'QUIZ-400-02', '꼬리질문을 이어 갈 수 있는 질문이 없습니다.') : original(input, init),
    );
    fireEvent.click(await screen.findByRole('button', { name: '모의면접 시작' }));
    expect((await screen.findByRole('alert')).textContent).toContain('꼬리질문을 이어 갈 수 있는 질문이 없습니다.');
    expect(screen.getByRole('link', { name: '질문 은행에서 학습한 질문을 체크하기' })).toBeTruthy();
  });

  it('"미학습 포함" 기본값은 설정을 따른다', async () => {
    start({ [PREFS]: { includeUnlearnedDefault: true } });
    const box = (await screen.findByRole('checkbox', { name: /체크하지 않은 질문도/ })) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it('접근성 위반이 없다', async () => {
    start();
    await screen.findByRole('button', { name: '모의면접 시작' });
    expect(await a11yViolations()).toEqual([]);
  });

  it('시험 시작 화면에서 모의면접으로 가는 링크가 있다', async () => {
    mockApi({ [SESSION_URL]: authed(), [PREFS]: { includeUnlearnedDefault: false }, '/interview/api/v1/categories': [] });
    renderApp('/quiz');
    expect((await screen.findByRole('link', { name: '꼬리질문 모의면접' })).getAttribute('href')).toBe('/mock');
  });
});
