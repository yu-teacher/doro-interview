---
slug: "ioc-04"
topic: "ioc-di"
tier: BASIC
difficulty: 1
title: "@Autowired는 어떤 순서로 주입할 빈을 찾나요? (타입 -> 한정자 -> 이름)"
keywords: ["타입 우선", "@Qualifier로 필터링", "@Primary 우선순위", "이름 폴백(마지막)", "@Resource는 이름 기반"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-primary.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/resource.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/NoUniqueBeanDefinitionException.html"]
concepts: [ioc-di]
importance: 3
links: [{to: "ioc-05", kind: FOLLOWUP}, {to: "ioc-19", kind: FOLLOWUP}, {to: "ioc-18", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
@Autowired는 타입 기반입니다. 먼저 주입 지점의 타입에 맞는 후보 빈을 모읍니다. 후보가 여러 개면 @Qualifier는 그 후보를 좁히는 필터로 쓰이고, @Primary나 @Fallback은 단일 값 주입에서 우선할 후보를 정해 줍니다. 한정자, primary, fallback 같은 지표가 전혀 없을 때에 한해 주입 지점의 필드명이나 파라미터명을 빈 이름과 비교하는 이름 폴백이 마지막으로 적용되고, 6.1부터는 파라미터명 매칭에 -parameters 컴파일 옵션이 필요합니다. 그래도 하나로 정해지지 않으면 NoUniqueBeanDefinitionException이 납니다. 반대로 이름이 먼저인 것은 @Resource입니다.

- (공식 문서) @Autowired는 타입 중심이고, 한정자 값은 타입으로 고른 후보 안에서만 좁히는 의미다. 한정자·primary·fallback 같은 다른 지표가 없는 모호한 상황에서 주입 지점 이름(필드명·파라미터명)을 빈 이름이나 별칭과 비교해 같은 이름의 후보를 고른다. 이 이름 매칭은 6.1부터 `-parameters` 컴파일러 플래그가 필요하고, 6.2부터는 이름이 맞으면 전체 타입 매칭을 건너뛰는 빠른 경로가 있다. `@Resource`는 이름으로 특정 컴포넌트를 식별하는 의미다.
- (공식 문서, Javadoc) `NoUniqueBeanDefinitionException`은 하나만 기대했는데 일치하는 후보가 여럿 발견되었을 때 던져진다.
- (실험 확인) 같은 타입 빈이 둘이고 힌트가 없으면 컨텍스트 기동이 `NoUniqueBeanDefinitionException`으로 실패한다. 한정자·primary가 없어도 파라미터명이 빈 이름과 같으면 그 빈이 주입된다. `@Primary` 빈이 있어도 주입 지점의 `@Qualifier("b")`가 지정한 빈이 주입된다.
