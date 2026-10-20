// @vitest-environment jsdom
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hasDirtyDrafts } from '../drafts/draftRegistry';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, detail, quizItem, quizSession, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond, type SentRequest } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';
import type { QuizItem, QuizSession } from '../api/types';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const ID = '11111111-1111-1111-1111-111111111111';
const URL = `/interview/api/v1/quiz/${ID}`;
const ANSWER = '프록시가 메서드 호출 앞뒤로 트랜잭션을 엽니다.';

/** 문항 결과를 서버처럼 반영하는 가짜 서버. */
function server(initial: QuizSession, opts: { failItem?: () => Response } = {}) {
  let current = initial;
  const set = (items: QuizItem[], over: Partial<QuizSession> = {}) => (current = { ...current, items, ...over });
  const routes: Record<string, unknown> = {
    [SESSION_URL]: authed(),
    [URL]: respond(() => okResponse(current)),
    [`PUT ${URL}/finish`]: respond(() => {
      current = { ...current, finishedAt: '2026-10-20T01:00:00Z' };
      return okResponse(current);
    }),
    '/interview/api/v1/questions/tx-01': detail({ slug: 'tx-01', spokenAnswer: ANSWER, keywords: ['AOP 프록시', 'ThreadLocal'], importance: 3 }),
    '/interview/api/v1/questions/tx-02': detail({ slug: 'tx-02', spokenAnswer: '두 번째 모범 답변', keywords: [], importance: null }),
  };
  for (let seq = 1; seq <= 9; seq++) {
    routes[`PUT ${URL}/items/${seq}`] = respond((_u, req) => {
      if (opts.failItem) {
        return opts.failItem();
      }
      const body = req.body as { result: QuizItem['result']; seconds?: number; answerText?: string };
      set(current.items.map((i) => (i.seq === seq ? { ...i, result: body.result, seconds: body.seconds ?? null, answerText: body.answerText ?? null } : i)));
      return okResponse(current);
    });
  }
  return routes;
}

const open = async (routes: Record<string, unknown>) => {
  const api = mockApi(routes);
  renderApp(`/quiz/${ID}`);
  return api;
};
const puts = (requests: SentRequest[]) => requests.filter((r) => r.method === 'PUT' && r.path.includes('/items/'));
const twoItems = () => quizSession([quizItem(1), quizItem(2, { title: '질문 2', questionSlug: 'tx-02' })]);

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('시험 화면: 문제', () => {
  it('질문만 보이고 모범 답변은 아직 요청하지도 않는다', async () => {
    const { calls } = await open(server(twoItems()));
    expect(await screen.findByRole('heading', { level: 2, name: '질문 1' })).toBeTruthy();
    expect(screen.getByText('1 / 2')).toBeTruthy();
    expect(screen.getByText('트랜잭션')).toBeTruthy();
    expect(screen.queryByText(ANSWER)).toBeNull();
    expect(screen.queryByRole('button', { name: '맞음' })).toBeNull();
    expect(calls.some((c) => c.includes('/questions/'))).toBe(false); // 정답을 미리 받지 않는다
  });

  it('"모범 답변 보기" 를 누르면 그때서야 답변과 키워드를 받아 보여 주고 평가 버튼이 생긴다', async () => {
    const { calls } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    expect(await screen.findByText(ANSWER)).toBeTruthy();
    expect(calls.some((c) => c.includes('/questions/tx-01'))).toBe(true);
    expect(screen.getByRole('list', { name: '핵심 키워드' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '틀림' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '모범 답변 보기' })).toBeNull();
  });

  it('맞음을 누르면 결과·걸린 시간·내 답을 보내고 다음 문제로 간다', async () => {
    const { requests } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.change(screen.getByLabelText(/내 답/), { target: { value: '프록시가 연다' } });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText(ANSWER);
    fireEvent.click(screen.getByRole('button', { name: '맞음' }));
    expect(await screen.findByRole('heading', { level: 2, name: '질문 2' })).toBeTruthy();
    const sent = puts(requests)[0];
    expect(sent.path).toBe(`${URL}/items/1`);
    expect(sent.headers['X-Interview-Csrf']).toBe('1');
    expect(sent.body).toMatchObject({ result: 'CORRECT', answerText: '프록시가 연다' });
    expect(typeof (sent.body as { seconds: number }).seconds).toBe('number');
    expect(screen.getByText('2 / 2')).toBeTruthy();
    expect((screen.getByLabelText(/내 답/) as HTMLTextAreaElement).value).toBe(''); // 다음 문제의 입력은 비어 있다
  });

  it('답을 쓰지 않으면 answerText 를 보내지 않는다', async () => {
    const { requests } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText(ANSWER);
    fireEvent.click(screen.getByRole('button', { name: '틀림' }));
    await screen.findByRole('heading', { level: 2, name: '질문 2' });
    expect(puts(requests)[0].body).not.toHaveProperty('answerText');
    expect(puts(requests)[0].body).toMatchObject({ result: 'WRONG' });
  });

  it('건너뛰기는 모범 답변을 보지 않고도 할 수 있다', async () => {
    const { requests, calls } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    await screen.findByRole('heading', { level: 2, name: '질문 2' });
    expect(puts(requests)[0].body).toMatchObject({ result: 'SKIPPED' });
    expect(calls.some((c) => c.includes('/questions/'))).toBe(false);
  });

  it('평가를 연달아 눌러도 한 번만 보낸다', async () => {
    let release: (r: Response) => void = () => undefined;
    const routes = server(twoItems());
    routes[`PUT ${URL}/items/1`] = respond(() => new Promise<Response>((resolve) => (release = resolve)));
    const { requests } = await open(routes);
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText(ANSWER);
    const button = screen.getByRole('button', { name: '맞음' });
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(screen.getByRole('button', { name: '틀림' }));
    await waitFor(() => expect(puts(requests)).toHaveLength(1));
    release(okResponse(twoItems()));
  });

  it('2,000자를 넘는 답은 보낼 수 없다(이모지는 한 글자)', async () => {
    const { requests } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    const box = screen.getByLabelText(/내 답/);
    fireEvent.change(box, { target: { value: '😀'.repeat(2000) } });
    expect(screen.getByText('2,000/2,000자')).toBeTruthy();
    expect((screen.getByRole('button', { name: '건너뛰기' }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.change(box, { target: { value: '😀'.repeat(2001) } });
    expect(screen.getByText(/2,001\/2,000자 — 너무 깁니다/)).toBeTruthy();
    expect((screen.getByRole('button', { name: '모범 답변 보기' }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole('button', { name: '건너뛰기' }) as HTMLButtonElement).disabled).toBe(true);
    expect(puts(requests)).toHaveLength(0);
  });

  it('내 답을 쓰는 동안은 초안 등록부가 켜지고(서비스 워커 업데이트를 미룬다) 비우면 꺼진다', async () => {
    await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect(hasDirtyDrafts()).toBe(false);
    fireEvent.change(screen.getByLabelText(/내 답/), { target: { value: '쓰는 중' } });
    expect(hasDirtyDrafts()).toBe(true);
    fireEvent.change(screen.getByLabelText(/내 답/), { target: { value: '   ' } });
    expect(hasDirtyDrafts()).toBe(false);
    fireEvent.change(screen.getByLabelText(/내 답/), { target: { value: '다시' } });
    cleanup();
    expect(hasDirtyDrafts()).toBe(false); // 화면을 떠나면 꺼진다
  });

  it('경과 시간이 1초마다 늘고 문제가 바뀌면 다시 0 에서 시작한다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect(screen.getByTestId('elapsed').textContent).toBe('0:00');
    // 한 번에 65초를 보내면 부하가 큰 실행에서 틱이 합쳐질 수 있어, 1초씩 나눠 보낸다
    for (let i = 0; i < 67; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1_000);
      });
    }
    // 시작 시각을 잡는 시점이 부하에 따라 최대 1~2초 늦을 수 있어 범위로 확인한다(1분 단위 표기 자체를 검증하는 시험이다)
    expect(screen.getByTestId('elapsed').textContent).toMatch(/^1:0[5-7]$/);
  });
});

describe('시험 화면: 이어서 풀기·오류', () => {
  it('새로고침하면 안 푼 첫 문제부터 이어서 한다', async () => {
    const session = quizSession([quizItem(1, { result: 'CORRECT' }), quizItem(2, { result: 'WRONG' }), quizItem(3, { questionSlug: 'tx-03', title: '질문 3' })]);
    await open(server(session));
    expect(await screen.findByRole('heading', { level: 2, name: '질문 3' })).toBeTruthy();
    expect(screen.getByText('3 / 3')).toBeTruthy();
  });

  it('질문이 닫혔으면 안내하고 건너뛰기만 할 수 있다', async () => {
    const session = quizSession([quizItem(1, { title: null, tier: null, topicSlug: null, topicName: null })]);
    const { requests } = await open(server(session));
    expect(await screen.findByRole('heading', { level: 2, name: '이 질문은 더 이상 공개되지 않습니다.' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: '모범 답변 보기' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    await screen.findByRole('heading', { level: 2, name: '시험 결과' });
    expect(puts(requests)[0].body).toMatchObject({ result: 'SKIPPED' });
  });

  it('기록이 실패하면 안내하고 같은 문제에서 다시 시도할 수 있다', async () => {
    let fail = true;
    const routes = server(twoItems());
    const ok = routes[`PUT ${URL}/items/1`] as (u: URL, r: SentRequest) => Response;
    routes[`PUT ${URL}/items/1`] = respond((u, r) => (fail ? errorResponse(500, 'SYS-500-01', '서버 내부 오류가 발생했습니다.') : ok(u, r)));
    await open(routes);
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    expect((await screen.findByRole('alert')).textContent).toContain('서버 내부 오류가 발생했습니다.');
    expect(screen.getByRole('heading', { level: 2, name: '질문 1' })).toBeTruthy();
    fail = false;
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    await screen.findByRole('heading', { level: 2, name: '질문 2' });
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('기록 중 401 이면 비로그인으로 바뀐다', async () => {
    await open(server(twoItems(), { failItem: () => errorResponse(401, 'AUTH-401-01', 'x') }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    expect((await screen.findAllByRole('link', { name: '로그인' })).length).toBeGreaterThan(0); // 헤더와 시험 화면의 안내
    expect(screen.queryByRole('button', { name: '건너뛰기' })).toBeNull();
  });

  it('없는 시험은 찾을 수 없음 안내다(남의 시험도 같다)', async () => {
    await open({ [SESSION_URL]: authed(), [URL]: respond(() => errorResponse(404, 'COMMON-404-01', '요청한 리소스를 찾을 수 없습니다.')) });
    expect(await screen.findByRole('heading', { name: '찾을 수 없는 시험입니다.' })).toBeTruthy();
  });

  it('비로그인이면 로그인 안내이고 시험을 요청하지 않는다', async () => {
    const { calls } = await open({ [SESSION_URL]: anonymous() });
    expect((await screen.findAllByRole('link', { name: '로그인' })).length).toBeGreaterThan(0);
    expect(screen.getByText(/시험은 로그인한 뒤에 볼 수 있습니다/)).toBeTruthy();
    expect(calls.some((c) => c.includes('/quiz/'))).toBe(false);
  });
});

describe('시험 화면: 결과', () => {
  it('마지막 문제를 풀면 끝내기를 요청하고 결과를 보여 준다', async () => {
    const { requests } = await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText(ANSWER);
    fireEvent.click(screen.getByRole('button', { name: '맞음' }));
    await screen.findByRole('heading', { level: 2, name: '질문 2' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText('두 번째 모범 답변');
    fireEvent.click(screen.getByRole('button', { name: '틀림' }));
    expect(await screen.findByRole('heading', { level: 2, name: '시험 결과' })).toBeTruthy();
    expect(screen.getByText('2문제 중 1문제 맞음 (50%)')).toBeTruthy();
    await waitFor(() => expect(requests.some((r) => r.path === `${URL}/finish`)).toBe(true));
  });

  it('틀린 질문은 사전 링크와 함께 나열한다', async () => {
    const session = quizSession(
      [quizItem(1, { result: 'WRONG' }), quizItem(2, { questionSlug: 'tx-02', title: '질문 2', result: 'CORRECT' }), quizItem(3, { questionSlug: 'tx-03', title: '질문 3', result: 'SKIPPED' })],
      { finishedAt: '2026-10-20T01:00:00Z' },
    );
    await open(server(session));
    expect(await screen.findByRole('heading', { level: 2, name: '시험 결과' })).toBeTruthy();
    expect(screen.getByText('2문제 중 1문제 맞음 (50%)')).toBeTruthy();
    expect(screen.getByText(/맞음 1 · 틀림 1 · 건너뜀 1/)).toBeTruthy();
    const wrong = within(screen.getByRole('main')).getByRole('list');
    expect(within(wrong).getByText('질문 1')).toBeTruthy();
    expect(within(wrong).queryByText('질문 2')).toBeNull();
    expect(within(wrong).getByRole('link', { name: '사전에서 보기' }).getAttribute('href')).toBe('/q/tx-01');
    expect(screen.getByRole('link', { name: '다시 시험 보기' }).getAttribute('href')).toBe('/quiz');
  });

  it('끝난 시험을 다시 열면 끝내기를 또 요청하지 않는다', async () => {
    const session = quizSession([quizItem(1, { result: 'CORRECT' })], { finishedAt: '2026-10-20T01:00:00Z' });
    const { requests } = await open(server(session));
    await screen.findByRole('heading', { level: 2, name: '시험 결과' });
    expect(requests.some((r) => r.path.endsWith('/finish'))).toBe(false);
  });

  it('전부 건너뛰면 채점한 문제가 없다고 안내한다', async () => {
    const session = quizSession([quizItem(1, { result: 'SKIPPED' })], { finishedAt: '2026-10-20T01:00:00Z' });
    await open(server(session));
    expect(await screen.findByText('채점한 문제가 없습니다.')).toBeTruthy();
  });

  it('접근성 구조 위반이 없다(문제·답변 공개·결과)', async () => {
    await open(server(twoItems()));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect(await a11yViolations()).toEqual([]);
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText(ANSWER);
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    await open(server(quizSession([quizItem(1, { result: 'WRONG' })], { finishedAt: '2026-10-20T01:00:00Z' })));
    await screen.findByRole('heading', { level: 2, name: '시험 결과' });
    expect(await a11yViolations()).toEqual([]);
  });
});
