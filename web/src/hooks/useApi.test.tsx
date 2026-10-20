// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../api/client';
import { useApi } from './useApi';

afterEach(cleanup);

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useApi', () => {
  it('로딩 → 성공', async () => {
    const { result } = renderHook(() => useApi('k', async () => 'ok'));
    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'ok' }));
  });

  it('ApiError 는 그대로, 그 밖의 오류는 UNKNOWN ApiError 로 낸다', async () => {
    const a = renderHook(() => useApi('a', async () => Promise.reject(new ApiError(404, 'COMMON-404-01', '없다'))));
    await waitFor(() => expect(a.result.current.state.status).toBe('error'));
    expect(a.result.current.state).toMatchObject({ error: { status: 404, code: 'COMMON-404-01' } });

    const b = renderHook(() => useApi('b', async () => Promise.reject(new Error('boom'))));
    await waitFor(() => expect(b.result.current.state.status).toBe('error'));
    expect(b.result.current.state).toMatchObject({ error: { code: 'UNKNOWN' } });
  });

  it('reload 하면 다시 불러온다', async () => {
    let n = 0;
    const { result } = renderHook(() => useApi('k', async () => ++n));
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 1 }));
    act(() => result.current.reload());
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 2 }));
  });

  it('key 가 바뀌면 다시 불러온다', async () => {
    const { result, rerender } = renderHook(({ k }) => useApi(k, async () => k), { initialProps: { k: 'a' } });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'a' }));
    rerender({ k: 'b' });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'b' }));
  });

  it('key 가 바뀌면 이전 요청을 취소하고 늦게 도착한 옛 응답은 버린다', async () => {
    const first = deferred<string>();
    const second = deferred<string>();
    const signals: AbortSignal[] = [];
    const { result, rerender } = renderHook(
      ({ k }) =>
        useApi(k, (signal) => {
          signals.push(signal);
          return k === 'a' ? first.promise : second.promise;
        }),
      { initialProps: { k: 'a' } },
    );
    rerender({ k: 'b' });
    expect(signals[0].aborted).toBe(true);
    await act(async () => {
      second.resolve('B');
      await second.promise;
    });
    await waitFor(() => expect(result.current.state).toEqual({ status: 'success', data: 'B' }));
    await act(async () => {
      first.resolve('A(늦게 도착)');
      await first.promise;
    });
    expect(result.current.state).toEqual({ status: 'success', data: 'B' });
  });

  it('언마운트하면 요청을 취소하고 이후 응답으로 상태를 바꾸지 않는다', async () => {
    const d = deferred<string>();
    let signal: AbortSignal | undefined;
    const errors = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { unmount } = renderHook(() =>
      useApi('k', (s) => {
        signal = s;
        return d.promise;
      }),
    );
    unmount();
    expect(signal?.aborted).toBe(true);
    await act(async () => {
      d.resolve('late');
      await d.promise;
    });
    expect(errors).not.toHaveBeenCalled();
    errors.mockRestore();
  });

  it('최신 fetcher 를 쓴다(렌더마다 새 함수여도 다시 요청하지 않는다)', async () => {
    const calls = vi.fn(async () => 'x');
    const { result, rerender } = renderHook(() => useApi('same', () => calls()));
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    rerender();
    rerender();
    expect(calls).toHaveBeenCalledTimes(1);
  });
});
