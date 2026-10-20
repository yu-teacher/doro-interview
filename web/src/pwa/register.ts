import { startUpdater } from './updater';

/**
 * 서비스 워커 등록(운영 빌드에서만). 새 서비스 워커는 설치만 하고 대기하며, 적용은 안전한 순간에 updater 가 정한다.
 * 등록·업데이트 실패가 앱을 막지 않는다(서비스 워커는 부가 기능이다).
 */
export async function registerServiceWorker(): Promise<void> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }
  try {
    const { registerSW } = await import('virtual:pwa-register');
    let registration: ServiceWorkerRegistration | undefined;
    const updater = startUpdater({
      checkForUpdate: async () => {
        await registration?.update();
      },
      applyUpdate: () => void updateSW(true),
      isHidden: () => document.visibilityState === 'hidden',
      modalOpen: () => document.querySelector('dialog[open]') !== null,
      addVisibilityListener: (listener) => {
        document.addEventListener('visibilitychange', listener);
        return () => document.removeEventListener('visibilitychange', listener);
      },
      setInterval: (callback, ms) => {
        const id = window.setInterval(callback, ms);
        return () => window.clearInterval(id);
      },
    });
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh: () => updater.markWaiting(),
      onRegisteredSW: (_url, r) => {
        registration = r;
      },
      onRegisterError: (e) => console.error('서비스 워커 등록 실패', e),
    });
  } catch (e) {
    console.error('서비스 워커를 쓸 수 없다', e);
  }
}
