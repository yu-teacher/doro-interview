// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { errorResponse, mockApi, respond } from '../testing/mockFetch';
import { anonymous, authed, SESSION_URL } from '../testing/fixtures';
import { loginUrl, SessionProvider, useSession, useSessionKey } from './SessionProvider';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Probe() {
  const { state, refresh, logout, markAnonymous } = useSession();
  const key = useSessionKey();
  return (
    <div>
      <span data-testid="status">{state.status}</span>
      <span data-testid="key">{`${key.key}|${key.ready}|${key.authenticated}`}</span>
      <button onClick={refresh}>refresh</button>
      <button onClick={() => void logout()}>logout</button>
      <button onClick={markAnonymous}>expire</button>
    </div>
  );
}

const status = () => screen.getByTestId('status').textContent;

describe('SessionProvider', () => {
  it('처음에는 loading 이고 요청이 끝나기 전에는 데이터 요청을 시작하지 않는다(ready=false)', async () => {
    let release: (r: Response) => void = () => undefined;
    mockApi({ [SESSION_URL]: respond(() => new Promise<Response>((resolve) => (release = resolve))) });
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(status()).toBe('loading');
    expect(screen.getByTestId('key').textContent).toBe('anon|false|false');
    await act(async () => release(new Response(JSON.stringify({ success: true, data: anonymous() }), { status: 200 })));
    expect(status()).toBe('anonymous');
    expect(screen.getByTestId('key').textContent).toBe('anon|true|false');
  });

  it('로그인 상태면 사용자 id 가 키가 된다', async () => {
    mockApi({ [SESSION_URL]: authed('abc') });
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(await screen.findByText('authenticated')).toBeTruthy();
    expect(screen.getByTestId('key').textContent).toBe('abc|true|true');
  });

  it('조회가 실패하면(5xx·네트워크) 로그인 여부를 추측하지 않고 error 로 둔다', async () => {
    mockApi({ [SESSION_URL]: respond(() => errorResponse(503, 'AUTH-503-02', 'down')) });
    render(<SessionProvider><Probe /></SessionProvider>);
    expect(await screen.findByText('error')).toBeTruthy();
    expect(screen.getByTestId('key').textContent).toBe('anon|true|false');
  });

  it('다시 시도하면 loading 을 거쳐 새 결과를 반영한다', async () => {
    let n = 0;
    mockApi({ [SESSION_URL]: respond(() => (n++ === 0 ? errorResponse(500, 'X', 'x') : new Response(JSON.stringify({ success: true, data: authed() }), { status: 200 }))) });
    render(<SessionProvider><Probe /></SessionProvider>);
    await screen.findByText('error');
    fireEvent.click(screen.getByText('refresh'));
    expect(await screen.findByText('authenticated')).toBeTruthy();
  });

  it('서버가 401 을 준 것을 알리면(markAnonymous) 비로그인으로 바뀐다', async () => {
    mockApi({ [SESSION_URL]: authed() });
    render(<SessionProvider><Probe /></SessionProvider>);
    await screen.findByText('authenticated');
    fireEvent.click(screen.getByText('expire'));
    expect(status()).toBe('anonymous');
  });

  it('로그아웃은 CSRF 헤더를 붙여 POST 하고 화면은 비로그인이 된다 — 서버가 실패해도 마찬가지다', async () => {
    const { requests } = mockApi({ [SESSION_URL]: authed(), 'POST /interview/api/v1/bff/logout': respond(() => errorResponse(500, 'X', 'x')) });
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(<SessionProvider><Probe /></SessionProvider>);
    await screen.findByText('authenticated');
    fireEvent.click(screen.getByText('logout'));
    expect(await screen.findByText('anonymous')).toBeTruthy();
    const post = requests.find((r) => r.method === 'POST');
    expect(post?.path).toBe('/interview/api/v1/bff/logout');
    expect(post?.headers['X-Interview-Csrf']).toBe('1');
  });

  it('공급자 없이 쓰면 비로그인으로 동작한다', () => {
    render(<Probe />);
    expect(status()).toBe('anonymous');
    expect(screen.getByTestId('key').textContent).toBe('anon|true|false');
  });
});

describe('loginUrl', () => {
  it('돌아올 경로를 인코딩해 BFF 로그인 주소에 싣는다', () => {
    expect(loginUrl('/t/transaction?tier=BASIC')).toBe('/interview/api/v1/bff/login?return=%2Ft%2Ftransaction%3Ftier%3DBASIC');
  });
});
