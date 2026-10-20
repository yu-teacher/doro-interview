---
slug: "ioc-16"
topic: "ioc-di"
tier: DEEP
difficulty: 2
title: "순환 의존성을 어떻게 피하거나 해결하나요?"
keywords: ["책임 분리(제3 클래스)", "이벤트로 단방향화", "@Lazy 주입/ObjectProvider", "세터 주입(비권장)", "생성자 주입으로 조기 발견"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/dependencies/factory-collaborators.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/context/annotation/Lazy.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/ObjectProvider.html"]
---
**모범 답변 (30~60초)**
가장 좋은 방법은 설계 변경입니다. 공통 로직을 제3의 클래스로 분리해 A와 B가 모두 그것에 의존하게 하거나, 한쪽이 이벤트를 발행하고 다른 쪽이 구독하는 방식으로 방향을 끊습니다. 임시 대안으로는 한쪽을 세터 주입으로 바꾸는 방법이 있지만 공식 문서는 비권장이라고 합니다. 또 한쪽 주입 지점에 @Lazy를 붙이면 지연 해석 프록시가 주입되어 순환이 풀리고, ObjectProvider로 의존성을 늦게 조회할 수도 있습니다. 생성자 주입을 유지하면 순환이 있을 때 시작 단계에서 바로 실패하기 때문에 문제를 일찍 발견한다는 장점이 있습니다.

- (공식 문서) 세터 주입으로 바꾸는 방법과 그 비권장(collaborators 페이지). `@Lazy`를 `@Autowired`/`@Inject` 주입 지점에 두면 지연 해석 프록시가 만들어져 첫 접근 시 해석되며 `ObjectFactory`/`Provider`의 대안이라고 Javadoc이 설명한다. 단, 대상 빈이 없어도 프록시는 항상 주입되어 호출 시점에야 예외가 난다. `ObjectProvider`는 필요할 때 인스턴스를 가져오는 programmatic 대안이다.
- (실험 확인) 생성자 순환 중 한쪽 생성자 인자에 `@Lazy`를 붙이면 컨텍스트가 정상 기동하고 그 인자는 CGLIB 프록시다.
- (보충) 공통 로직 분리와 이벤트 방식, 그리고 순환 해결책으로 `ObjectProvider`를 쓰는 것은 필자의 실무적 제안이다. 문서가 순환 해결책으로 `ObjectProvider`를 명시한 것은 아니다.
