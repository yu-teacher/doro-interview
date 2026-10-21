import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, userMessage } from '../api/client';
import { resetProgress } from '../api/quiz';
import { Segmented } from '../components/Segmented';
import { Sheet } from '../components/Sheet';
import { readTheme, saveTheme, type Theme } from '../lib/theme';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { minePath, skimPath } from '../routes';
import { loginUrl, useSession, useSessionKey } from '../session/SessionProvider';

const ROW = 'flex min-h-14 items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 no-underline';

/** 내 공부(F0): 로그인한 사람의 개인 공간으로 가는 입구 — 내 질문, 현황, 훑기, 로그인/로그아웃. */
export function MeHubPage() {
  useDocumentTitle('내 공부');
  const session = useSessionKey();
  const { state, refresh, logout, markAnonymous } = useSession();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const [theme, setTheme] = useState<Theme>(() => readTheme());
  async function reset() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      await resetProgress();
      setConfirming(false);
      setResetMessage({ ok: true, text: '학습 현황을 초기화했습니다.' });
    } catch (e) {
      if (e instanceof ApiError && e.isUnauthorized) {
        markAnonymous();
      }
      setConfirming(false);
      setResetMessage({ ok: false, text: e instanceof ApiError ? userMessage(e) : '지금은 초기화할 수 없습니다. 잠시 뒤에 다시 시도해 주세요.' });
    } finally {
      setBusy(false);
    }
  }

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
          {session.authenticated && (
            <section aria-labelledby="reset-heading" className="mt-6">
              <h2 id="reset-heading" className="mb-1 font-bold">
                학습 현황 초기화
              </h2>
              <p className="mb-2 text-sm text-[var(--color-muted)]">학습 체크와 시험 기록·통계를 지우고 처음부터 다시 시작합니다. 노트와 내 질문은 남습니다.</p>
              <button
                ref={resetButton}
                type="button"
                onClick={() => {
                  setResetMessage(null);
                  setConfirming(true);
                }}
                className="min-h-11 rounded-md border border-[var(--color-extra)] bg-[var(--color-surface)] px-4 text-[var(--color-extra)]"
              >
                학습 현황 초기화…
              </button>
              {resetMessage && (
                <p role={resetMessage.ok ? 'status' : 'alert'} className={`mt-2 ${resetMessage.ok ? 'text-[var(--color-text)]' : 'text-[var(--color-extra)]'}`}>
                  {resetMessage.text}
                </p>
              )}
              <Sheet open={confirming} title="학습 현황을 초기화할까요?" onClose={() => setConfirming(false)} returnFocusTo={resetButton}>
                <p>아래 내용이 지워지고 되돌릴 수 없습니다.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>학습 체크(진도)</li>
                  <li>시험 기록과 통계, 다시 공부 후보</li>
                </ul>
                <p className="mt-3 text-sm text-[var(--color-muted)]">노트, 내 질문, 설정은 그대로 남습니다.</p>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => setConfirming(false)} className="min-h-11 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={() => void reset()}
                    disabled={busy}
                    className="min-h-11 flex-1 rounded-md bg-[var(--color-extra)] px-4 font-semibold text-[var(--color-accent-contrast)] disabled:opacity-60"
                  >
                    {busy ? '지우는 중…' : '초기화'}
                  </button>
                </div>
              </Sheet>
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
