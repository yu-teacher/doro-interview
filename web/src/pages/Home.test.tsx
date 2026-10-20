// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

beforeEach(() => {
  try {
    window.localStorage.clear();
  } catch {
    // 저장소가 없는 환경
  }
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const FEATURED = '/interview/api/v1/questions/featured';
const SUMMARY = '/interview/api/v1/progress/summary';
const REVIEW = '/interview/api/v1/review-candidates';
const categories = [
  { slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '전파·격리·롤백', baseVersion: null, counts: { basic: 3, deep: 1, tricky: 1 } }] },
  { slug: 'java', name: '자바', topics: [{ slug: 'java-lang', name: '자바 언어 기본', description: '타입, String', baseVersion: null, counts: { basic: 2, deep: 0, tricky: 0 } }] },
];
const featured = [
  { slug: 'tx-04', title: '`@Transactional`은 어떻게 동작하나요?', tier: 'BASIC', topicSlug: 'transaction', topicName: '트랜잭션' },
  { slug: 'jl-01', title: '오토박싱이란?', tier: 'DEEP', topicSlug: 'java-lang', topicName: '자바 언어 기본' },
];

describe('홈: 처음 온 사람(비로그인)', () => {
  it('소개·두 시작 버튼·자주 나오는 질문을 보인다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, [FEATURED]: featured });
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 1, name: /공식 문서로 정리했습니다/ })).toBeTruthy();
    const list = within(await screen.findByRole('region', { name: '자주 나오는 질문' }));
    expect(list.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual(['/q/tx-04', '/q/jl-01']);
    // 제목의 백틱은 코드 서식으로 그린다
    expect(list.getAllByRole('link')[0].querySelector('code')?.textContent).toBe('@Transactional');
    expect(list.getAllByRole('link')[0].textContent).not.toContain('`');
  });

  it('자주 나오는 질문을 못 받아도 홈은 그대로다(구역만 없다)', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, [FEATURED]: respond(() => errorResponse(500, 'X', 'x')) });
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
    await waitFor(() => expect(screen.queryByRole('region', { name: '자주 나오는 질문' })).toBeNull());
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('link', { name: '질문 둘러보기' })).toBeTruthy();
  });

  it('로그인 전용 요청(진도·후보)을 보내지 않는다', async () => {
    const { calls } = mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, [FEATURED]: featured });
    renderApp('/');
    await screen.findByRole('heading', { level: 3, name: '스프링' });
    expect(calls.some((c) => c.includes('/progress/') || c.includes('review-candidates'))).toBe(false);
  });

  it('axe 위반이 없다', async () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, [FEATURED]: featured });
    renderApp('/');
    await screen.findByRole('region', { name: '자주 나오는 질문' });
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('홈: 오늘 할 일(로그인)', () => {
  const member = (summary: unknown, review: unknown = []) =>
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/categories': categories, [SUMMARY]: summary, [REVIEW]: review });

  it('체크한 질문 수와 시험 시작 버튼, 전체 진도, 현황 링크를 보인다', async () => {
    member({ total: 6, learned: 4, topics: [{ topicSlug: 'transaction', total: 5, learned: 3 }] });
    renderApp('/');
    const today = within(await screen.findByRole('region', { name: '오늘 할 일' }));
    expect(await today.findByText(/체크한 질문 4개 중에서 무작위로 묻습니다/)).toBeTruthy();
    expect(today.getByRole('link', { name: '랜덤 면접 시작' }).getAttribute('href')).toBe('/quiz');
    expect(today.getByRole('progressbar', { name: '전체 학습 진도' }).getAttribute('aria-valuenow')).toBe('4');
    expect(today.getByRole('link', { name: '내 현황 보기' }).getAttribute('href')).toBe('/stats');
  });

  it('아직 체크한 질문이 없으면 시험 대신 질문 둘러보기를 권한다', async () => {
    member({ total: 6, learned: 0, topics: [] });
    renderApp('/');
    const today = within(await screen.findByRole('region', { name: '오늘 할 일' }));
    expect(await today.findByText(/아직 체크한 질문이 없습니다/)).toBeTruthy();
    expect(today.getByRole('link', { name: '질문 둘러보기' }).getAttribute('href')).toBe('/explore');
    expect(today.queryByRole('link', { name: '랜덤 면접 시작' })).toBeNull();
  });

  it('진도를 못 받아도 시험 시작은 막지 않는다', async () => {
    mockApi({ [SESSION_URL]: authed(), '/interview/api/v1/categories': categories, [SUMMARY]: respond(() => errorResponse(500, 'X', 'x')), [REVIEW]: [] });
    renderApp('/');
    const today = within(await screen.findByRole('region', { name: '오늘 할 일' }));
    expect(today.getByRole('link', { name: '랜덤 면접 시작' })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('다시 공부 후보는 3개까지 보이고, 질문 은행 카드에 주제별 진도가 붙는다', async () => {
    const many = Array.from({ length: 5 }, (_, i) => ({ slug: `tx-0${i}`, title: `후보 ${i}`, tier: 'BASIC', topicSlug: 'transaction', topicName: '트랜잭션' }));
    member({ total: 6, learned: 4, topics: [{ topicSlug: 'transaction', total: 5, learned: 3 }] }, many);
    renderApp('/');
    expect(await screen.findByRole('heading', { name: '다시 공부 후보 (5)' })).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /^체크 해제/ })).toHaveLength(3);
    expect((await screen.findByRole('progressbar', { name: '트랜잭션 학습 진도' })).getAttribute('aria-valuenow')).toBe('3');
  });

  it('axe 위반이 없다', async () => {
    member({ total: 6, learned: 4, topics: [{ topicSlug: 'transaction', total: 5, learned: 3 }] });
    renderApp('/');
    await screen.findByText(/체크한 질문 4개 중에서/);
    expect(await a11yViolations()).toEqual([]);
  });
});

describe('홈: 질문 은행(카테고리 칩)', () => {
  const open = () => {
    mockApi({ [SESSION_URL]: anonymous(), '/interview/api/v1/categories': categories, [FEATURED]: [] });
    renderApp('/');
  };

  it('처음에는 첫 카테고리의 주제만 보이고, 칩을 누르면 그 카테고리로 바뀐다', async () => {
    open();
    expect(await screen.findByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /트랜잭션/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /자바 언어 기본/ })).toBeNull();
    const chips = within(screen.getByRole('group', { name: '카테고리' }));
    expect(chips.getByRole('button', { name: '스프링' }).getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(chips.getByRole('button', { name: '자바' }));
    expect(await screen.findByRole('heading', { level: 3, name: '자바' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /자바 언어 기본/ }).getAttribute('href')).toBe('/t/java-lang');
    expect(screen.queryByRole('link', { name: /트랜잭션/ })).toBeNull();
    expect(chips.getByRole('button', { name: '자바' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('마지막에 고른 카테고리를 기억해 다시 열면 그 카테고리로 시작한다', async () => {
    open();
    fireEvent.click(within(await screen.findByRole('group', { name: '카테고리' })).getByRole('button', { name: '자바' }));
    cleanup();
    open();
    expect(await screen.findByRole('heading', { level: 3, name: '자바' })).toBeTruthy();
  });

  it('기억된 카테고리가 이제 없으면 첫 카테고리로 돌아간다', async () => {
    window.localStorage.setItem('interview.homeCategory', 'removed-category');
    open();
    expect(await screen.findByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
  });

  it('저장소를 못 써도(예외) 그대로 동작한다', async () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    open();
    fireEvent.click(within(await screen.findByRole('group', { name: '카테고리' })).getByRole('button', { name: '자바' }));
    expect(await screen.findByRole('heading', { level: 3, name: '자바' })).toBeTruthy();
    spy.mockRestore();
    set.mockRestore();
  });

  it('세션을 확인하는 동안에도 질문 은행은 기다리지 않고 보인다', async () => {
    mockApi({ [SESSION_URL]: respond(() => new Promise<Response>(() => undefined)), '/interview/api/v1/categories': categories });
    renderApp('/');
    expect(await screen.findByRole('heading', { level: 3, name: '스프링' })).toBeTruthy();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0); // 위쪽은 뼈대
  });
});
