import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchConfig } from '../api/catalog';
import { useApi } from '../hooks/useApi';
import { currentConsent, disableAnalytics, loadAnalytics, saveConsent, sendPageView, subscribeConsent } from '../lib/analytics';

/** 서버가 알려 준 측정 ID(없으면 null). 못 불러와도 화면은 그대로다(통계는 보조 기능). */
export function useAnalyticsId(): string | null {
  const { state } = useApi('config', (signal) => fetchConfig(signal));
  return state.status === 'success' ? state.data.analyticsId : null;
}

export function useConsent() {
  return useSyncExternalStore(subscribeConsent, currentConsent, () => 'unset' as const);
}

/**
 * 방문 통계 동의 배너와 화면 전송. 측정 ID 가 없으면 아무것도 그리지 않고 아무것도 하지 않는다.
 * 동의 전에는 구글 스크립트를 불러오지 않는다. 동의하면 불러오고, 화면이 바뀔 때마다 화면 종류를 알린다.
 */
export function AnalyticsGate() {
  const id = useAnalyticsId();
  const consent = useConsent();
  const { pathname } = useLocation();

  useEffect(() => {
    if (id === null) {
      return;
    }
    if (consent === 'granted') {
      loadAnalytics(id);
      sendPageView(pathname);
    } else if (consent === 'denied') {
      disableAnalytics(id);
    }
  }, [id, consent, pathname]);

  if (id === null || consent !== 'unset') {
    return null;
  }
  return (
    <section
      aria-label="방문 통계 동의"
      className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 px-3 md:bottom-3"
    >
      <div className="mx-auto max-w-3xl rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-lg">
        <p className="text-sm text-[var(--color-text)]">
          방문 통계를 위해 구글 애널리틱스를 사용해도 될까요? 동의하면 어떤 화면을 보는지만 구글로 전송되고 쿠키가 저장됩니다. 질문 내용, 검색어, 로그인 정보는 보내지 않습니다. 거부해도 모든 기능을 그대로 쓸 수 있고,
          나중에 <strong>내 공부</strong>에서 바꿀 수 있습니다.
        </p>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => saveConsent('denied')} className="min-h-11 flex-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4">
            거부
          </button>
          <button type="button" onClick={() => saveConsent('granted')} className="min-h-11 flex-1 rounded-md bg-[var(--color-accent)] px-4 font-semibold text-[var(--color-accent-contrast)]">
            동의
          </button>
        </div>
      </div>
    </section>
  );
}
