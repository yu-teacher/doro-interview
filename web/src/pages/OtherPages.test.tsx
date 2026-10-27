// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import type { CategoryView, SearchResult } from '../api/types';
import { a11yViolations } from '../testing/axe';
import { summary } from '../testing/fixtures';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function go(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

const categories: CategoryView[] = [
  {
    slug: 'spring', name: '스프링',
    topics: [
      { slug: 'transaction', name: '트랜잭션', description: '전파·격리·롤백', baseVersion: 'Spring Framework 7 / Boot 4', counts: { basic: 8, deep: 11, tricky: 6 } },
      { slug: 'jpa', name: 'JPA', description: '영속성 컨텍스트', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } },
    ],
  },
];

describe('홈', () => {
  it('주제 카드에 이름과 질문 수가 있다', async () => {
    mockApi({ '/interview/api/v1/categories': categories });
    go('/');
    const card = (await screen.findByRole('link', { name: /트랜잭션/ })) as HTMLAnchorElement;
    expect(card.getAttribute('href')).toBe('/t/transaction');
    // 홈의 주제 카드는 가볍게: 이름·질문 수·한 줄 설명만(난이도 분포와 기준 버전은 주제 화면에서 본다)
    expect(card.textContent).toContain('질문 25개');
    expect(card.textContent).not.toContain('기준 버전');
    expect(screen.getByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
    await waitFor(() => expect(document.title).toBe('도로 면접'));
  });

  it('공개 주제가 없으면 오류가 아니라 안내다', async () => {
    mockApi({ '/interview/api/v1/categories': [] });
    go('/');
    expect(await screen.findByRole('heading', { name: '검수 중인 주제입니다' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(await a11yViolations()).toEqual([]);
  });

  it('접근성 구조 위반이 없다', async () => {
    mockApi({ '/interview/api/v1/categories': categories });
    go('/');
    await screen.findByRole('link', { name: /트랜잭션/ });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('개념', () => {
  const concepts = [
    { slug: 'proxy', name: '프록시', description: '호출을 가로채는 대리 객체', questionCount: 3 },
    { slug: 'jpa-ctx', name: '영속성 컨텍스트', description: '', questionCount: 1 },
  ];

  it('목록은 이름·설명·질문 수를 보여 준다', async () => {
    mockApi({ '/interview/api/v1/concepts': concepts });
    go('/concepts');
    const card = (await screen.findByRole('link', { name: /프록시/ })) as HTMLAnchorElement;
    expect(card.getAttribute('href')).toBe('/c/proxy');
    expect(card.textContent).toContain('호출을 가로채는 대리 객체');
    expect(card.textContent).toContain('질문 3개');
    await waitFor(() => expect(document.title).toBe('개념 · 도로 면접'));
    expect(await a11yViolations()).toEqual([]);
  });

  it('개념이 없으면 안내한다', async () => {
    mockApi({ '/interview/api/v1/concepts': [] });
    go('/concepts');
    expect(await screen.findByText('아직 공개된 개념이 없습니다.')).toBeTruthy();
  });

  it('개념 상세는 그 개념의 질문을 보여 준다', async () => {
    mockApi({
      '/interview/api/v1/concepts/proxy': {
        concept: concepts[0],
        questions: [summary('tx-04', { title: '동작 원리', concepts: ['proxy'] }), summary('aop-02', { title: 'JDK vs CGLIB', topicSlug: 'aop-proxy' })],
      },
    });
    go('/c/proxy');
    expect(await screen.findByRole('heading', { level: 1, name: '프록시' })).toBeTruthy();
    expect(screen.getByText('질문 2개')).toBeTruthy();
    expect(screen.getByRole('link', { name: /동작 원리/ }).getAttribute('href')).toBe('/q/tx-04');
    await waitFor(() => expect(document.title).toBe('프록시 · 도로 면접'));
    expect(await a11yViolations()).toEqual([]);
  });

  it('없는 개념은 찾을 수 없음이다', async () => {
    mockApi({});
    go('/c/none');
    expect((await screen.findByRole('alert')).textContent).toContain('찾을 수 없는 개념입니다.');
  });
});

describe('검색', () => {
  const result: SearchResult = {
    words: ['전파'], total: 3,
    hits: [
      { question: summary('tx-07', { title: '전파 속성이란?', importance: 3 }), topicName: '트랜잭션', score: 5, matchedIn: ['title', 'keywords'] },
      { question: summary('tx-08', { title: 'REQUIRES_NEW', hasExtra: true }), topicName: '트랜잭션', score: 1, matchedIn: ['body'] },
    ],
  };

  it('결과에 주제 이름과 일치 위치, 필수도를 보여 준다', async () => {
    mockApi({ '/interview/api/v1/search': result });
    go('/search?q=전파');
    expect(await screen.findByRole('heading', { level: 1, name: /전파.*검색 결과 3건/ })).toBeTruthy();
    const first = screen.getByRole('link', { name: /전파 속성이란\?/ });
    expect(first.textContent).toContain('트랜잭션');
    expect(first.textContent).toContain('일치: 제목, 키워드');
    expect(first.textContent).toContain('꼭 나와요');
    expect(screen.getByRole('link', { name: /REQUIRES_NEW/ }).textContent).toContain('일치: 본문');
    await waitFor(() => expect(document.title).toBe('‘전파’ 검색 · 도로 면접'));
  });

  it('전체 건수가 보여 준 건수보다 크면 일부만 보여 준다고 알린다', async () => {
    mockApi({ '/interview/api/v1/search': result });
    go('/search?q=전파');
    expect(await screen.findByText(/가장 잘 맞는 2건만 보여 줍니다/)).toBeTruthy();
  });

  it('전부 보여 주면 안내가 없다', async () => {
    mockApi({ '/interview/api/v1/search': { ...result, total: 2 } });
    go('/search?q=전파');
    await screen.findByRole('heading', { level: 1 });
    expect(screen.queryByText(/가장 잘 맞는/)).toBeNull();
  });

  it('결과가 없으면 안내한다', async () => {
    mockApi({ '/interview/api/v1/search': { words: ['x'], total: 0, hits: [] } });
    go('/search?q=xyz');
    expect(await screen.findByRole('heading', { level: 1, name: '검색 결과 없음' })).toBeTruthy();
    expect(screen.getByText(/에 해당하는 질문이 없습니다/)).toBeTruthy();
  });

  it('잘못된 검색어(400)는 메시지만 보여 주고 다시 시도 버튼이 없다', async () => {
    mockApi({ '/interview/api/v1/search': respond(() => errorResponse(400, 'SEARCH-400-01', '검색 단어는 5개 이하여야 합니다.')) });
    go('/search?q=a b c d e f');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('검색 단어는 5개 이하여야 합니다.');
    expect(within(alert).queryByRole('button')).toBeNull();
  });

  it('접근성 구조 위반이 없다', async () => {
    mockApi({ '/interview/api/v1/search': result });
    go('/search?q=전파');
    await screen.findByRole('heading', { level: 1 });
    expect(await a11yViolations()).toEqual([]);
  });
});
