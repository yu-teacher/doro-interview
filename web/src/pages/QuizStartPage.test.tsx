// @vitest-environment jsdom
import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { a11yViolations } from '../testing/axe';
import { anonymous, authed, quizSession, quizItem, SESSION_URL } from '../testing/fixtures';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { renderApp } from '../testing/renderApp';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const CATEGORIES = '/interview/api/v1/categories';
const PREFS = '/interview/api/v1/me/prefs';
const categories = [
  { slug: 'spring', name: '스프링', topics: [
    { slug: 'transaction', name: '트랜잭션', description: '', baseVersion: null, counts: { basic: 3, deep: 1, tricky: 1 } },
    { slug: 'aop-proxy', name: 'AOP', description: '', baseVersion: null, counts: { basic: 2, deep: 0, tricky: 0 } },
  ] },
  { slug: 'java', name: '자바', topics: [{ slug: 'java-lang', name: '자바 언어 기본', description: '', baseVersion: null, counts: { basic: 1, deep: 0, tricky: 0 } }] },
];

const start = (routes: Record<string, unknown> = {}, session: unknown = authed()) => {
  const api = mockApi({ [SESSION_URL]: session, [CATEGORIES]: categories, [PREFS]: { includeUnlearnedDefault: false }, ...routes });
  renderApp('/quiz');
  return api;
};

const putStart = (requests: { method: string; path: string }[]) => requests.filter((r) => r.method === 'PUT' && /\/quiz\/[0-9a-f-]{36}$/.test(r.path));

describe('시험 시작 화면', () => {
  it('비로그인이면 로그인 안내를 보이고 아무것도 요청하지 않는다', async () => {
    const { calls } = start({}, anonymous());
    expect(await screen.findByRole('link', { name: '로그인하고 시험 보기' })).toBeTruthy();
    expect(screen.getByRole('link', { name: '로그인하고 시험 보기' }).getAttribute('href')).toBe('/interview/api/v1/bff/login?return=%2Fquiz');
    expect(calls.some((c) => c.includes('/quiz') && !c.includes('bff'))).toBe(false);
    expect(screen.queryByRole('button', { name: '시험 시작' })).toBeNull();
  });

  it('로그인하면 주제·난이도·문제 수 선택지를 보여 준다', async () => {
    start();
    expect(await screen.findByRole('button', { name: '시험 시작' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: '트랜잭션' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: '자바 언어 기본' })).toBeTruthy();
    expect(screen.getByRole('checkbox', { name: '기본' })).toBeTruthy();
    expect((screen.getByLabelText(/문제 수/) as HTMLInputElement).value).toBe('10');
  });

  it('"미학습 포함" 기본값은 설정을 따른다', async () => {
    start({ [PREFS]: { includeUnlearnedDefault: true } });
    const box = (await screen.findByRole('checkbox', { name: /체크하지 않은 질문도 포함/ })) as HTMLInputElement;
    expect(box.checked).toBe(true);
  });

  it('설정을 못 불러와도 꺼진 기본값으로 시험을 볼 수 있다', async () => {
    start({ [PREFS]: respond(() => errorResponse(500, 'X', 'x')) });
    const box = (await screen.findByRole('checkbox', { name: /체크하지 않은 질문도 포함/ })) as HTMLInputElement;
    expect(box.checked).toBe(false);
    expect(screen.getByRole('button', { name: '시험 시작' })).toBeTruthy();
  });

  it('시작하면 선택한 범위로 PUT 하고 시험 화면으로 이동한다', async () => {
    const id = '22222222-2222-2222-2222-222222222222';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    const { requests } = start({ [`PUT /interview/api/v1/quiz/${id}`]: okResponse(quizSession([quizItem(1)], { sessionId: id })), [`/interview/api/v1/quiz/${id}`]: quizSession([quizItem(1)], { sessionId: id }) });
    await screen.findByRole('button', { name: '시험 시작' });
    fireEvent.click(screen.getByRole('checkbox', { name: '트랜잭션' }));
    fireEvent.click(screen.getByRole('checkbox', { name: '심화' }));
    fireEvent.change(screen.getByLabelText(/문제 수/), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /체크하지 않은 질문도 포함/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /완전 무작위/ }));
    fireEvent.click(screen.getByRole('button', { name: '시험 시작' }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    const put = putStart(requests)[0] as unknown as { body: unknown; headers: Record<string, string> };
    expect(put.body).toEqual({ count: 7, includeUnlearned: true, topics: ['transaction'], tiers: ['DEEP'], mode: 'RANDOM' });
    expect(put.headers['X-Interview-Csrf']).toBe('1');
  });

  it('카테고리는 접혀 있고, 고른 주제 수를 카테고리 줄에 보여 준다', async () => {
    start();
    await screen.findByRole('button', { name: '시험 시작' });
    const spring = screen.getByText('스프링').closest('details') as HTMLDetailsElement;
    expect(spring.open).toBe(false);
    expect(within(spring).getByText('전체')).toBeTruthy(); // 아무것도 안 골랐다 = 전체
    fireEvent.click(screen.getByRole('checkbox', { name: '트랜잭션' }));
    expect(within(spring).getByText('1개 선택')).toBeTruthy();
    expect(within(screen.getByText('자바').closest('details') as HTMLElement).getByText('전체')).toBeTruthy();
  });

  it('카테고리 전체 선택·해제와 선택 해제 단추가 주제 범위를 바꾼다', async () => {
    const id = '33333333-3333-3333-3333-333333333333';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    const { requests } = start({ [`PUT /interview/api/v1/quiz/${id}`]: okResponse(quizSession([quizItem(1)], { sessionId: id })), [`/interview/api/v1/quiz/${id}`]: quizSession([quizItem(1)], { sessionId: id }) });
    await screen.findByRole('button', { name: '시험 시작' });
    fireEvent.click(screen.getByRole('button', { name: '스프링 전체 선택' }));
    expect((screen.getByRole('checkbox', { name: '트랜잭션' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'AOP' }) as HTMLInputElement).checked).toBe(true);
    expect(screen.getByRole('button', { name: '스프링 전체 해제' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: '선택 해제(2)' }));
    expect((screen.getByRole('checkbox', { name: '트랜잭션' }) as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByRole('button', { name: /^선택 해제/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: '스프링 전체 선택' }));
    fireEvent.click(screen.getByRole('button', { name: '스프링 전체 해제' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'AOP' }));
    fireEvent.click(screen.getByRole('button', { name: '시험 시작' }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect((putStart(requests)[0] as unknown as { body: { topics: string[] } }).body.topics).toEqual(['aop-proxy']);
  });

  it('아무것도 고르지 않으면 범위 키를 보내지 않는다(전부)', async () => {
    const id = '33333333-3333-3333-3333-333333333333';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    const { requests } = start({ [`PUT /interview/api/v1/quiz/${id}`]: okResponse(quizSession([quizItem(1)], { sessionId: id })), [`/interview/api/v1/quiz/${id}`]: quizSession([quizItem(1)], { sessionId: id }) });
    fireEvent.click(await screen.findByRole('button', { name: '시험 시작' }));
    await screen.findByRole('heading', { level: 2, name: '질문 1' });
    expect((putStart(requests)[0] as unknown as { body: unknown }).body).toEqual({ count: 10, includeUnlearned: false, mode: 'WEIGHTED' });
  });

  it('문제 수가 범위를 벗어나면 시작할 수 없다', async () => {
    const { requests } = start();
    const count = await screen.findByLabelText(/문제 수/);
    for (const bad of ['0', '31', '', '2.5', '-3']) {
      fireEvent.change(count, { target: { value: bad } });
      expect((screen.getByRole('button', { name: '시험 시작' }) as HTMLButtonElement).disabled, bad).toBe(true);
      expect(screen.getByRole('alert').textContent).toContain('1~30');
    }
    fireEvent.change(count, { target: { value: '30' } });
    expect((screen.getByRole('button', { name: '시험 시작' }) as HTMLButtonElement).disabled).toBe(false);
    expect(putStart(requests)).toHaveLength(0);
  });

  it('풀이 비면 안내하고 질문 은행으로 가는 링크를 준다', async () => {
    const id = '44444444-4444-4444-4444-444444444444';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    start({ [`PUT /interview/api/v1/quiz/${id}`]: respond(() => errorResponse(400, 'QUIZ-400-01', '시험을 볼 질문이 없습니다. 질문을 학습함으로 체크하거나 범위를 넓혀 주세요.')) });
    fireEvent.click(await screen.findByRole('button', { name: '시험 시작' }));
    const alert = await screen.findByText(/시험을 볼 질문이 없습니다/);
    expect(alert.closest('[role="alert"]')).toBeTruthy();
    expect(within(alert.closest('[role="alert"]') as HTMLElement).getByRole('link', { name: /질문 은행에서 학습한 질문을 체크/ })).toBeTruthy();
    expect((screen.getByRole('button', { name: '시험 시작' }) as HTMLButtonElement).disabled).toBe(false); // 다시 시도할 수 있다
  });

  it('시작 중에는 버튼이 막혀 두 번 눌러도 한 번만 보낸다', async () => {
    const id = '55555555-5555-5555-5555-555555555555';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    let release: (r: Response) => void = () => undefined;
    const { requests } = start({ [`PUT /interview/api/v1/quiz/${id}`]: respond(() => new Promise<Response>((resolve) => (release = resolve))) });
    const button = await screen.findByRole('button', { name: '시험 시작' });
    fireEvent.click(button);
    fireEvent.click(button);
    await waitFor(() => expect(putStart(requests)).toHaveLength(1));
    expect((screen.getByRole('button', { name: '시작하는 중…' }) as HTMLButtonElement).disabled).toBe(true);
    release(okResponse(quizSession([quizItem(1)], { sessionId: id })));
  });

  it('시작 중 401 이면 비로그인으로 바뀐다', async () => {
    const id = '66666666-6666-6666-6666-666666666666';
    vi.spyOn(crypto, 'randomUUID').mockReturnValue(id);
    start({ [`PUT /interview/api/v1/quiz/${id}`]: respond(() => errorResponse(401, 'AUTH-401-01', 'x')) });
    fireEvent.click(await screen.findByRole('button', { name: '시험 시작' }));
    expect(await screen.findByRole('link', { name: '로그인하고 시험 보기' })).toBeTruthy();
  });

  it('접근성 구조 위반이 없다(로그인·비로그인)', async () => {
    start();
    await screen.findByRole('button', { name: '시험 시작' });
    expect(await a11yViolations()).toEqual([]);
    cleanup();
    start({}, anonymous());
    await screen.findByRole('link', { name: '로그인하고 시험 보기' });
    expect(await a11yViolations()).toEqual([]);
  });
});
