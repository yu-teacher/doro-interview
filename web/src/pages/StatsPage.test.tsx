// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const STATS = '/interview/api/v1/me/stats';
const PREFS = '/interview/api/v1/me/prefs';
const REVIEW = '/interview/api/v1/review-candidates';
const CATEGORIES = '/interview/api/v1/categories';
const SUMMARY = '/interview/api/v1/progress/summary';
const categories = [
  { slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '', baseVersion: null, counts: { basic: 3, deep: 1, tricky: 1 } }] },
];
const stats = {
  askedLast30Days: 12, correctLast30Days: 6, wrongLast30Days: 3, skippedLast30Days: 3, sessionsLast30Days: 2,
  mostMissed: [{ questionSlug: 'tx-04', title: '@Transactional 동작', tier: 'BASIC', topicSlug: 'transaction', topicName: '트랜잭션', missCount: 3, askCount: 4 }],
};
const candidate = { slug: 'tx-04', title: '@Transactional 동작', tier: 'BASIC', topicSlug: 'transaction', topicName: '트랜잭션' };

const open = (routes: Record<string, unknown> = {}, session: unknown = authed()) => {
  const api = mockApi({
    [SESSION_URL]: session, [STATS]: stats, [PREFS]: { includeUnlearnedDefault: false }, [REVIEW]: [candidate],
    [CATEGORIES]: categories, [SUMMARY]: { total: 5, learned: 2, topics: [{ topicSlug: 'transaction', total: 5, learned: 2 }] }, ...routes,
  });
  renderApp('/stats');
  return api;
};

describe('내 현황 화면', () => {
  it('비로그인이면 로그인 안내만 보이고 개인 API 를 부르지 않는다', async () => {
    const { calls } = open({}, anonymous());
    expect(await screen.findByText(/로그인한 뒤에 볼 수 있습니다/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: '로그인' }).some((a) => a.getAttribute('href') === '/interview/api/v1/bff/login?return=%2Fstats')).toBe(true);
    expect(calls.some((c) => c.includes('/me/') || c.includes('review-candidates'))).toBe(false);
  });

  it('30일 통계와 정답률, 자주 틀린 질문을 보여 준다', async () => {
    open();
    expect(await screen.findByText('2회')).toBeTruthy();
    expect(screen.getByText('9문제')).toBeTruthy(); // 정답 6 + 오답 3
    expect(screen.getByText('67%')).toBeTruthy(); // 6/9, 건너뜀은 분모에서 뺀다
    const missed = screen.getByRole('region', { name: '자주 틀린 질문' });
    expect(within(missed).getByRole('link', { name: '@Transactional 동작' })).toBeTruthy();
    expect(within(missed).getByText(/4번 중 3번 틀림/)).toBeTruthy();
  });

  it('시험을 본 적 없으면 안내와 시작 링크를 보인다', async () => {
    open({ [STATS]: { ...stats, sessionsLast30Days: 0, askedLast30Days: 0, correctLast30Days: 0, wrongLast30Days: 0, skippedLast30Days: 0, mostMissed: [] } });
    expect(await screen.findByText(/아직 본 시험이 없습니다/)).toBeTruthy();
    expect(screen.getByRole('link', { name: '시험 보러 가기' }).getAttribute('href')).toBe('/quiz');
  });

  it('채점한 문제가 없으면 정답률은 대시로 보인다', async () => {
    open({ [STATS]: { ...stats, correctLast30Days: 0, wrongLast30Days: 0, skippedLast30Days: 4, mostMissed: [] } });
    expect(await screen.findByText('—')).toBeTruthy();
  });

  it('다시 공부 후보에서 체크 해제를 누르면 PUT 하고 목록에서 사라진다', async () => {
    const { requests } = open({ 'PUT /interview/api/v1/progress/tx-04': okResponse({ slug: 'tx-04', learned: false }) });
    fireEvent.click(await screen.findByRole('button', { name: '체크 해제: @Transactional 동작' }));
    await waitFor(() => expect(screen.queryByRole('button', { name: /체크 해제/ })).toBeNull());
    const put = requests.find((r) => r.method === 'PUT' && r.path.endsWith('/progress/tx-04')) as unknown as { body: unknown };
    expect(put.body).toEqual({ learned: false });
  });

  it('해제가 실패하면 목록을 그대로 두고 알린다', async () => {
    open({ 'PUT /interview/api/v1/progress/tx-04': respond(() => errorResponse(503, 'AUTH-503-02', 'x')) });
    fireEvent.click(await screen.findByRole('button', { name: '체크 해제: @Transactional 동작' }));
    expect(await screen.findByRole('status')).toBeTruthy();
    expect(screen.getByRole('button', { name: '체크 해제: @Transactional 동작' })).toBeTruthy();
  });

  it('후보가 없으면 후보 구역을 만들지 않는다', async () => {
    open({ [REVIEW]: [] });
    await screen.findByText('2회');
    expect(screen.queryByRole('region', { name: /다시 공부 후보/ })).toBeNull();
  });

  it('설정 체크박스는 저장하고, 실패하면 되돌린다', async () => {
    const { requests } = open({ 'PUT /interview/api/v1/me/prefs': okResponse({ includeUnlearnedDefault: true }) });
    const box = (await screen.findByRole('checkbox', { name: /체크하지 않은 질문도 기본으로 포함/ })) as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(requests.some((r) => r.method === 'PUT' && r.path.endsWith('/me/prefs'))).toBe(true));
    expect(box.checked).toBe(true);
  });

  it('설정 저장이 실패하면 체크가 원래대로 돌아온다', async () => {
    open({ 'PUT /interview/api/v1/me/prefs': respond(() => errorResponse(500, 'X', 'x')) });
    const box = (await screen.findByRole('checkbox', { name: /기본으로 포함/ })) as HTMLInputElement;
    fireEvent.click(box);
    await waitFor(() => expect(box.checked).toBe(false));
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('접근성 위반이 없다', async () => {
    open();
    await screen.findByText('2회');
    expect(await a11yViolations(document.body)).toEqual([]);
  });
});
