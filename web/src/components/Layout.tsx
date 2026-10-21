import { useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { HUB_PATH, SERVICE_NAME } from '../config';
import { loginUrl, useSession } from '../session/SessionProvider';
import { AnalyticsGate, AnalyticsNotice } from './AnalyticsGate';
import { ChromeContext, useChromeState } from './chrome';
import { HubHomeIcon, SearchIcon } from './icons';
import { SearchBox } from './SearchBox';
import { TabBar, TABS, useActiveTab } from './TabBar';

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

/** 데스크톱 상단 메뉴(폰에서는 아래 탭 바가 같은 4개를 맡는다). */
function DesktopNav() {
  const current = useActiveTab();
  return (
    <nav aria-label="주요 메뉴" className="hidden items-center gap-x-1 md:flex">
      {TABS.map((tab) => (
        <Link
          key={tab.to}
          to={tab.to}
          aria-current={current === tab.to ? 'page' : undefined}
          className={`inline-flex min-h-11 items-center rounded-md px-3 no-underline ${
            current === tab.to ? 'bg-[var(--color-surface-2)] font-bold text-[var(--color-accent)]' : 'text-[var(--color-text)]'
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}

export function Layout() {
  const mainRef = useRef<HTMLElement | null>(null);
  useRouteFocus(mainRef);
  const chrome = useChromeState();
  return (
    <ChromeContext.Provider value={chrome.value}>
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded-md focus:bg-[var(--color-surface)] focus:px-4 focus:py-3"
        >
          본문으로 건너뛰기
        </a>
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
          {/* 도로 허브(게이트웨이의 `/`)로 나가는 링크: 다른 앱이므로 라우터 링크가 아니라 전체 페이지 이동이다 */}
          <a
            href={HUB_PATH}
            aria-label="도로 홈으로"
            title="도로 홈으로"
            className="-mr-2 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]"
          >
            <HubHomeIcon />
          </a>
          <Link to="/" className="inline-flex min-h-11 shrink-0 items-center text-lg font-bold no-underline">
            {SERVICE_NAME}
          </Link>
          <DesktopNav />
          <div className="ml-auto flex items-center gap-x-3">
            <SessionNav />
            <Link to="/search" aria-label="검색" className="inline-flex size-11 items-center justify-center rounded-md text-[var(--color-text)] md:hidden">
              <SearchIcon />
            </Link>
            <div className="hidden md:block">
              <SearchBox />
            </div>
          </div>
        </header>
        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 pb-8 outline-none md:pb-12">
          <Outlet />
        </main>
        <footer className="border-t border-[var(--color-border)] py-4 text-sm text-[var(--color-muted)]">
          공식 문서를 읽고 정리한 면접 질문입니다. 검수 상태와 근거 표기를 확인하세요.
          <AnalyticsNotice />
          {/* 통합 e2e 가 서로 다른 두 빌드를 구분하는 표식(운영 빌드에는 없다) */}
          {import.meta.env.VITE_BUILD_MARK && <span data-build-mark={import.meta.env.VITE_BUILD_MARK} className="sr-only"> 빌드 {import.meta.env.VITE_BUILD_MARK}</span>}
        </footer>
      </div>
      <AnalyticsGate />
      {/* 폰의 아래 고정 영역: 평소엔 탭 바, 화면이 동작 바를 내면 그 바가 대신한다 */}
      <div ref={chrome.setSlot} className="fixed inset-x-0 bottom-0 z-20">
        {!chrome.hasBar && <TabBar />}
      </div>
    </ChromeContext.Provider>
  );
}
