import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchConfig } from '../api/catalog';
import { useApi } from '../hooks/useApi';
import { loadAnalytics, sendPageView } from '../lib/analytics';

/** 서버가 알려 준 측정 ID(없으면 null). 못 불러와도 화면은 그대로다(통계는 보조 기능). */
export function useAnalyticsId(): string | null {
  const { state } = useApi('config', (signal) => fetchConfig(signal));
  return state.status === 'success' ? state.data.analyticsId : null;
}

/**
 * 방문 통계 전송. 측정 ID 가 있으면 항상 켜져 있고(화면에 안내·스위치 없음, 결정 2026-10-21), 화면이 바뀔 때마다 화면 종류(경로 틀)만 알린다.
 */
export function AnalyticsGate() {
  const id = useAnalyticsId();
  const { pathname } = useLocation();

  useEffect(() => {
    if (id !== null) {
      loadAnalytics(id);
      sendPageView(pathname);
    }
  }, [id, pathname]);

  return null;
}
