// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { MineQuestion } from '../api/types';
import { authed, quizItem, quizSession, SESSION_URL } from '../testing/fixtures';
import { mockApi, okResponse } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const SID = '33333333-3333-4333-8333-333333333333';
const MID = '44444444-4444-4444-8444-444444444444';
const MSLUG = `my-${MID}`;

const mineQ = (over: Partial<MineQuestion> = {}): MineQuestion => ({
  id: MID, slug: MSLUG, title: '강사님 질문', answerText: '내가 적은 답 <b>굵게</b>\n둘째 줄', keywords: ['프록시'], tier: 'DEEP', sourceLabel: '강사 추천',
  createdAt: '2026-10-20T00:00:00Z', updatedAt: '2026-10-20T00:00:00Z', learned: true, reviewCandidate: false, ...over,
});

const mineItem = (over = {}) => quizItem(1, { questionSlug: MSLUG, title: '강사님 질문', tier: 'DEEP', topicSlug: '@mine', topicName: '내 질문', ...over });

describe('시험: 내 질문 문항', () => {
  it('답 공개 전에는 아무것도 받지 않고, 공개하면 /mine/{id} 로 내가 적은 답을 받아 일반 텍스트로 보여 준다', async () => {
    const { calls } = mockApi({
      [SESSION_URL]: authed(),
      [`/interview/api/v1/quiz/${SID}`]: quizSession([mineItem()], { sessionId: SID }),
      [`/interview/api/v1/mine/${MID}`]: mineQ(),
    });
    renderApp(`/quiz/${SID}`);
    expect(await screen.findByRole('heading', { level: 2, name: '강사님 질문' })).toBeTruthy();
    expect(within(screen.getByRole('main')).getByText('내 질문')).toBeTruthy();
    expect(calls.some((c) => c.includes('/mine/') || c.includes('/questions/'))).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: '모범 답변 보기' }));
    const answer = await screen.findByTestId('mine-answer');
    expect(answer.textContent).toBe('내가 적은 답 <b>굵게</b>\n둘째 줄');
    expect(answer.querySelector('b')).toBeNull();
    expect(calls.some((c) => c.includes('/questions/'))).toBe(false); // 공용 질문 API 는 부르지 않는다
    expect(screen.getByRole('button', { name: '맞음' })).toBeTruthy();
    const link = screen.getByRole('link', { name: /내 질문에서 자세히 보기/ });
    expect(link.getAttribute('href')).toBe(`/mine/${MID}`);
  });

  it('적어 둔 답이 없으면 그렇다고 알려 준다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      [`/interview/api/v1/quiz/${SID}`]: quizSession([mineItem()], { sessionId: SID }),
      [`/interview/api/v1/mine/${MID}`]: mineQ({ answerText: '', keywords: [] }),
    });
    renderApp(`/quiz/${SID}`);
    fireEvent.click(await screen.findByRole('button', { name: '모범 답변 보기' }));
    expect(await screen.findByText('적어 둔 답이 없습니다.')).toBeTruthy();
  });

  it('결과 화면의 틀린 내 질문은 내 질문 화면으로 연결한다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      [`/interview/api/v1/quiz/${SID}`]: quizSession([mineItem({ result: 'WRONG' }), quizItem(2, { result: 'WRONG', title: '공용 질문', questionSlug: 'tx-02' })], { sessionId: SID, finishedAt: '2026-10-20T01:00:00Z' }),
    });
    renderApp(`/quiz/${SID}`);
    expect(await screen.findByRole('heading', { name: '시험 결과' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '내 질문에서 보기' }).getAttribute('href')).toBe(`/mine/${MID}`);
    expect(screen.getByRole('link', { name: '사전에서 보기' }).getAttribute('href')).toBe('/q/tx-02');
  });
});

describe('시험 시작: 내 질문 범위', () => {
  it('"내 질문" 을 고르면 가짜 주제 @mine 으로 시작을 보낸다', async () => {
    const id = '55555555-5555-4555-8555-555555555555';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    const { requests } = mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/categories': [{ slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] }],
      '/interview/api/v1/me/prefs': { includeUnlearnedDefault: false },
      [`PUT /interview/api/v1/quiz/${id}`]: okResponse(quizSession([mineItem()], { sessionId: id })),
      [`/interview/api/v1/quiz/${id}`]: quizSession([mineItem()], { sessionId: id }),
    });
    renderApp('/quiz');
    fireEvent.click(await screen.findByRole('checkbox', { name: '내 질문' }));
    fireEvent.click(screen.getByRole('button', { name: '시험 시작' }));
    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.path.endsWith(`/quiz/${id}`))).toBe(true));
    const put = requests.find((r) => r.method === 'PUT' && r.path.endsWith(`/quiz/${id}`)) as unknown as { body: { topics: string[] } };
    expect(put.body.topics).toEqual(['@mine']);
  });
});

describe('후보·현황의 내 질문 링크', () => {
  it('다시 공부 후보와 자주 틀린 질문의 내 질문은 내 질문 화면으로 간다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/review-candidates': [{ slug: MSLUG, title: '강사님 질문', tier: 'DEEP', topicSlug: '@mine', topicName: '내 질문' }],
      '/interview/api/v1/me/stats': {
        askedLast30Days: 1, correctLast30Days: 0, wrongLast30Days: 1, skippedLast30Days: 0, sessionsLast30Days: 1,
        mostMissed: [{ questionSlug: MSLUG, title: '강사님 질문', tier: 'DEEP', topicSlug: '@mine', topicName: '내 질문', missCount: 1, askCount: 1 }],
      },
      '/interview/api/v1/me/prefs': { includeUnlearnedDefault: false },
      '/interview/api/v1/categories': [],
      '/interview/api/v1/progress/summary': { total: 0, learned: 0, topics: [] },
    });
    renderApp('/stats');
    const missed = await screen.findByRole('region', { name: '자주 틀린 질문' });
    expect(within(missed).getByRole('link', { name: '강사님 질문' }).getAttribute('href')).toBe(`/mine/${MID}`);
    // 후보는 통계와 따로 받아 조금 늦게 나올 수 있다
    const candidates = (await screen.findByRole('heading', { name: /다시 공부 후보/ })).closest('section') as HTMLElement;
    expect(within(candidates).getByRole('link', { name: '강사님 질문' }).getAttribute('href')).toBe(`/mine/${MID}`);
  });
});
