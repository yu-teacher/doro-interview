---
slug: "arc-11"
topic: "design-principles"
tier: DEEP
difficulty: 2
title: "Spring Modulith는 애플리케이션 모듈 경계를 어떻게 정의하고 검증하나요?"
keywords: ["모듈은 메인 패키지의 직접 하위 패키지", "public 타입이 모듈 API", "순환 의존 금지", "내부 패키지 접근 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-modulith/reference/fundamentals.html", "https://docs.spring.io/spring-modulith/reference/verification.html"]
---
**모범 답변 (30~60초)**
Spring Modulith에서 애플리케이션 모듈은 다른 모듈에 노출하는 API와 접근하면 안 되는 내부 구현, 그리고 다른 모듈의 API를 참조하는 부분으로 이루어진 기능 단위입니다. 기본적으로 메인 애플리케이션 클래스가 있는 패키지의 직접 하위 패키지 하나가 모듈이고, 그 패키지의 public 타입이 API이며 그 아래 하위 패키지는 내부로 간주됩니다. `ApplicationModules.of(...).verify()`는 모듈 간 순환 의존이 없는지, 다른 모듈의 내부 패키지를 참조하지 않는지를 검사하고, `allowedDependencies`로 허용 의존을 제한할 수도 있습니다. 내부 타입이 public이면 컴파일러가 잘못된 참조를 막아 주지 못한다고 문서가 설명하고, 레거시용 open 모듈에서는 내부 의존이 허용됩니다.

(공식 문서) Spring Modulith 참조 문서(사이드바에 Stable 2.1.1 표기) Fundamentals 페이지의 Application Modules, Simple Application Modules, Advanced Application Modules 절은 위 정의와 기본 규칙을 설명한다. 단순한 모듈에서는 Java 패키지 스코프로 타입을 숨길 수 있고, 하위 패키지가 있는 모듈은 API 패키지와 내부 패키지로 나뉘며, 이때 내부 하위 패키지의 타입이 public이어야 하는 경우 Java 컴파일러가 잘못된 참조를 막지 못한다고 밝힌다. 중첩 모듈은 1.3부터라고 하고, open 모듈은 `@ApplicationModule(type = Type.OPEN)`으로 선언하며 Verification 페이지는 open 모듈 내부로의 의존은 허용된다고 밝힌다.
(공식 문서) Verifying Application Module Structure 페이지는 `verify()`의 규칙으로 모듈 수준 순환 금지(방향 비순환 그래프), API 패키지를 통한 모듈 외부 접근만 허용, 선택적인 `@ApplicationModule(allowedDependencies = ...)` 허용 목록을 든다. 위반이 있으면 예외를 던지며 `detectViolations()`로 위반을 따로 다룰 수 있다. Spring 프로젝트를 실행해 확인하지는 않았고 문서 근거만으로 적었다.
