import { matchPath } from 'react-router-dom';
import { BASE_PATH } from '../config';
import { APP_ROUTE_PATHS } from '../routes';

/**
 * 방문 통계(구글 애널리틱스 4, 선택). 원칙: ① 측정 ID 가 설정돼 있고 ② 사용자가 **동의한 뒤에만** 스크립트를 불러온다(동의 전에는 구글로 아무것도 가지 않는다).
 * ③ 보내는 것은 화면 종류뿐이다: 주소는 `/q/:slug`·`/quiz/:id` 같은 **경로 틀**로 바꾸고 쿼리(검색어·필터)는 버린다. 페이지 제목·질문 내용·사용자 id 는 보내지 않는다.
 * ④ 광고용 신호·개인 맞춤 광고는 끈다. 동의를 거두면 이후 전송을 끄고 GA 쿠키를 지운다.
 */
export type Consent = 'granted' | 'denied' | 'unset';

const KEY = 'interview.analytics';
const loaded = new Set<string>();
const listeners = new Set<() => void>();

export function readConsent(): Consent {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'granted' || v === 'denied' ? v : 'unset';
  } catch {
    return 'unset'; // 저장소를 못 쓰면 기억하지 못하니 매번 묻되, 동의 없이는 아무것도 보내지 않는다
  }
}

let memory: Consent | null = null;

/** 저장소를 못 쓰는 환경에서도 이번 방문에는 선택이 유지되게 메모리에도 둔다. */
export function currentConsent(): Consent {
  const stored = readConsent();
  return stored !== 'unset' ? stored : (memory ?? 'unset');
}

export function saveConsent(consent: Exclude<Consent, 'unset'>): void {
  memory = consent;
  try {
    window.localStorage.setItem(KEY, consent);
  } catch {
    // 저장하지 못해도 이번 방문에는 적용된다
  }
  listeners.forEach((l) => l());
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** 테스트용: 메모리 상태 초기화(동의 메모리, 구독, 불러온 기록) */
export function resetConsentMemoryForTest(): void {
  memory = null;
  listeners.clear();
  loaded.clear();
}

/** 실제 주소를 경로 틀로 바꾼다(`/q/tx-04` → `/q/:slug`). 모르는 주소는 `/other`. 쿼리는 애초에 받지 않는다. */
export function templatePath(pathname: string): string {
  const bare = pathname.replace(/\/+$/, '') || '/';
  for (const pattern of APP_ROUTE_PATHS) {
    if (matchPath({ path: pattern, end: true }, bare)) {
      return pattern;
    }
  }
  return '/other';
}

type Gtag = (...args: unknown[]) => void;
interface GaWindow extends Window {
  dataLayer?: unknown[];
  gtag?: Gtag;
}

/** 스크립트를 한 번만 불러온다. 동의한 뒤에만 부른다. */
export function loadAnalytics(id: string): void {
  const w = window as GaWindow;
  (w as unknown as Record<string, unknown>)[`ga-disable-${id}`] = false;
  if (loaded.has(id)) {
    return;
  }
  loaded.add(id);
  // gtag 정의(public/ga-init.js)를 먼저 불러온 뒤 설정하고 gtag.js 를 불러온다. 정의 파일을 못 받으면 아무것도 보내지 않는다.
  const init = document.createElement('script');
  init.src = `${BASE_PATH}/ga-init.js`;
  init.onload = () => {
    w.gtag?.('js', new Date());
    w.gtag?.('config', id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    sendPageView(window.location.pathname.replace(new RegExp(`^${BASE_PATH}`), '') || '/');
  };
  document.head.appendChild(init);
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(script);
}

/** 화면 하나를 봤다고 알린다. 제목·주소는 경로 틀로 덮어써 검색어나 질문 id 가 나가지 않게 한다. */
export function sendPageView(pathname: string): void {
  const w = window as GaWindow;
  if (!w.gtag) {
    return;
  }
  const path = templatePath(pathname);
  w.gtag('event', 'page_view', { page_path: path, page_title: path, page_location: `${window.location.origin}${path}` });
}

/** 동의를 거둔다: 이후 전송을 끄고 GA 쿠키(_ga, _ga_*)를 지운다. 이미 불러온 스크립트는 그대로지만 아무것도 보내지 않는다. */
export function disableAnalytics(id: string): void {
  (window as unknown as Record<string, unknown>)[`ga-disable-${id}`] = true;
  for (const cookie of document.cookie.split(';')) {
    const name = cookie.split('=')[0].trim();
    if (name === '_ga' || name.startsWith('_ga_')) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    }
  }
}
