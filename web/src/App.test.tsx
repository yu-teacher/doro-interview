// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from './App';
import type { CategoryView, ConceptView, QuestionDetail, SearchResult, TopicView } from './api/types';
import { a11yViolations } from './testing/axe';
import { mockApi, respond } from './testing/mockFetch';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const categories: CategoryView[] = [
  { slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '전파·격리', baseVersion: 'v7', counts: { basic: 1, deep: 1, tricky: 0 } }] },
];

const topic: TopicView = {
  summary: categories[0].topics[0],
  categorySlug: 'spring',
  categoryName: '스프링',
  sources: [],
  questions: [
    { slug: 'tx-01', topicSlug: 'transaction', tier: 'BASIC', difficulty: 1, title: 'ACID 란?', keywords: [], hasExtra: false, importance: null, concepts: [] },
  ],
};

const question = {
  slug: 'tx-01', topicSlug: 'transaction', topicName: '트랜잭션', categorySlug: 'spring', tier: 'BASIC', difficulty: 1, title: 'ACID 란?',
  keywords: ['원자성'], hasExtra: false, spokenAnswer: '원자성, 일관성, 격리성, 지속성입니다.', detailMd: '', status: 'REVIEWED', reviewedAt: null,
  needsReview: false, baseVersion: 'v7', sources: [], refs: [], topicSources: [], prevSlug: null, nextSlug: null, importance: null, concepts: [],
  followups: [], prerequisites: [], related: [],
} satisfies QuestionDetail;

const concepts: ConceptView[] = [{ slug: 'proxy', name: '프록시', description: '', questionCount: 2 }];

function go(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('화면 경로', () => {
  it('홈은 카테고리와 주제를 보여 주고 주제로 이동한다', async () => {
    mockApi({ '/interview/api/v1/categories': categories, '/interview/api/v1/topics/transaction': topic });
    go('/');
    expect(await screen.findByRole('heading', { name: '스프링' })).toBeTruthy();
    fireEvent.click(screen.getByRole('link', { name: /트랜잭션/ }));
    expect(await screen.findByRole('heading', { name: '트랜잭션' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /ACID 란\?/ })).toBeTruthy();
  });

  it('공개 주제가 없으면 안내 문구를 보여 준다(오류가 아니다)', async () => {
    mockApi({ '/interview/api/v1/categories': [] });
    go('/');
    expect(await screen.findByText(/검수 중인 주제/)).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('질문 화면은 제목과 모범 답변을 보여 준다', async () => {
    mockApi({ '/interview/api/v1/questions/tx-01': question });
    go('/q/tx-01');
    expect(await screen.findByRole('heading', { name: 'ACID 란?' })).toBeTruthy();
    expect(screen.getByText(/원자성, 일관성/)).toBeTruthy();
  });

  it('없는 질문은 찾을 수 없음 안내를 보여 준다', async () => {
    mockApi({});
    go('/q/nope');
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('찾을 수 없는 질문입니다.');
  });

  it('알 수 없는 경로는 찾을 수 없음 화면이다', async () => {
    mockApi({});
    go('/whatever/else');
    expect((await screen.findByRole('alert')).textContent).toContain('찾을 수 없는 페이지');
  });

  it('오류·찾을 수 없음 화면에도 제목(h1)이 있고 접근성 구조 위반이 없다', async () => {
    mockApi({ '/interview/api/v1/categories': respond(() => new Response('<html>502</html>', { status: 502 })) });
    go('/');
    expect(await screen.findByRole('heading', { level: 1, name: '불러오지 못했습니다' })).toBeTruthy();
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    go('/q/nope');
    expect(await screen.findByRole('heading', { level: 1, name: '찾을 수 없는 질문입니다.' })).toBeTruthy();
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    go('/whatever');
    expect(await screen.findByRole('heading', { level: 1, name: '찾을 수 없는 페이지입니다.' })).toBeTruthy();
    expect(await a11yViolations()).toEqual([]);
  });

  it('개념 목록과 개념 상세', async () => {
    mockApi({
      '/interview/api/v1/concepts': concepts,
      '/interview/api/v1/concepts/proxy': { concept: concepts[0], questions: topic.questions },
    });
    go('/concepts');
    fireEvent.click(await screen.findByRole('link', { name: /프록시/ }));
    expect(await screen.findByRole('heading', { name: '프록시' })).toBeTruthy();
  });

  it('검색은 결과를 보여 주고 0건이면 안내한다', async () => {
    const result: SearchResult = {
      words: ['전파'], total: 1,
      hits: [{ question: topic.questions[0], topicName: '트랜잭션', score: 3, matchedIn: ['title'] }],
    };
    const api = mockApi({ '/interview/api/v1/search': respond((url) => new Response(JSON.stringify({ success: true, data: url.searchParams.get('q') === '전파' ? result : { words: ['없음'], total: 0, hits: [] } }), { status: 200 })) });
    go('/search?q=전파');
    expect(await screen.findByRole('heading', { name: /검색 결과 1건/ })).toBeTruthy();
    expect(api.calls[0]).toBe('/interview/api/v1/search?q=%EC%A0%84%ED%8C%8C');
    cleanup();
    go('/search?q=없음');
    expect(await screen.findByText(/해당하는 질문이 없습니다/)).toBeTruthy();
  });

  it('검색어가 비어 있으면 요청하지 않고 안내한다', async () => {
    const api = mockApi({});
    go('/search');
    expect(await screen.findByText('검색어를 입력해 주세요.')).toBeTruthy();
    expect(api.calls).toEqual([]);
  });

  it('헤더의 검색 폼은 검색 화면으로 이동한다(빈 입력은 이동하지 않는다)', async () => {
    mockApi({ '/interview/api/v1/categories': [], '/interview/api/v1/search': { words: ['프록시'], total: 0, hits: [] } });
    go('/');
    const input = screen.getByRole('searchbox', { name: '질문 검색' });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(screen.queryByText(/해당하는 질문이 없습니다/)).toBeNull();
    fireEvent.change(input, { target: { value: '  프록시  ' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await waitFor(() => expect(screen.getByText(/해당하는 질문이 없습니다/)).toBeTruthy());
  });

  it('서버 오류는 다시 시도할 수 있다', async () => {
    let n = 0;
    mockApi({
      '/interview/api/v1/categories': respond(() => {
        n += 1;
        return n === 1 ? new Response('<html>502</html>', { status: 502 }) : new Response(JSON.stringify({ success: true, data: categories }), { status: 200 });
      }),
    });
    go('/');
    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('heading', { name: '스프링' })).toBeTruthy();
  });
});
