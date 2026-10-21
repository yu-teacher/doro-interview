import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAnalyticsId, useConsent } from '../components/AnalyticsGate';
import { Segmented } from '../components/Segmented';
import { saveConsent } from '../lib/analytics';
import { readTheme, saveTheme, type Theme } from '../lib/theme';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { minePath, skimPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

const ROW = 'flex min-h-14 items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 no-underline';

/** 내 공부(F0): 로그인한 사람의 개인 공간으로 가는 입구 — 내 질문, 현황, 훑기, 로그인/로그아웃. */
export function MeHubPage() {
  useDocumentTitle('내 공부');
  const session = useSessionKey();
  const { state, refresh, logout } = useSession();
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  const analyticsId = useAnalyticsId();
  const consent = useConsent();
  return (
    <div>
      <h1 className="text-2xl font-bold">내 공부</h1>
      {!session.ready ? (
        <p role="status" className="py-8 text-center text-[var(--color-muted)]">
          불러오는 중…
        </p>
      ) : state.status === 'error' ? (
        <div role="alert" className="mt-4">
          <p>로그인 상태를 확인하지 못했습니다.</p>
          <button type="button" onClick={refresh} className="mt-2 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
            다시 시도
          </button>
        </div>
      ) : (
        <>
          {!session.authenticated && (
            <p className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              로그인하면 학습 체크, 진도, 시험 기록, 내 질문을 쓸 수 있습니다.{' '}
              <a href={loginUrl('/me')} className="inline-flex min-h-11 items-center font-semibold">
                로그인
              </a>
            </p>
          )}
          <ul className="mt-4 space-y-2">
            {session.authenticated && (
              <>
                <li>
                  <Link to={minePath()} className={ROW}>
                    <span className="font-semibold text-[var(--color-text)]">내 질문</span>
                    <span className="text-sm text-[var(--color-muted)]">강사님이 짚어 준 질문 등</span>
                  </Link>
                </li>
                <li>
                  <Link to="/stats" className={ROW}>
                    <span className="font-semibold text-[var(--color-text)]">내 현황</span>
                    <span className="text-sm text-[var(--color-muted)]">진도·정답률·다시 공부 후보</span>
                  </Link>
                </li>
              </>
            )}
            <li>
              <Link to={skimPath()} className={ROW}>
                <span className="font-semibold text-[var(--color-text)]">주제별 훑기</span>
                <span className="text-sm text-[var(--color-muted)]">기록 없이 가볍게</span>
              </Link>
            </li>
          </ul>
          <section aria-labelledby="theme-heading" className="mt-6">
            <h2 id="theme-heading" className="mb-2 font-bold">
              화면 색
            </h2>
            <Segmented
              label="화면 색"
              value={theme}
              onChange={(next) => {
                setTheme(next);
                saveTheme(next);
              }}
              options={[
                { value: 'system' as const, label: '시스템 설정' },
                { value: 'light' as const, label: '밝게' },
                { value: 'dark' as const, label: '어둡게' },
              ]}
            />
          </section>
          {analyticsId !== null && (
            <section aria-labelledby="stats-heading" className="mt-6">
              <h2 id="stats-heading" className="mb-1 font-bold">
                방문 통계
              </h2>
              <p className="mb-2 text-sm text-[var(--color-muted)]">방문 통계를 위해 구글 애널리틱스를 사용합니다. 어떤 화면을 보는지만 구글로 전송되고 쿠키가 저장되며, 질문 내용·검색어·로그인 정보는 보내지 않습니다. 끄면 전송을 멈추고 쿠키를 지웁니다.</p>
              <Segmented
                label="방문 통계"
                value={consent === 'denied' ? 'denied' : 'granted'}
                onChange={(next) => saveConsent(next)}
                options={[
                  { value: 'granted' as const, label: '켜기' },
                  { value: 'denied' as const, label: '끄기' },
                ]}
              />
            </section>
          )}
          {session.authenticated && (
            <button type="button" onClick={() => void logout()} className="mt-6 min-h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
              로그아웃
            </button>
          )}
        </>
      )}
    </div>
  );
}
