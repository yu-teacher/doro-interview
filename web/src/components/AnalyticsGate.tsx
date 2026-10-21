import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchConfig } from '../api/catalog';
import { useApi } from '../hooks/useApi';
import { currentConsent, disableAnalytics, loadAnalytics, sendPageView, subscribeConsent } from '../lib/analytics';

/** 서버가 알려 준 측정 ID(없으면 null). 못 불러와도 화면은 그대로다(통계는 보조 기능). */
export function useAnalyticsId(): string | null {
  const { state } = useApi('config', (signal) => fetchConfig(signal));
  return state.status === 'success' ? state.data.analyticsId : null;
}

export function useConsent() {
  return useSyncExternalStore(subscribeConsent, currentConsent, () => 'unset' as const);
}

/**
 * 방문 통계 전송. 측정 ID 가 없으면 아무것도 하지 않는다. 기본은 켜짐이고(수집 사실은 내 공부 > 방문 통계에 안내), 사용자가 끄면 전송하지 않는다.
 * 화면이 바뀔 때마다 화면 종류(경로 틀)만 알린다.
 */
export function AnalyticsGate() {
  const id = useAnalyticsId();
  const consent = useConsent();
  const { pathname } = useLocation();

  useEffect(() => {
    if (id === null) {
      return;
    }
    if (consent === 'denied') {
      disableAnalytics(id);
    } else {
      loadAnalytics(id);
      sendPageView(pathname);
    }
  }, [id, consent, pathname]);

  return null;
}
