// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { a11yViolations } from '../testing/axe';
import { summary, topicView } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const questions = [
  summary('tx-01', { title: '프록시란?', tier: 'BASIC', importance: 3, concepts: ['proxy'], keywords: ['CGLIB'] }),
  summary('tx-02', { title: '전파 속성', tier: 'BASIC', importance: 2, hasExtra: true, concepts: ['tx-boundary', 'proxy'] }),
  summary('tx-03', { title: 'REQUIRES_NEW 동작', tier: 'DEEP', importance: 1, concepts: ['tx-boundary'] }),
  summary('tx-04', { title: '미분류 질문', tier: 'DEEP', importance: null, hasExtra: true }),
  summary('tx-05', { title: '함정 질문', tier: 'TRICKY', importance: 3 }),
];

const routes = {
  '/interview/api/v1/topics/transaction': topicView(questions),
  '/interview/api/v1/concepts': [
    { slug: 'proxy', name: '프록시', description: '', questionCount: 2 },
    { slug: 'tx-boundary', name: '트랜잭션 경계', description: '', questionCount: 2 },
  ],
};

function Where() {
  const l = useLocation();
  // <output> 은 암묵적으로 status 역할이라 화면의 개수 안내와 섞이므로 span 을 쓴다
  return <span hidden data-testid="where">{l.pathname + l.search}</span>;
}

function open(path = '/t/transaction') {
  mockApi(routes);
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
      <Where />
    </MemoryRouter>,
  );
}

const cardCount = () => document.querySelectorAll('main ul li a[href*="/q/"]').length;

describe('주제 화면', () => {
  it('질문을 서버 순서대로 보여 주고 개수를 알린다', async () => {
    open();
    expect(await screen.findByRole('heading', { name: '트랜잭션' })).toBeTruthy();
    expect(cardCount()).toBe(5);
    expect(screen.getByRole('status').textContent).toBe('질문 5개');
    expect(screen.getByText(/기준 버전: Spring Framework 7/)).toBeTruthy();
  });

  it('tier 버튼은 누르면 걸러지고 aria-pressed 로 상태를 알리며 개수를 보여 준다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    expect(screen.getByRole('button', { name: '전체 (5)' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: '심화 (2)' }));
    expect(cardCount()).toBe(2);
    expect(screen.getByRole('button', { name: '심화 (2)' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: '전체 (5)' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('status').textContent).toBe('질문 2개 (전체 5개 중)');
    expect(screen.getByTestId('where').textContent).toBe('/t/transaction?tier=DEEP');
  });

  it('필수도 선택: 필수만 / 자주 이상 / 미분류', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    const select = screen.getByRole('combobox', { name: '필수도' });
    fireEvent.change(select, { target: { value: '3' } });
    expect(cardCount()).toBe(2);
    fireEvent.change(select, { target: { value: 'ge2' } });
    expect(cardCount()).toBe(3);
    fireEvent.change(select, { target: { value: 'none' } });
    expect(cardCount()).toBe(1);
    expect(screen.getByText('미분류 질문')).toBeTruthy();
  });

  it('보충이 있는 질문만 보기', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    fireEvent.click(screen.getByRole('checkbox', { name: '보충이 있는 질문만' }));
    expect(cardCount()).toBe(2);
    expect(screen.getByTestId('where').textContent).toBe('/t/transaction?extra=1');
  });

  it('개념 버튼은 개념 이름으로 보이고 다시 누르면 해제된다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    const group = screen.getByRole('group', { name: '개념' });
    fireEvent.click(within(group).getByRole('button', { name: '트랜잭션 경계' }));
    expect(cardCount()).toBe(2);
    fireEvent.click(within(group).getByRole('button', { name: '트랜잭션 경계' }));
    expect(cardCount()).toBe(5);
  });

  it('주제 안 글 검색은 제목·키워드에서 찾는다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    const input = screen.getByRole('searchbox', { name: '이 주제에서 찾기' });
    fireEvent.change(input, { target: { value: 'cglib' } });
    expect(cardCount()).toBe(1);
    expect(screen.getByText('프록시란?')).toBeTruthy();
  });

  it('필터는 URL 에서 복원된다(공유·새로고침·뒤로 가기)', async () => {
    open('/t/transaction?tier=DEEP&imp=none');
    await screen.findByRole('heading', { name: '트랜잭션' });
    expect(cardCount()).toBe(1);
    expect(screen.queryByText('REQUIRES_NEW 동작')).toBeNull();
    expect(screen.getByText('미분류 질문')).toBeTruthy();
    expect((screen.getByRole('combobox', { name: '필수도' }) as HTMLSelectElement).value).toBe('none');
    expect(screen.getByRole('button', { name: /심화 \(1\)/ }).getAttribute('aria-pressed')).toBe('true');
  });

  it('맞는 질문이 없으면 안내하고 초기화 버튼으로 되돌린다', async () => {
    open('/t/transaction?tier=TRICKY&imp=none');
    await screen.findByRole('heading', { name: '트랜잭션' });
    expect(screen.getByText('조건에 맞는 질문이 없습니다.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(cardCount()).toBe(5);
    expect(screen.queryByRole('button', { name: '필터 초기화' })).toBeNull();
    expect(screen.getByTestId('where').textContent).toBe('/t/transaction');
  });

  it('개념 이름을 못 불러와도 slug 로 보여 주고 화면은 계속 쓸 수 있다', async () => {
    mockApi({ '/interview/api/v1/topics/transaction': topicView(questions) });
    render(
      <MemoryRouter initialEntries={['/t/transaction']}>
        <AppRoutes />
      </MemoryRouter>,
    );
    await screen.findByRole('heading', { name: '트랜잭션' });
    const group = await screen.findByRole('group', { name: '개념' });
    expect(within(group).getByRole('button', { name: 'tx-boundary' })).toBeTruthy();
    expect(cardCount()).toBe(5);
  });

  it('출처는 접혀 있다가 열면 링크가 보인다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    const details = screen.getByText(/이 주제의 출처 \(1\)/).closest('details') as HTMLDetailsElement;
    expect(details.open).toBe(false);
    expect(within(details).getByRole('link', { name: 'https://docs.spring.io/tx' }).getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('질문 카드에 tier·필수도·보충 표시가 글로 있다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    const card = screen.getByText('전파 속성').closest('a') as HTMLAnchorElement;
    expect(card.textContent).toContain('기본');
    expect(card.textContent).toContain('필수도 2 · 자주');
    expect(card.textContent).toContain('보충 있음');
    expect((screen.getByText('미분류 질문').closest('a') as HTMLAnchorElement).textContent).toContain('필수도 미분류');
  });

  it('문서 제목이 주제 이름이다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    expect(document.title).toBe('트랜잭션 · 도로 면접');
  });

  it('접근성 구조 위반이 없다', async () => {
    open();
    await screen.findByRole('heading', { name: '트랜잭션' });
    expect(await a11yViolations()).toEqual([]);
  });

});
