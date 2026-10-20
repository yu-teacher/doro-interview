// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorResponse, mockApi, okResponse, respond } from '../testing/mockFetch';
import { SessionProvider, useSession } from '../session/SessionProvider';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { useLearned } from './useLearned';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const PUT_A = 'PUT /interview/api/v1/progress/a';
const server = new Map([['a', false], ['b', true]]);

function Probe({ resetKey = 'k', map = server }: { resetKey?: string; map?: Map<string, boolean> }) {
  const learned = useLearned(map, resetKey);
  const { state } = useSession();
  return (
    <div>
      <span data-testid="a">{String(learned.isLearned('a'))}</span>
      <span data-testid="b">{String(learned.isLearned('b'))}</span>
      <span data-testid="msg">{learned.message ?? ''}</span>
      <span data-testid="session">{state.status}</span>
      <button onClick={() => learned.toggle('a', true)}>check-a</button>
      <button onClick={() => learned.toggle('a', false)}>uncheck-a</button>
      <button onClick={() => learned.setMany(['a', 'b'], true)}>all</button>
    </div>
  );
}

const view = () =>
  render(
    <SessionProvider>
      <Probe />
    </SessionProvider>,
  );
const val = (id: string) => screen.getByTestId(id).textContent;

describe('useLearned', () => {
  it('서버 값에서 시작한다', async () => {
    mockApi({ [SESSION_URL]: authed() });
    view();
    expect(val('a')).toBe('false');
    expect(val('b')).toBe('true');
  });

  it('체크하면 응답을 기다리지 않고 바로 바뀐다(낙관적 갱신)', async () => {
    let release: (r: Response) => void = () => undefined;
    mockApi({ [SESSION_URL]: authed(), [PUT_A]: respond(() => new Promise<Response>((resolve) => (release = resolve))) });
    view();
    fireEvent.click(screen.getByText('check-a'));
    expect(val('a')).toBe('true');
    await act(async () => release(okResponse({ slug: 'a', learned: true })));
    expect(val('a')).toBe('true');
    expect(val('msg')).toBe('');
  });

  it('서버가 거절하면 되돌리고 안내를 남긴다', async () => {
    mockApi({ [SESSION_URL]: authed(), [PUT_A]: respond(() => errorResponse(500, 'SYS-500-01', '서버 내부 오류가 발생했습니다.')) });
    view();
    fireEvent.click(screen.getByText('check-a'));
    await waitFor(() => expect(val('msg')).toBe('서버 내부 오류가 발생했습니다.'));
    expect(val('a')).toBe('false');
  });

  it('네트워크가 끊겨도 되돌리고 안내한다', async () => {
    mockApi({ [SESSION_URL]: authed() });
    const original = globalThis.fetch;
    vi.stubGlobal('fetch', vi.fn((input: RequestInfo | URL, init?: RequestInit) => (String(input).includes('progress') ? Promise.reject(new TypeError('x')) : original(input, init))));
    view();
    fireEvent.click(screen.getByText('check-a'));
    await waitFor(() => expect(val('msg')).toContain('연결할 수 없습니다'));
    expect(val('a')).toBe('false');
  });

  it('401 이면 되돌리고 세션을 비로그인으로 맞춘다', async () => {
    mockApi({ [SESSION_URL]: authed(), [PUT_A]: respond(() => errorResponse(401, 'AUTH-401-01', '로그인이 필요합니다.')) });
    view();
    await waitFor(() => expect(val('session')).toBe('authenticated'));
    fireEvent.click(screen.getByText('check-a'));
    await waitFor(() => expect(val('session')).toBe('anonymous'));
    expect(val('a')).toBe('false');
    expect(val('msg')).toContain('로그인');
  });

  it('같은 질문을 연달아 누르면 요청은 한 번에 하나씩, 마지막 의도가 이긴다', async () => {
    const releases: ((r: Response) => void)[] = [];
    const { requests } = mockApi({
      [SESSION_URL]: anonymous(),
      [PUT_A]: respond(() => new Promise<Response>((resolve) => releases.push(resolve))),
    });
    view();
    fireEvent.click(screen.getByText('check-a'));   // 체크(진행 중)
    fireEvent.click(screen.getByText('uncheck-a')); // 곧바로 해제
    fireEvent.click(screen.getByText('check-a'));   // 다시 체크: 마지막 의도 = 체크
    expect(val('a')).toBe('true');
    expect(requests.filter((r) => r.method === 'PUT')).toHaveLength(1); // 첫 요청이 끝나기 전에는 더 보내지 않는다
    await act(async () => releases[0](okResponse({ slug: 'a', learned: true })));
    // 첫 요청이 true 로 확정됐고 마지막 의도도 true 라서 추가 요청은 필요 없다
    expect(requests.filter((r) => r.method === 'PUT')).toHaveLength(1);
    expect(val('a')).toBe('true');
  });

  it('진행 중에 반대로 바꾸면 끝난 뒤 마지막 의도를 이어서 보낸다', async () => {
    const releases: ((r: Response) => void)[] = [];
    const { requests } = mockApi({ [SESSION_URL]: anonymous(), [PUT_A]: respond(() => new Promise<Response>((resolve) => releases.push(resolve))) });
    view();
    fireEvent.click(screen.getByText('check-a'));
    fireEvent.click(screen.getByText('uncheck-a'));
    expect(val('a')).toBe('false');
    await act(async () => releases[0](okResponse({ slug: 'a', learned: true })));
    await waitFor(() => expect(requests.filter((r) => r.method === 'PUT')).toHaveLength(2));
    expect(requests.filter((r) => r.method === 'PUT').map((r) => (r.body as { learned: boolean }).learned)).toEqual([true, false]);
    await act(async () => releases[1](okResponse({ slug: 'a', learned: false })));
    expect(val('a')).toBe('false');
  });

  it('이어서 보낸 요청이 실패하면 서버가 마지막으로 확정한 값으로 되돌린다', async () => {
    let n = 0;
    mockApi({
      [SESSION_URL]: anonymous(),
      [PUT_A]: respond(() => (n++ === 0 ? okResponse({ slug: 'a', learned: true }) : errorResponse(500, 'X', '실패'))),
    });
    view();
    fireEvent.click(screen.getByText('check-a')); // 성공 → 서버 값 true
    await waitFor(() => expect(n).toBe(1));
    fireEvent.click(screen.getByText('uncheck-a')); // 실패 → 확정값 true 로 복귀
    await waitFor(() => expect(val('msg')).toBe('실패'));
    expect(val('a')).toBe('true');
  });

  it('setMany 는 서버가 확정한 값으로 한꺼번에 맞춘다', () => {
    mockApi({ [SESSION_URL]: authed() });
    view();
    fireEvent.click(screen.getByText('all'));
    expect(val('a')).toBe('true');
    expect(val('b')).toBe('true');
  });

  it('데이터를 다시 받으면(resetKey 변경) 낙관적 값을 버리고 서버 값으로 돌아간다', async () => {
    mockApi({ [SESSION_URL]: authed(), [PUT_A]: okResponse({ slug: 'a', learned: true }) });
    const { rerender } = render(
      <SessionProvider>
        <Probe resetKey="one" />
      </SessionProvider>,
    );
    fireEvent.click(screen.getByText('check-a'));
    expect(val('a')).toBe('true');
    rerender(
      <SessionProvider>
        <Probe resetKey="two" map={new Map([['a', false]])} />
      </SessionProvider>,
    );
    await waitFor(() => expect(val('a')).toBe('false'));
  });
});
