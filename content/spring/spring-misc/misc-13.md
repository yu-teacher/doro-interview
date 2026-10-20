---
slug: "misc-13"
topic: "spring-misc"
tier: TRICKY
difficulty: 3
title: "싱글톤 빈 안에서 요청별 데이터를 어디에 담나요? ThreadLocal은 괜찮나요?"
keywords: ["지역 변수 우선", "request 스코프", "ThreadLocal 정리(remove)", "스레드 풀 재사용", "비동기 전파 문제"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
기본은 메서드 파라미터와 지역 변수로 넘기는 것이고, 그게 가장 안전합니다. 요청 단위 컨텍스트가 꼭 필요하면 request 스코프 빈이나 `ThreadLocal`을 쓰는데, 스프링 Security의 `SecurityContext`도 비슷한 방식으로 현재 요청의 인증 정보를 들고 있습니다. 다만 `ThreadLocal`은 스레드 풀에서 스레드가 재사용되므로 반드시 요청이 끝날 때 정리해야 값이 누수되지 않습니다. 비동기 작업이나 새 스레드로 넘어가면 값이 전파되지 않는 점도 주의해야 합니다.

(공식) Security 문서는 `FilterChainProxy`가 메모리 누수를 피하려고 `SecurityContext`를 비운다고 설명한다. 나머지는 (보충) 일반 지식이다.
