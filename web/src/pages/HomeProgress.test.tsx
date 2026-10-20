// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const categories = [
  {
    slug: 'spring', name: '스프링',
    topics: [
      { slug: 'transaction', name: '트랜잭션', description: '전파·격리', baseVersion: null, counts: { basic: 3, deep: 1, tricky: 1 } },
      { slug: 'aop-proxy', name: 'AOP', description: '프록시', baseVersion: null, counts: { basic: 2, deep: 0, tricky: 0 } },
    ],
  },
];
const SUMMARY = '/interview/api/v1/progress/summary';
const summaryData = { total: 7, learned: 3, topics: [{ topicSlug: 'transaction', total: 5, learned: 2 }, { topicSlug: 'aop-proxy', total: 2, learned: 1 }] };

describe('홈: 진도', () => {
  it('로그인하면 주제 카드마다 n/m 과 막대가 나온다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/categories': categories, [SUMMARY]: summaryData });
    renderApp('/');
    const bar = await screen.findByRole('progressbar', { name: '트랜잭션 학습 진도' });
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('5');
    expect(bar.getAttribute('aria-valuetext')).toBe('5개 중 2개 학습함');
    expect(screen.getByText('2/5')).toBeTruthy();
    expect(screen.getByRole('progressbar', { name: 'AOP 학습 진도' }).getAttribute('aria-valuenow')).toBe('1');
    expect(screen.queryByText(/로그인하면 완전히 학습한 질문/)).toBeNull();
  });

  it('비로그인에는 막대 없이 소개와 로그인 링크만 있다(오류처럼 보이지 않는다)', async () => {
    const { calls } = mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/');
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    expect(screen.queryByRole('progressbar')).toBeNull();
    // 처음 온 사람에게는 소개와 두 시작 버튼이 있고, 오류처럼 보이지 않는다
    expect(screen.getByRole('heading', { level: 1, name: /공식 문서로 정리했습니다/ })).toBeTruthy();
    expect(screen.getByRole('link', { name: '질문 둘러보기' }).getAttribute('href')).toBe('/explore');
    expect(screen.getByRole('link', { name: '로그인하고 시작' }).getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2F');
    expect(screen.queryByRole('alert')).toBeNull();
    expect(calls.some((c) => c.includes('/progress/'))).toBe(false);
  });

  it('진도 요약을 못 받아도 사전은 그대로 보이고 오류 알림이 없다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/categories': categories, [SUMMARY]: respond(() => errorResponse(500, 'X', 'x')) });
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /트랜잭션/ })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('progressbar')).toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('로그인·비로그인 모두 axe 위반이 없다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/categories': categories, [SUMMARY]: summaryData });
    renderApp('/');
    await screen.findByRole('progressbar', { name: '트랜잭션 학습 진도' });
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/');
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('헤더: 세션', () => {
  it('비로그인에는 로그인 링크, 로그인하면 로그아웃 버튼', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories });
    renderApp('/');
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    const links = screen.getAllByRole('link', { name: '로그인' }); // 헤더와 홈 소개에 하나씩
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2F');
    }
    expect(screen.queryByRole('button', { name: '로그아웃' })).toBeNull();
  });

  it('세션 오류에서는 다시 시도하면 로그인 상태가 반영된다', async () => {
    let n = 0;
    mockApi({
      [SESSION_URL]: respond(() => (n++ === 0 ? errorResponse(503, 'AUTH-503-02', 'x') : new Response(JSON.stringify({ success: true, data: authed() }), { status: 200 }))),
      '/interview/api/v1/categories': categories,
      [SUMMARY]: summaryData,
    });
    renderApp('/');
    fireEvent.click(await screen.findByRole('button', { name: '다시 시도' }));
    expect(await screen.findByRole('button', { name: '로그아웃' })).toBeTruthy();
  });
});
