---
slug: "ioc-19"
topic: "ioc-di"
tier: TRICKY
difficulty: 3
title: "@Resource와 @Autowired는 무엇이 다른가요?"
keywords: ["타입 기반 vs 이름 기반", "JSR-250", "적용 위치 차이", "required 유무"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired-qualifiers.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/resource.html", "https://docs.spring.io/spring-framework/reference/core/beans/annotation-config/autowired.html"]
---
**모범 답변 (30~60초)**
@Autowired는 스프링 애노테이션으로 타입 기반이고, 한정자 값은 타입으로 고른 후보 안에서 좁히는 보조 수단입니다. @Resource는 JSR-250 표준으로 이름 기반이며 name으로 지정한 빈을 찾습니다. name을 생략하면 필드명이나 세터의 프로퍼티명을 이름으로 삼고, 그 이름의 빈이 없을 때만 타입 매칭으로 폴백합니다. 적용 위치도 달라서 @Autowired는 필드, 생성자, 다중 인자 메서드에 쓸 수 있고 required 속성이 있지만, @Resource는 필드와 단일 인자 세터에만 쓸 수 있습니다. 생성자나 다중 인자 메서드에서 한정이 필요하면 @Autowired와 @Qualifier를 조합합니다.

- (공식 문서) 한정자 페이지의 두 애노테이션 비교(`@Resource`는 이름으로 특정 컴포넌트를 식별하고 선언 타입은 매칭에 무관한 의미, `@Autowired`는 타입으로 후보를 고른 뒤 한정자를 그 안에서만 적용)와 @Resource 페이지(`name` 속성, 이름 생략 시 필드명·프로퍼티명 사용, 이름 없는 경우에 한해 타입 매칭으로 폴백)다. `@Autowired`는 필드·생성자·다중 인자 메서드, `@Resource`는 필드와 단일 인자 빈 프로퍼티 세터에만 지원된다.
