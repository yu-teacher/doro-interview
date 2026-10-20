// @vitest-environment jsdom
import { cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, SESSION_URL, summary, topicView } from '../testing/fixtures';
import { mockApi } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

const TOPIC = '/interview/api/v1/topics/transaction';
const questions = [
  summary('tx-01', { tier: 'BASIC', keywords: ['프록시', 'AOP'] }),
  summary('tx-02', { tier: 'DEEP', keywords: ['전파'] }),
  summary('tx-03', { tier: 'BASIC', keywords: [] }),
];

const open = (path = '/skim/transaction') => {
  const api = mockApi({ [SESSION_URL]: anonymous(), [TOPIC]: topicView(questions) });
  renderApp(path);
  return api;
};

describe('훑기', () => {
  it('키워드는 누르기 전에는 보이지 않고, 누르면 보인다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999); // 섞어도 원래 순서 유지
    open();
    expect(await screen.findByRole('heading', { level: 2, name: /질문 tx-01/ })).toBeTruthy();
    expect(screen.queryByText('프록시')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
    expect(screen.getByText('프록시')).toBeTruthy();
    expect(screen.getByText('AOP')).toBeTruthy();
  });

  it('비로그인에서도 되고 기록용 요청(PUT/POST)을 하지 않는다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    const { requests, calls } = open();
    await screen.findByRole('button', { name: '키워드 보기' });
    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
      fireEvent.click(screen.getByRole('button', { name: '알았음' }));
    }
    expect(await screen.findByRole('heading', { name: '끝났습니다' })).toBeTruthy();
    expect(requests.filter((r) => r.method !== 'GET')).toEqual([]);
    expect(calls.some((c) => c.includes('/quiz') || c.includes('/progress'))).toBe(false);
  });

  it('모르겠음으로 표시한 질문만 끝 화면에 다시 나온다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    open();
    await screen.findByRole('button', { name: '키워드 보기' });
    const answers = ['알았음', '모르겠음', '알았음'];
    for (const a of answers) {
      fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
      fireEvent.click(screen.getByRole('button', { name: a }));
    }
    expect(screen.getByText(/3문제 중 2문제는 알았고, 1문제는 다시 볼 필요가 있습니다/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: /질문 tx-/ })).toHaveLength(1);
    expect(screen.getByRole('link', { name: '질문 tx-02' })).toBeTruthy();
  });

  it('난이도를 고르면 그 난이도의 질문만 묻는다', async () => {
    open('/skim/transaction?tier=DEEP');
    expect(await screen.findByRole('heading', { level: 2, name: /질문 tx-02/ })).toBeTruthy();
    expect(screen.getByText('1 / 1')).toBeTruthy();
  });

  it('키워드가 없는 질문은 없다고 알려 준다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    open('/skim/transaction?tier=BASIC');
    await screen.findByRole('button', { name: '키워드 보기' });
    fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '알았음' }));
    fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
    expect(screen.getByText('이 질문에는 키워드가 없습니다.')).toBeTruthy();
  });

  it('처음부터 다시를 누르면 진행이 초기화된다', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999);
    open('/skim/transaction?tier=DEEP');
    await screen.findByRole('button', { name: '키워드 보기' });
    fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
    fireEvent.click(screen.getByRole('button', { name: '모르겠음' }));
    fireEvent.click(screen.getByRole('button', { name: '처음부터 다시' }));
    expect(screen.getByText('1 / 1')).toBeTruthy();
    expect(screen.queryByText('끝났습니다')).toBeNull();
  });

  it('주제 선택 화면은 주제마다 훑기 링크를 준다', async () => {
    mockApi({
      [SESSION_URL]: anonymous(),
      '/interview/api/v1/categories': [{ slug: 'spring', name: '스프링', topics: [{ slug: 'transaction', name: '트랜잭션', description: '', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] }],
    });
    renderApp('/skim');
    const link = await screen.findByRole('link', { name: '트랜잭션' });
    expect(link.getAttribute('href')).toBe('/skim/transaction');
  });

  it('없는 주제는 404 안내를 보인다', async () => {
    mockApi({ [SESSION_URL]: anonymous() });
    renderApp('/skim/none');
    expect(await screen.findByText('찾을 수 없는 주제입니다.')).toBeTruthy();
  });

  it('접근성 위반이 없다', async () => {
    open();
    await screen.findByRole('button', { name: '키워드 보기' });
    fireEvent.click(screen.getByRole('button', { name: '키워드 보기' }));
    expect(await a11yViolations(document.body)).toEqual([]);
  });
});
