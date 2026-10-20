// @vitest-environment jsdom
import { cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { anonymous, authed, summary, SESSION_URL } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const hit = (slug: string, learned?: boolean) => ({
  question: summary(slug, { title: `질문 ${slug}`, ...(learned === undefined ? {} : { learned }) }), topicName: '트랜잭션', score: 5, matchedIn: ['title'],
});

describe('검색·개념 결과의 학습 표시(읽기 전용)', () => {
  it('로그인하면 체크한 질문에만 "✓ 학습함" 이 붙고 체크박스는 없다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/search': { words: ['전파'], total: 2, hits: [hit('tx-01', true), hit('tx-02', false)] },
    });
    renderApp('/search?q=전파');
    await screen.findByText('질문 tx-01');
    expect(screen.getAllByText('✓ 학습함')).toHaveLength(1);
    expect(screen.queryAllByRole('checkbox').filter((c) => c.closest('li'))).toHaveLength(0);
  });

  it('개념 화면도 같다', async () => {
    mockApi({
      [SESSION_URL]: authed(),
      '/interview/api/v1/concepts/proxy': {
        concept: { slug: 'proxy', name: '프록시', description: '', questionCount: 2 },
        questions: [summary('tx-01', { title: '질문 tx-01', learned: true }), summary('tx-02', { title: '질문 tx-02', learned: false })],
      },
    });
    renderApp('/c/proxy');
    await screen.findByText('질문 tx-01');
    expect(screen.getAllByText('✓ 학습함')).toHaveLength(1);
  });

  it('비로그인 응답에는 표시가 없다', async () => {
    mockApi({
      [SESSION_URL]: anonymous(),
      '/interview/api/v1/search': { words: ['전파'], total: 1, hits: [hit('tx-01')] },
    });
    renderApp('/search?q=전파');
    await screen.findByText('질문 tx-01');
    expect(screen.queryByText('✓ 학습함')).toBeNull();
  });
});
