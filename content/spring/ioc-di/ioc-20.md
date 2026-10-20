---
slug: "ioc-20"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "싱글톤 빈의 지연 초기화(lazy)와 시작 시점 오류 검출은 어떤 관계인가요?"
keywords: ["eager 기본", "fail-fast", "시작 비용 vs 조기 발견", "lazy는 첫 사용 시 실패"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
싱글톤은 기본적으로 컨테이너 시작 시 미리 인스턴스화됩니다. 덕분에 설정 오류나 순환 의존, 누락된 빈이 컨텍스트가 만들어질 때 바로 드러납니다. 대신 시작 시간과 메모리를 쓰는 비용이 있습니다. 지연 초기화를 켜면 이를 줄일 수 있지만, 그 빈의 문제는 처음 요청될 때에야 드러납니다.

- (공식 문서) 의존성 페이지의 "How Failures Surface" 설명 내용이다.
