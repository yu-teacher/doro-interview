/**
 * 알림을 눌렀을 때 열 주소(서비스 워커가 쓴다). 알림의 주소는 이 앱의 범위 안(같은 출처, 서비스 워커 범위 아래)일 때만 열고,
 * 비었거나 범위 밖이거나 잘못된 주소면 앱 첫 화면(범위)으로 보낸다.
 */
export function notificationTarget(raw: string, scope: string): string {
  if (raw === '') {
    return scope;
  }
  try {
    const base = new URL(scope);
    const target = new URL(raw, base);
    if (target.origin === base.origin && target.pathname.startsWith(base.pathname)) {
      return target.href;
    }
  } catch {
    // 잘못된 주소: 첫 화면으로
  }
  return scope;
}
