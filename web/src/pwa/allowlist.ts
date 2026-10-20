import { APP_ROUTE_PATHS } from '../routes';

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * 서비스 워커가 앱 셸로 응답해도 되는 내비게이션 주소(허용 목록). workbox 의 NavigationRoute 는 `pathname + search` 를 이 규칙에 대 보므로,
 * 필터가 쿼리로 남는 주소(`/t/transaction?tier=DEEP`)도 맞아야 한다 — 그래서 끝에 선택적 쿼리를 허용한다. `/interview/api/…`(로그인·콜백 이동 포함)와 `/interview/assets/…` 는
 * 목록에 없어서 서비스 워커가 가로채지 않는다: 로그인 이동은 BFF 의 302 가 그대로 가야 하고, 없는 해시 파일은 404 로 남아야 한다.
 * 거부 목록이 아니라 허용 목록이다 — 새 경로가 생겨도 기본은 "가로채지 않음" 이다.
 */
export function navigationAllowlist(base: string): RegExp[] {
  const root = escape(base.replace(/\/+$/, ''));
  return APP_ROUTE_PATHS.map((path) => {
    const body = path === '/' ? '' : path.split('/').filter(Boolean).map((seg) => (seg.startsWith(':') ? '[^/?]+' : escape(seg))).join('/');
    return new RegExp(`^${root}/${body}${body ? '/?' : ''}(?:\\?.*)?$`);
  });
}

/** `pathAndSearch` 는 주소의 경로와 쿼리(예: `/interview/t/a?tier=DEEP`). */
export function isAppNavigation(pathAndSearch: string, base: string): boolean {
  return navigationAllowlist(base).some((re) => re.test(pathAndSearch));
}
