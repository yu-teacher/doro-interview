import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CompassIcon, HomeIcon, QuizIcon, UserIcon } from './icons';

interface Tab {
  to: string;
  label: string;
  icon: ReactNode;
  /** 이 탭이 "현재 위치" 인 경로 */
  active: (pathname: string) => boolean;
}

const startsWithAny = (pathname: string, prefixes: string[]) => prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));

export const TABS: Tab[] = [
  { to: '/', label: '홈', icon: <HomeIcon />, active: (p) => p === '/' },
  { to: '/explore', label: '탐색', icon: <CompassIcon />, active: (p) => startsWithAny(p, ['/explore', '/t', '/q', '/concepts', '/c', '/search']) },
  { to: '/quiz', label: '시험', icon: <QuizIcon />, active: (p) => startsWithAny(p, ['/quiz', '/skim']) },
  { to: '/me', label: '내 공부', icon: <UserIcon />, active: (p) => startsWithAny(p, ['/me', '/mine', '/stats']) },
];

/** 같은 4개를 폰의 아래 탭 바와 데스크톱 상단 메뉴가 함께 쓴다. */
export function useActiveTab(): string | null {
  const { pathname } = useLocation();
  return TABS.find((t) => t.active(pathname))?.to ?? null;
}

/** 폰 전용(md 미만) 아래 탭 바. 현재 탭은 aria-current 로도 알린다. */
export function TabBar() {
  const current = useActiveTab();
  return (
    <nav aria-label="하단 메뉴" className="border-t border-[var(--color-border)] bg-[var(--color-surface)] pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="mx-auto grid max-w-3xl grid-cols-4">
        {TABS.map((tab) => {
          const on = current === tab.to;
          return (
            <li key={tab.to}>
              <Link
                to={tab.to}
                aria-current={on ? 'page' : undefined}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-xs no-underline ${
                  on ? 'font-bold text-[var(--color-accent)]' : 'text-[var(--color-muted)]'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
