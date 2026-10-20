// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authed, detail, SESSION_URL, summary, topicView } from '../testing/fixtures';
import { mockApi, okResponse } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const REVIEW = '/interview/api/v1/review-candidates';
const candidate = { slug: 'tx-01', title: '질문 tx-01', tier: 'BASIC', topicSlug: 'transaction', topicName: '트랜잭션' };

describe('다시 공부 후보 표시', () => {
  it('주제 목록에서 체크한 질문이 후보면 배지가 붙고, 체크 안 한 질문에는 붙지 않는다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/topics/transaction': topicView([
        summary('tx-01', { learned: true, reviewCandidate: true }),
        summary('tx-02', { learned: false, reviewCandidate: true }),
        summary('tx-03', { learned: true }),
      ]),
      '/interview/api/v1/concepts': [],
    });
    renderApp('/t/transaction');
    await screen.findByRole('heading', { level: 1, name: '트랜잭션' });
    expect(screen.getAllByText('다시 공부 후보')).toHaveLength(1);
  });

  it('체크를 해제하면 배지가 사라진다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/topics/transaction': topicView([summary('tx-01', { learned: true, reviewCandidate: true })]),
      '/interview/api/v1/concepts': [],
      'PUT /interview/api/v1/progress/tx-01': okResponse({ slug: 'tx-01', learned: false }),
    });
    renderApp('/t/transaction');
    await screen.findByText('다시 공부 후보');
    fireEvent.click(screen.getByRole('checkbox', { name: /: 질문 tx-01$/ }));
    await waitFor(() => expect(screen.queryByText('다시 공부 후보')).toBeNull());
  });

  it('질문 화면에서 후보면 안내 문구가 나온다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/questions/tx-04': detail({ learned: true, reviewCandidate: true }) });
    renderApp('/q/tx-04');
    expect(await screen.findByText(/최근 시험에서 이 질문을 틀렸습니다/)).toBeTruthy();
  });

  it('질문 화면에서 후보가 아니면 안내가 없다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/questions/tx-04': detail({ learned: true }) });
    renderApp('/q/tx-04');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/최근 시험에서 이 질문을 틀렸습니다/)).toBeNull();
  });

  it('홈에는 후보를 3개까지만 보이고 전체 보기 링크를 준다', async () => {
    const many = Array.from({ length: 7 }, (_, i) => ({ ...candidate, slug: `tx-${i}`, title: `후보 ${i}` }));
    mockApi({
      [SESSION_URL]: authed(), [REVIEW]: many, '/interview/api/v1/categories': [{ slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] }],
      '/interview/api/v1/progress/summary': { total: 0, learned: 0, topics: [] },
    });
    renderApp('/');
    expect(await screen.findByRole('heading', { name: '다시 공부 후보 (7)' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^체크 해제/ })).toHaveLength(3);
    expect(screen.getByRole('link', { name: '전체 7개 보기' })).toBeTruthy();
  });
});
