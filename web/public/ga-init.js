// 구글 애널리틱스의 gtag 정의(공식 스니펫과 같다). gtag.js 는 배열이 아니라 `arguments` 객체가 dataLayer 에 들어오기를 기대하는데,
// 린트 규칙(rest 매개변수 사용)과 맞지 않아 별도 파일로 둔다. 같은 출처의 스크립트라 CSP(script-src 'self')에 걸리지 않는다.
// 이 파일은 사용자가 방문 통계에 동의한 뒤에만 불러온다(src/lib/analytics.ts).
window.dataLayer = window.dataLayer || [];
window.gtag = function gtag() {
  window.dataLayer.push(arguments);
};
