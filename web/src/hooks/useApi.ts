import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '../api/client';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: ApiError };

/**
 * `key` 가 바뀌거나 `reload()` 를 부르면 `fetcher` 를 다시 실행한다. 이전 요청은 취소하고 늦게 온 응답은 버린다.
 * `fetcher` 는 매 렌더 바뀌어도 되고(ref 로 최신 것만 쓴다) 효과의 의존성은 `key`·`enabled` 와 reload 횟수뿐이다.
 */
export function useApi<T>(
  key: string,
  fetcher: (signal: AbortSignal) => Promise<T>,
  /** false 인 동안은 요청하지 않고 로딩으로 둔다(앞선 조건이 정해질 때까지 기다릴 때). */
  enabled = true,
): { state: AsyncState<T>; reload: () => void } {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'loading' });
      return undefined;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    fetcherRef
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setState({ status: 'success', data });
        }
      })
      .catch((e: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setState({ status: 'error', error: e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', '알 수 없는 오류가 발생했습니다.') });
      });
    return () => controller.abort();
  }, [key, nonce, enabled]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { state, reload };
}
