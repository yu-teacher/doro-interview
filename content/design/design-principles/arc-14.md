---
slug: "arc-14"
topic: "design-principles"
tier: TRICKY
difficulty: 3
title: "IoC, DI, DIP는 각각 무엇이고 어떻게 다른가요? 서비스 로케이터와는 어떻게 다른가요?"
keywords: ["제어의 역전은 프레임워크가 호출", "의존성 주입은 조립자가 주입", "서비스 로케이터는 명시적 요청", "DIP는 소스 의존 방향 원칙"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/InversionOfControl.html", "https://martinfowler.com/articles/injection.html", "https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html"]
---
**모범 답변 (30~60초)**
IoC는 제어 흐름이 뒤집히는 일반적인 현상으로, 프레임워크가 내 코드를 호출하는 것을 가리키며 "Don't call us, we'll call you"라는 할리우드 원칙으로도 불립니다. DI는 IoC가 너무 일반적이라 Martin Fowler가 IoC 옹호자들과 논의해 정한 더 구체적인 이름으로, 별도의 조립자가 구현체를 객체에 넣어 주어 객체가 구현체를 직접 만들지 않게 하는 패턴입니다. 서비스 로케이터도 구현에서 분리해 주지만 사용하는 쪽이 로케이터에 명시적으로 요청하고 로케이터에 의존한다는 점이 다릅니다. DIP는 이들과 층위가 다른, 소스 의존이 추상화를 향해야 한다는 설계 원칙입니다.

```java
class ListerDI { ListerDI(Finder f) { ... } }              // 주입: 생성자 시그니처에 의존성이 드러남
class ListerSL { int count() { return Locator.get().find().size(); } }  // 로케이터: 내부에서 요청
```

(원저자 자료) Martin Fowler, "Inversion Of Control"(2005-06-26)은 IoC가 프레임워크의 보편적 특징이고, 내 코드가 프레임워크를 부르는 대신 프레임워크가 내 코드를 부르는 제어의 역전이며 할리우드 원칙(Don't call us, we'll call you)으로도 불린다고 한다. IoC 컨테이너의 부상으로 일반 원리와 DI 같은 특정 방식이 혼동된다고도 적는다.
(원저자 자료) Fowler, "Inversion of Control Containers and the Dependency Injection pattern"(2004-01 공개, 페이지의 최종 개정 2004-01-23)은 컨테이너에서 역전되는 것이 플러그인 구현을 찾는 방식이라고 하고, IoC가 너무 일반적이라 Dependency Injection이라는 이름을 정했다고 한다. 'Service Locator vs Dependency Injection' 절은 둘 다 구현체에서 애플리케이션 코드를 분리하며, 로케이터는 클래스가 메시지로 명시 요청하고 주입은 요청 없이 나타나는 점이 다르고, 로케이터에서는 모든 사용자가 로케이터에 의존한다고 한다. 또 DI가 테스트에 유리하다는 통념에 대해 저자는 둘 다 스텁으로 바꾸기 쉽다고 본다.
(원저자 자료) DIP의 정의는 Martin의 "Solid Relevance"에서 가져왔다.
(실험 확인) JDK 25 `java Ioc.java`에서 `ListerDI`와 `ListerSL` 모두 스텁으로 바꿔 1을 반환했고, 구현을 직접 `new`하는 `ListerNaive`는 바꿀 수 없어 2를 반환했다. 리플렉션으로 본 `ListerDI`의 생성자 파라미터에는 `Finder`가 드러났고 `ListerSL`은 비어 있었다.
(보충) IoC·DI·DIP를 서로 층위가 다른 개념으로 구분해 정리한 것은 위 두 저자의 정의를 나란히 놓은 설명이며, 한 문서가 직접 비교한 것은 아니다.
