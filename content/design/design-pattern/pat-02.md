---
slug: "pat-02"
topic: "design-pattern"
tier: BASIC
difficulty: 1
title: "스프링의 싱글톤 빈은 GoF 싱글톤 패턴과 같은 건가요?"
keywords: ["컨테이너·빈 정의 단위", "클래스로더당 하나(GoF)", "스코프는 설정으로 선택", "상태 없는 빈에 싱글톤", "프로토타입 스코프"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/BeanFactory.html"]
concepts: [gof-patterns, bean-lifecycle]
importance: 3
links: [{to: "pat-24", kind: FOLLOWUP}, {to: "ioc-06", kind: RELATED}, {to: "misc-01", kind: RELATED}]
---
**모범 답변 (30~60초)**
아닙니다. 스프링 문서가 직접 둘은 다르다고 밝힙니다. GoF 싱글톤은 클래스 코드에 인스턴스 수를 못 박아 클래스로더당 하나만 만들어지는 반면, 스프링 싱글톤은 컨테이너 하나, 빈 정의 하나당 인스턴스가 하나입니다. 그래서 스코프는 클래스에 박혀 있지 않고 설정으로 고를 수 있고, 같은 클래스도 스코프를 프로토타입으로 바꾸면 요청마다 새 인스턴스가 만들어집니다. 문서는 상태를 가진 빈에는 프로토타입, 상태 없는 빈에는 싱글톤을 쓰는 것을 일반 규칙으로 안내합니다.

(공식 문서) Bean Scopes 페이지는 스프링의 싱글톤 빈 개념이 GoF 책의 싱글톤과 다르다고 하고, GoF 싱글톤은 객체의 스코프를 하드코딩해 클래스로더당 한 인스턴스만 만들어지는 반면 스프링 싱글톤은 컨테이너·빈 단위라고 설명한다. 싱글톤이 기본 스코프이며, 상태 있는 빈에는 프로토타입을, 상태 없는 빈에는 싱글톤을 쓰는 것이 일반 규칙이라고 한다. `BeanFactory` API 문서는 팩토리 범위의 단일 공유 인스턴스를 싱글톤 패턴의 우수한 대안이라고 표현한다.
(실험 확인) `private` 생성자와 `static` 필드를 쓰는 고전적 싱글톤 클래스를 두 개의 `URLClassLoader`로 각각 로드해 `get()`을 호출했다. 같은 로더에서는 두 번 호출해도 같은 객체였고, 서로 다른 로더에서는 다른 객체(클래스 자체도 다름)였다(Corretto 25.0.3). 즉 GoF식 싱글톤의 단위는 클래스로더이고 스프링 싱글톤의 단위는 컨테이너 안의 빈 정의다. 스프링 컨테이너 자체는 실행하지 않았다.
