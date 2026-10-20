---
slug: "ioc-03"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "생성자가 하나뿐이면 @Autowired를 안 붙여도 되나요? 생성자가 여러 개면요?"
keywords: ["단일 생성자 암묵 주입", "required=true는 하나만", "required=false 다수 시 가장 많이 만족하는 생성자"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html"]
---
**모범 답변 (30~60초)**
생성자가 하나뿐이면 스프링이 그 생성자를 항상 사용하므로 @Autowired를 생략해도 됩니다. 생성자가 여러 개일 때는 @Autowired로 쓸 생성자를 표시해야 하고, required=true인 생성자는 하나만 허용됩니다. 여러 개를 표시하려면 모두 required=false여야 하고, 그 경우 스프링은 컨테이너의 빈으로 만족시킬 수 있는 의존성이 가장 많은 생성자를 고릅니다. 후보를 하나도 만족시키지 못하거나, 여러 생성자 중 표시된 것이 없을 때는 primary/default 생성자가 있으면 그것을 사용합니다. 표시된 생성자는 public이 아니어도 됩니다.

- (공식 문서) autowired 페이지의 생성자 해석 규칙이다. 생성자가 여러 개이고 primary/default 생성자가 없으면 최소 하나에 @Autowired가 있어야 한다. 단일 생성자는 애노테이션이 없어도 항상 사용된다. 단일 생성자 상황에서는 배열·컬렉션·맵 인자가 매칭 빈이 없으면 빈 인스턴스로 해석되는 특례가 있다.
- (실험 확인) `@Autowired` 없는 단일 생성자 빈에 컨테이너가 의존성을 주입한다.
