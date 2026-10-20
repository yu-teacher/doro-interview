---
slug: "mvc-06"
topic: "spring-mvc"
tier: BASIC
difficulty: 1
title: "Content Negotiation은 어떻게 동작하나요?"
keywords: ["Accept 헤더", "produces", "consumes", "ContentNegotiationConfigurer"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"클라이언트가 원하는 응답 형식을 서버가 정하는 과정입니다. Spring MVC는 기본적으로 `Accept` 헤더만 보고 요청 미디어 타입을 결정합니다. 필요하면 쿼리 파라미터 방식 같은 다른 전략을 켤 수 있고, 문서는 URL 기반을 써야 한다면 경로 확장자보다 쿼리 파라미터를 권장합니다. 매핑 쪽에서는 `produces`/`consumes`로 처리 가능한 미디어 타입을 좁힐 수 있어서, 같은 URL이라도 Accept에 따라 다른 메서드로 갈 수 있습니다."

- (공식 문서) 기본은 `Accept` 헤더만 사용, 쿼리 파라미터·경로 확장자는 선택 가능(쿼리 파라미터 권장), `ContentNegotiationConfigurer.mediaType(..)`으로 키-미디어타입 매핑. `consumes`는 요청 `Content-Type`, `produces`는 `Accept`로 매핑을 좁히며 `!text/plain` 같은 부정 표현을 지원합니다. 메서드 레벨 설정이 클래스 레벨을 병합하지 않고 덮어씁니다.
- (보충) 쿼리 파라미터 전략 활성화는 `favorParameter`류 설정이지만 이번 문서에서 정확한 메서드를 확인하지 못했습니다.
