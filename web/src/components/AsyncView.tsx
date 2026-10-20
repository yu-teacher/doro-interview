import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { AsyncState } from '../hooks/useApi';

interface Props<T> {
  state: AsyncState<T>;
  reload: () => void;
  /** 404 일 때 보여 줄 문구(재시도 버튼 없음) */
  notFoundMessage?: string;
  children: (data: T) => ReactNode;
}

/** 로딩·오류·404·성공을 한 곳에서 그린다. 오류는 `role=alert`, 로딩은 `role=status` 로 스크린 리더에 알린다. */
export function AsyncView<T>({ state, reload, notFoundMessage = '찾을 수 없는 페이지입니다.', children }: Props<T>) {
  if (state.status === 'loading') {
    return (
      <p role="status" className="py-8 text-center text-[var(--color-muted)]">
        불러오는 중…
      </p>
    );
  }
  if (state.status === 'error') {
    if (state.error.isNotFound) {
      return (
        <div role="alert" className="py-8 text-center">
          <h1 className="text-xl font-bold">{notFoundMessage}</h1>
          <Link to="/" className="mt-3 inline-flex min-h-11 items-center underline">
            처음으로
          </Link>
        </div>
      );
    }
    // 같은 요청을 다시 보내도 결과가 같은 클라이언트 오류(4xx, 예: 잘못된 검색어)에는 재시도 버튼을 두지 않는다
    const retryable = state.error.status === 0 || state.error.status >= 500;
    if (!retryable) {
      return (
        <div role="alert" className="py-8 text-center">
          <h1 className="text-xl font-bold">요청을 처리하지 못했습니다</h1>
          <p className="mt-2">{state.error.message}</p>
        </div>
      );
    }
    return (
      <div role="alert" className="py-8 text-center">
        <h1 className="text-xl font-bold">불러오지 못했습니다</h1>
        <p className="mt-2">{state.error.message}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-3 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4"
        >
          다시 시도
        </button>
      </div>
    );
  }
  return <>{children(state.data)}</>;
}
