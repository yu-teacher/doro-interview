import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { SERVICE_NAME } from '../config';
import { conceptsPath, searchPath } from '../routes';
import { loginUrl, useSession } from '../session/SessionProvider';

function SearchForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [value, setValue] = useState(params.get('q') ?? '');

  function submit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) {
      navigate(searchPath(q));
    }
  }

  return (
    <form role="search" onSubmit={submit} className="flex w-full gap-2 sm:w-auto">
      <label htmlFor="search-input" className="sr-only">
        질문 검색
      </label>
      <input
        id="search-input"
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="질문 검색 (예: 프록시 전파)"
        maxLength={100}
        autoComplete="off"
        // 16px 이상이라야 iOS 가 입력할 때 화면을 확대하지 않는다
        className="min-h-11 min-w-0 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-base sm:w-72"
      />
      <button
        type="submit"
        className="min-h-11 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]"
      >
        검색
      </button>
    </form>
  );
}

/** 로그인 상태에 따른 헤더 메뉴. 상태를 알 수 없으면(오류) 추측하지 않고 다시 시도를 안내한다. */
function SessionNav() {
  const { state, refresh, logout } = useSession();
  const { pathname, search } = useLocation();
  const button = 'inline-flex min-h-11 shrink-0 items-center underline';
  switch (state.status) {
    case 'authenticated':
      return (
        <button type="button" onClick={() => void logout()} className={button}>
          로그아웃
        </button>
      );
    case 'anonymous':
      return (
        <a href={loginUrl(pathname + search)} className="inline-flex min-h-11 shrink-0 items-center">
          로그인
        </a>
      );
    case 'error':
      return (
        <span role="status" className="inline-flex flex-wrap items-center gap-2 text-sm">
          로그인 상태를 확인하지 못했습니다.
          <button type="button" onClick={refresh} className={button}>
            다시 시도
          </button>
        </span>
      );
    default:
      return null;
  }
}

/**
 * 화면(경로)이 바뀌면 맨 위로 올리고 본문으로 포커스를 옮긴다. 일반 페이지 이동에서 브라우저가 해 주는 일을 SPA 에서도 하는 것이다
 * (스크린 리더가 새 화면의 시작을 읽고, 키보드 사용자가 헤더를 다시 거치지 않는다). 첫 렌더에서는 하지 않는다.
 * 같은 경로의 쿼리만 바뀌는 필터 조작에서는 하지 않는다.
 */
function useRouteFocus(mainRef: React.RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, mainRef]);
}

export function Layout() {
  const mainRef = useRef<HTMLElement | null>(null);
  useRouteFocus(mainRef);
  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-[var(--color-surface)] focus:px-4 focus:py-3"
      >
        본문으로 건너뛰기
      </a>
      <header className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label="주요 메뉴" className="flex flex-wrap items-center gap-x-4">
          <Link to="/" className="inline-flex min-h-11 shrink-0 items-center text-lg font-bold no-underline">
            {SERVICE_NAME}
          </Link>
          <Link to={conceptsPath()} className="inline-flex min-h-11 shrink-0 items-center">
            개념
          </Link>
          <SessionNav />
        </nav>
        <SearchForm />
      </header>
      <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 pb-12 outline-none">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)]">
        공식 문서를 읽고 정리한 면접 질문입니다. 검수 상태와 근거 표기를 확인하세요.
      </footer>
    </div>
  );
}
