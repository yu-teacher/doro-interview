---
slug: "frt-09"
topic: "frontend-react-ts"
tier: DEEP
difficulty: 2
title: "`useEffect`의 정리(cleanup) 함수는 언제 실행되고, 개발 모드에서 이펙트가 두 번 실행되는 이유는 무엇인가요?"
keywords: ["다음 설정 전에 정리", "언마운트 때 마지막 정리", "설정과 정리는 짝", "Strict Mode의 추가 설정·정리"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-24
sources: ["https://react.dev/reference/react/useEffect", "https://react.dev/learn/synchronizing-with-effects", "https://react.dev/reference/react/StrictMode"]
concepts: [react-effects]
importance: 2
links: [{to: "frt-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
정리 함수는 이펙트가 만든 것을 되돌리는 코드입니다. 의존성이 바뀐 커밋 뒤에는 이전 값으로 정리 함수가 먼저 실행되고 이어서 새 값으로 설정 코드가 실행되며, 컴포넌트가 사라질 때도 마지막으로 한 번 실행됩니다. 연결에는 연결 해제, 구독에는 구독 취소, 요청에는 취소 또는 응답 무시가 짝이 됩니다. Strict Mode의 개발 모드에서는 React가 첫 설정 전에 설정과 정리를 한 번 더 돌려 봅니다. 정리가 설정을 제대로 되돌리는지 확인하는 스트레스 테스트이고 프로덕션에는 영향이 없습니다. 공식 문서는 두 번째 실행을 ref로 막기보다 정리 함수를 고치라고 안내합니다.

(공식 문서) useEffect 레퍼런스는 설정 함수가 정리 함수를 반환할 수 있고, 의존성이 바뀐 커밋마다 이전 값으로 정리가 먼저 돈 뒤 새 값으로 설정이 돌며, 컴포넌트가 DOM에서 제거되면 정리가 한 번 더 실행된다고 한다. 개발에서는 첫 실제 설정 앞에 설정과 정리를 한 번 더 돌리며, 사용자가 설정이 한 번 불린 경우와 설정, 정리, 설정 순서를 구별할 수 없어야 한다는 것이 기준이라고 한다. Synchronizing with Effects는 연결에는 해제, 구독에는 취소, fetch에는 취소 또는 무시가 필요하다고 하고, ref로 이펙트가 두 번 도는 것을 막는 것은 흔한 함정이며 필요한 건 한 번만 실행되게 하는 것이 아니라 다시 마운트돼도 동작하는 이펙트라고 한다. StrictMode 레퍼런스는 이 추가 실행이 개발 전용이며 프로덕션 빌드에는 영향이 없다고 한다.
