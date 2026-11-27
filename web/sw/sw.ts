/// <reference lib="webworker" />
// 서비스 워커(docs/M2-PLAN.md §6). 빌드 때 vite-plugin-pwa(injectManifest)가 아래 __WB_MANIFEST 에 미리 캐시 목록을 채운다.
//  - 미리 캐시: 빌드 산출물(js·css·html·아이콘·매니페스트)만. API(`${base}api/`)는 서비스 워커를 통과한다 — 로그인·진도·노트가 캐시에 남지 않는다.
//  - 내비게이션: 허용 목록의 앱 경로만, **네트워크 우선(짧은 제한 시간) → 실패하면 미리 캐시된 앱 셸**. 온라인이면 항상 새 index.html 을 받는다
//    (새 해시 자산과 현재 게이트웨이의 헤더·CSP 가 따라온다 — 옛 화면·옛 CSP 고착을 구조적으로 줄인다).
//  - 업데이트: 새 서비스 워커는 설치만 하고 대기한다. 적용(skipWaiting)은 화면이 안전한 순간에 페이지가 메시지로 요청할 때만 한다.
import { cleanupOutdatedCaches, getCacheKeyForURL, matchPrecache, precache } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { navigationAllowlist } from '../src/pwa/allowlist';
import { notificationTarget } from '../src/pwa/notificationTarget';

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: { url: string; revision: string | null }[] };

// 공개 경로는 빌드 때 정해진다(vite.config.ts 의 base). 번들러가 import.meta.env.BASE_URL 을 값으로 바꿔 넣는다.
const BASE = import.meta.env.BASE_URL;
const SHELL = 'index.html';
/** 이 시간 안에 네트워크가 응답하지 않으면 앱 셸로 연다(느린 망에서 빈 화면으로 오래 기다리지 않게). */
const NAVIGATION_TIMEOUT_MS = 3000;

precache(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// 미리 캐시된 **자산**(해시가 들어간 js·css·아이콘)은 캐시에서 바로 준다. 내비게이션은 이 경로에서 제외한다: workbox 의 기본 precacheAndRoute 는
// `${base}` 를 index.html(directoryIndex)에 맞춰 캐시 우선으로 응답해 버려서, 앱의 첫 주소가 옛 셸(옛 CSP 헤더 포함)에 고착된다(docs/M2-PLAN.md F13).
registerRoute(
  ({ request, url }) => request.mode !== 'navigate' && getCacheKeyForURL(url.href) !== undefined,
  async ({ request }) => (await matchPrecache(request)) ?? fetch(request),
);

async function networkFirst(request: Request): Promise<Response> {
  const timeout = new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), NAVIGATION_TIMEOUT_MS));
  try {
    const result = await Promise.race([fetch(request), timeout]);
    if (result !== 'timeout') {
      return result; // 서버가 준 응답은 5xx 라도 그대로 보여 준다(앱 셸로 가리지 않는다)
    }
  } catch {
    // 네트워크 실패: 아래에서 앱 셸로 연다
  }
  return (await matchPrecache(SHELL)) ?? Response.error();
}

registerRoute(new NavigationRoute(({ request }) => networkFirst(request), { allowlist: navigationAllowlist(BASE) }));

self.addEventListener('message', (event) => {
  if ((event.data as { type?: string } | null)?.type === 'SKIP_WAITING') {
    void self.skipWaiting();
  }
});

// 새 서비스 워커가 활성화되면 열려 있는 화면을 바로 제어한다(적용 시점은 위의 메시지가 정한다)
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ---- 복습 알림(웹 푸시). 알림 서비스가 보낸 JSON({title, body, url, tag})으로 알림을 띄우고, 누르면 그 화면을 연다.
const PUSH_FALLBACK = { title: '도로 면접', body: '다시 볼 질문이 있어요', url: '', tag: 'interview-review' };

function pushText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readPush(event: PushEvent): typeof PUSH_FALLBACK {
  if (!event.data) {
    return PUSH_FALLBACK;
  }
  try {
    const data = event.data.json() as Record<string, unknown>;
    return {
      title: pushText(data.title) || PUSH_FALLBACK.title,
      body: pushText(data.body),
      url: pushText(data.url),
      tag: pushText(data.tag) || PUSH_FALLBACK.tag,
    };
  } catch {
    // 형식이 달라도 알림은 띄운다(푸시를 받고 알림을 안 띄우면 브라우저가 구독을 제한할 수 있다)
    return PUSH_FALLBACK;
  }
}

self.addEventListener('push', (event) => {
  const message = readPush(event);
  event.waitUntil(
    self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: new URL('icon-192.png', self.registration.scope).href,
      data: { url: message.url },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data as { url?: unknown } | null;
  const target = notificationTarget(pushText(data?.url), self.registration.scope);
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((client) => client.url.startsWith(self.registration.scope));
      if (open) {
        try {
          await open.focus();
          await open.navigate(target);
          return;
        } catch {
          // 이동하지 못하면 새 창으로 연다
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
