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

const categories = [
  { slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '전파·격리', baseVersion: null, counts: { basic: 3, deep: 1, tricky: 1 } }] },
  { slug: 'java', name: '자바', topics: [{ slug: 'java-lang', name: '자바 언어 기본', description: '', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] },
];

describe('탐색 화면', () => {
  it('카테고리별 주제 목록과 개념·훑기 링크를 보인다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/explore');
    expect(await screen.findByRole('heading', { level: 2, name: '스프링' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /트랜잭션/ }).getAttribute('href')).toBe('/t/transaction');
    expect(screen.getByRole('link', { name: '개념으로 찾기' }).getAttribute('href')).toBe('/concepts');
    expect(screen.getByRole('link', { name: '주제별 훑기' }).getAttribute('href')).toBe('/skim');
  });

  it('로그인하면 주제마다 진도 막대가 붙고, 비로그인에는 진도를 요청하지 않는다', async () => {
    const api = mockApi({
      [SESSION_URL]: authed(), '/interview/api/v1/categories': categories,
      '/interview/api/v1/progress/summary': { total: 6, learned: 2, topics: [{ topicSlug: 'transaction', total: 5, learned: 2 }] },
    });
    renderApp('/explore');
    expect((await screen.findByRole('progressbar', { name: '트랜잭션 학습 진도' })).getAttribute('aria-valuenow')).toBe('2');
    cleanup();
    const anon = mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/explore');
    await screen.findByRole('heading', { level: 2, name: '스프링' });
    expect(anon.calls.some((c) => c.includes('/progress/'))).toBe(false);
    expect(api.calls.length).toBeGreaterThan(0);
  });

  it('폰에서 쓰는 검색 입력이 있고 제출하면 검색 결과로 간다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, '/interview/api/v1/search': { words: ['프록시'], total: 0, hits: [] } });
    renderApp('/explore');
    await screen.findByRole('heading', { level: 2, name: '스프링' });
    const input = document.getElementById('explore-search') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '프록시' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(await screen.findByRole('heading', { level: 1, name: '검색 결과 없음' })).toBeTruthy();
  });

  it('axe 위반이 없다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/explore');
    await screen.findByRole('heading', { level: 2, name: '스프링' });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('내 공부 화면', () => {
  it('비로그인이면 로그인 안내와 훑기만 보이고, 개인 화면 링크는 없다', async () => {
    mockApi({ [SESSION_URL]: anonymous() });
    renderApp('/me');
    expect(await screen.findByText(/로그인하면 학습 체크, 진도, 시험 기록, 내 질문을 쓸 수 있습니다/)).toBeTruthy();
    const main = within(screen.getByRole('main'));
    expect(main.getByRole('link', { name: '로그인' }).getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2Fme');
    expect(main.getByRole('link', { name: /주제별 훑기/ })).toBeTruthy();
    expect(main.queryByRole('link', { name: /내 질문/ })).toBeNull();
    expect(main.queryByRole('link', { name: /내 현황/ })).toBeNull();
    expect(main.queryByRole('button', { name: '로그아웃' })).toBeNull();
  });

  it('로그인하면 내 질문·현황·훑기 링크와 로그아웃이 있다', async () => {
    const api = mockApi({ [SESSION_URL]: authed(), 'POST /interview/api/v1/bff/logout': okResponse(null) });
    renderApp('/me');
    const main = within(screen.getByRole('main'));
    expect((await main.findByRole('link', { name: /내 질문/ })).getAttribute('href')).toBe('/mine');
    expect(main.getByRole('link', { name: /내 현황/ }).getAttribute('href')).toBe('/stats');
    fireEvent.click(main.getByRole('button', { name: '로그아웃' }));
    await waitFor(() => expect(api.requests.some((r) => r.method === 'POST' && r.path.endsWith('/bff/logout'))).toBe(true));
  });

  it('화면 색을 고르면 문서에 반영하고 기억한다(비로그인도)', async () => {
    window.localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    mockApi({ [SESSION_URL]: anonymous() });
    renderApp('/me');
    const group = within(await screen.findByRole('group', { name: '화면 색' }));
    expect(group.getByRole('button', { name: '시스템 설정' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(group.getByRole('button', { name: '어둡게' }));
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(window.localStorage.getItem('interview.theme')).toBe('dark');
    expect(group.getByRole('button', { name: '어둡게' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(group.getByRole('button', { name: '시스템 설정' }));
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('세션 확인이 실패하면 추측하지 않고 다시 시도를 안내한다', async () => {
    mockApi({ [SESSION_URL]: respond(() => errorResponse(503, 'AUTH-503-02', 'x')) });
    renderApp('/me');
    const main = within(screen.getByRole('main'));
    expect(await main.findByText('로그인 상태를 확인하지 못했습니다.')).toBeTruthy();
    expect(main.getByRole('button', { name: '다시 시도' })).toBeTruthy();
  });

  it('axe 위반이 없다', async () => {
    mockApi({ [SESSION_URL]: authed() });
    renderApp('/me');
    await within(screen.getByRole('main')).findByRole('link', { name: /내 질문/ });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('검색 화면(폰의 입구)', () => {
  it('검색어가 없으면 입력창을 보여 준다', async () => {
    mockApi({ [SESSION_URL]: anonymous() });
    renderApp('/search');
    expect(await screen.findByRole('heading', { level: 1, name: '검색' })).toBeTruthy();
    expect(document.getElementById('search-page-input')).toBeTruthy();
  });
});
