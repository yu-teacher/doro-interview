// @vitest-environment jsdom
import { cleanup, fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { MockSession, MockTurn } from '../api/types';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, detail, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond, type SentRequest } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

const ID = '22222222-2222-4222-8222-222222222222';
const URL = `/interview/api/v1/mock/${ID}`;
const ANSWER = '프록시가 메서드 호출 앞뒤로 트랜잭션을 엽니다.';

function turn(seq: number, over: Partial<MockTurn> = {}): MockTurn {
  return {
    seq,
    parentSeq: null,
    depth: 0,
    origin: 'MAIN',
    questionSlug: `tx-0${seq}`,
    title: `질문 ${seq}`,
    tier: 'BASIC',
    topicSlug: 'transaction',
    topicName: '트랜잭션',
    result: null,
    seconds: null,
    answerText: null,
    answeredAt: null,
    ...over,
  };
}

function session(turns: MockTurn[], over: Partial<MockSession> = {}): MockSession {
  return {
    sessionId: ID,
    mainCount: 3,
    plannedMains: 2,
    maxDepth: 2,
    includeUnlearned: false,
    startedAt: '2026-11-26T01:00:00Z',
    finishedAt: null,
    turns,
    ...over,
  };
}

/** 결과를 받으면 정해 둔 다음 턴을 붙이는 가짜 서버(다음 턴이 없으면 끝낸다). */
function server(initial: MockSession, nextBySeq: Record<number, MockTurn | null>, opts: { failTurn?: () => Response } = {}) {
  let current = initial;
  const routes: Record<string, unknown> = {
    [SESSION_URL]: authed(),
    [URL]: respond(() => okResponse(current)),
    [`PUT ${URL}/finish`]: respond(() => {
      current = { ...current, finishedAt: '2026-11-26T02:00:00Z' };
      return okResponse(current);
    }),
    '/interview/api/v1/questions/tx-01': detail({ slug: 'tx-01', spokenAnswer: ANSWER, keywords: ['AOP 프록시'], importance: 3 }),
    '/interview/api/v1/questions/tx-02': detail({ slug: 'tx-02', spokenAnswer: '꼬리 모범 답변', keywords: [], importance: null }),
  };
  for (let seq = 1; seq <= 9; seq++) {
    routes[`PUT ${URL}/turns/${seq}`] = respond((_u, req) => {
      if (opts.failTurn) {
        return opts.failTurn();
      }
      const body = req.body as { result: MockTurn['result']; seconds?: number; answerText?: string };
      const turns = current.turns.map((t) => (t.seq === seq ? { ...t, result: body.result, seconds: body.seconds ?? null, answerText: body.answerText ?? null } : t));
      const next = nextBySeq[seq];
      current = next ? { ...current, turns: [...turns, next] } : { ...current, turns, finishedAt: '2026-11-26T02:00:00Z' };
      return okResponse(current);
    });
  }
  return routes;
}

const open = (routes: Record<string, unknown>) => {
  const api = mockApi(routes);
  renderApp(`/mock/${ID}`);
  return api;
};
const turnPuts = (requests: SentRequest[]) => requests.filter((r) => r.method === 'PUT' && r.path.includes('/turns/'));

const followup = turn(2, { origin: 'LINK', depth: 1, parentSeq: 1, questionSlug: 'tx-02', title: '꼬리 질문', tier: 'DEEP' });

describe('모의면접 화면: 질문', () => {
  it('본 질문과 자리·60초 타이머를 보여 주고 모범 답변은 미리 받지 않는다', async () => {
    const { calls } = open(server(session([turn(1)]), {}));
    expect(await screen.findByRole('heading', { level: 2, name: '질문 1' })).toBeTruthy();
    expect(screen.getByText('본 질문 1 / 2')).toBeTruthy();
    expect(screen.getByTestId('turn-origin').textContent).toBe('본 질문');
    expect(screen.getByTestId('speak-timer').textContent).toBe('남은 시간 1:00');
    expect(calls.some((c) => c.includes('/questions/'))).toBe(false);
    expect(screen.queryByRole('button', { name: '맞음' })).toBeNull();
  });

  it('맞음을 보내면 서버가 정한 꼬리질문이 이어지고 앞 질문을 보여 준다', async () => {
    const { requests } = open(server(session([turn(1)]), { 1: followup }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    expect(await screen.findByText(ANSWER)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '맞음' }));
    expect(await screen.findByRole('heading', { level: 2, name: '꼬리 질문' })).toBeTruthy();
    expect(screen.getByTestId('turn-origin').textContent).toBe('꼬리질문 1단계');
    expect(screen.getByText(/앞 질문에 이어서/).textContent).toContain('질문 1');
    expect(screen.getByText('본 질문 1 / 2')).toBeTruthy(); // 꼬리질문은 본 질문 번호를 늘리지 않는다
    const sent = turnPuts(requests)[0];
    expect(sent.path).toBe(`${URL}/turns/1`);
    expect(sent.body).toMatchObject({ result: 'CORRECT' });
    expect(sent.body).not.toHaveProperty('answerText');
  });

  it('기초 확인 턴은 그렇게 표시한다', async () => {
    const prereq = turn(2, { origin: 'PREREQ', depth: 0, parentSeq: 1, questionSlug: 'tx-02', title: '기초 질문' });
    open(server(session([turn(1, { result: 'WRONG' }), prereq]), {}));
    expect(await screen.findByRole('heading', { level: 2, name: '기초 질문' })).toBeTruthy();
    expect(screen.getByTestId('turn-origin').textContent).toBe('기초 확인');
    expect(screen.getByText(/먼저 이것부터/).textContent).toContain('질문 1');
  });

  it('적어 둔 답은 함께 보내고, 답 입력은 접혀 있다', async () => {
    const { requests } = open(server(session([turn(1)]), { 1: followup }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    const summary = screen.getByText('답 적어 두기 (선택)');
    expect(summary.closest('details')?.hasAttribute('open')).toBe(false);
    fireEvent.change(screen.getByLabelText('내 답'), { target: { value: '프록시가 연다' } });
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    await screen.findByRole('heading', { level: 2, name: '꼬리 질문' });
    expect(turnPuts(requests)[0].body).toMatchObject({ result: 'SKIPPED', answerText: '프록시가 연다' });
  });

  it('60초가 지나면 초과 시간을 보여 주고 계속 답할 수 있다', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    open(server(session([turn(1)]), {}));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    await vi.advanceTimersByTimeAsync(65_000);
    expect(screen.getByTestId('speak-timer').textContent).toBe('시간 초과 +0:05');
    expect((screen.getByRole('button', { name: '모범 답변 보기' }) as HTMLButtonElement).disabled).toBe(false);
  });

  it('기록에 실패하면 알리고 같은 질문에 머문다', async () => {
    open(server(session([turn(1)]), {}, { failTurn: () => errorResponse(409, 'QUIZ-409-02', '이미 끝난 시험입니다.') }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    fireEvent.click(screen.getByRole('button', { name: '건너뛰기' }));
    expect((await screen.findByRole('alert')).textContent).toContain('이미 끝난 시험입니다.');
    expect(screen.getByRole('heading', { level: 2, name: '질문 1' })).toBeTruthy();
  });

  it('비로그인이면 로그인 안내만 보이고 세션을 요청하지 않는다', async () => {
    const { calls } = open({ [SESSION_URL]: anonymous() });
    expect((await screen.findAllByRole('link', { name: '로그인' })).length).toBeGreaterThan(0); // 헤더와 화면의 안내
    expect(screen.getByText(/모의면접은 로그인한 뒤에 볼 수 있습니다/)).toBeTruthy();
    expect(calls.some((c) => c.includes('/mock/'))).toBe(false);
  });
});

describe('모의면접 화면: 결과', () => {
  it('마지막 턴에 답하면 줄기별 결과를 보여 준다', async () => {
    open(server(session([turn(1, { result: 'CORRECT' }), { ...followup }]), { 2: null }));
    await screen.findByRole('heading', { level: 2, name: '꼬리 질문' });
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    await screen.findByText('꼬리 모범 답변');
    fireEvent.click(screen.getByRole('button', { name: '틀림' }));
    expect(await screen.findByRole('heading', { level: 2, name: '모의면접 결과' })).toBeTruthy();
    expect(screen.getByText('2문항 중 1문항 맞음 (50%)')).toBeTruthy();
    const list = screen.getByRole('list', { name: '질문 줄기' });
    const items = within(list).getAllByText(/꼬리질문 1단계|본 질문/);
    expect(items.map((i) => i.textContent)).toEqual(['본 질문', '꼬리질문 1단계']);
    expect(within(list).getByRole('link', { name: '꼬리 질문' }).getAttribute('href')).toBe('/q/tx-02');
  });

  it('"그만하기" 를 누르면 끝내고 답하지 않은 턴은 그렇게 표시한다', async () => {
    const { requests } = open(server(session([turn(1, { result: 'CORRECT' }), followup]), {}));
    await screen.findByRole('heading', { level: 2, name: '꼬리 질문' });
    fireEvent.click(screen.getByRole('button', { name: '여기서 그만하고 결과 보기' }));
    expect(await screen.findByRole('heading', { level: 2, name: '모의면접 결과' })).toBeTruthy();
    expect(requests.some((r) => r.method === 'PUT' && r.path === `${URL}/finish`)).toBe(true);
    expect(screen.getByText('답하지 않음')).toBeTruthy();
  });

  it('질문 화면과 결과 화면에 접근성 위반이 없다', async () => {
    open(server(session([turn(1)]), {}));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    open(server(session([turn(1, { result: 'WRONG' })], { finishedAt: '2026-11-26T02:00:00Z' }), {}));
    await screen.findByRole('heading', { level: 2, name: '모의면접 결과' });
    expect(await a11yViolations()).toEqual([]);
  });
});
