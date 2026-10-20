import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchSession, postLogout } from '../api/progress';
import { apiPath } from '../config';

/**
 * 로그인 상태. 로그인·로그아웃과 토큰은 서버(BFF)가 맡고 브라우저에는 HttpOnly 쿠키만 있다. 여기에는 "누구인지" 의 id 만 있다.
 * `error` 는 세션을 **알 수 없는** 상태다(네트워크·5xx): 로그인했다고도 안 했다고도 추측하지 않고 읽기 전용으로 보여 준다.
 */
export type SessionState =
  | { status: 'loading' }
  | { status: 'anonymous' }
  | { status: 'authenticated'; userId: string }
  | { status: 'error' };

export interface SessionContextValue {
  state: SessionState;
  /** 세션을 다시 조회한다(오류 상태의 "다시 시도"). */
  refresh: () => void;
  /** 서버가 401 을 돌려줬다: 세션이 끝난 것이므로 화면을 비로그인으로 맞춘다. */
  markAnonymous: () => void;
  logout: () => Promise<void>;
}

const ANONYMOUS: SessionContextValue = {
  state: { status: 'anonymous' },
  refresh: () => undefined,
  markAnonymous: () => undefined,
  logout: () => Promise.resolve(),
};

// 공급자 없이 렌더하면(시험·단독 화면) 비로그인으로 동작한다
const SessionContext = createContext<SessionContextValue>(ANONYMOUS);

export function useSession(): SessionContextValue {
  return useContext(SessionContext);
}

/** 로그인 후 돌아올 곳을 담은 로그인 시작 주소(전체 페이지 이동). `returnPath` 는 웹 기준 경로 상대다. */
export function loginUrl(returnPath: string): string {
  return `${apiPath('v1/bff/login')}?return=${encodeURIComponent(returnPath)}`;
}

/**
 * 사용자가 바뀌면 달라지는 키. 로그인 상태에 따라 응답 본문이 다르므로(learned) 데이터 요청의 키에 섞어 로그인·로그아웃 때 다시 받는다.
 * `ready` 가 false 인 동안은 요청을 보내지 않는다(비로그인 응답을 받고 곧 다시 받는 깜빡임을 피한다).
 */
export function useSessionKey(): { key: string; ready: boolean; authenticated: boolean } {
  const { state } = useSession();
  if (state.status === 'authenticated') {
    return { key: state.userId, ready: true, authenticated: true };
  }
  return { key: 'anon', ready: state.status !== 'loading', authenticated: false };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchSession(controller.signal)
      .then((info) => {
        if (!controller.signal.aborted) {
          setState(info.authenticated && info.user ? { status: 'authenticated', userId: info.user.userId } : { status: 'anonymous' });
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
  }, [nonce]);

  const refresh = useCallback(() => {
    setState({ status: 'loading' });
    setNonce((n) => n + 1);
  }, []);
  const markAnonymous = useCallback(() => setState({ status: 'anonymous' }), []);
  const logout = useCallback(async () => {
    try {
      await postLogout();
    } catch (e) {
      // 서버 세션을 못 지웠어도 화면은 로그아웃으로 보여 준다(원인은 남긴다)
      console.error('로그아웃 요청 실패', e);
    }
    setState({ status: 'anonymous' });
  }, []);

  const value = useMemo(() => ({ state, refresh, markAnonymous, logout }), [state, refresh, markAnonymous, logout]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
