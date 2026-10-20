---
slug: "pat-08"
topic: "design-pattern"
tier: DEEP
difficulty: 2
title: "템플릿 메서드 패턴은 무엇이고, `JdbcTemplate`이나 `TransactionTemplate`은 그 패턴인가요?"
keywords: ["부모가 흐름을 정의", "서브클래스가 단계 구현", "제어의 역전", "템플릿과 콜백 객체", "서브클래싱 불필요"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/InversionOfControl.html", "https://gameprogrammingpatterns.com/subclass-sandbox.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/jdbc/core/JdbcTemplate.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/programmatic.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/TransactionTemplate.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/support/AbstractPlatformTransactionManager.html"]
---
**모범 답변 (30~60초)**
템플릿 메서드는 상위 클래스가 처리 흐름을 정하고 서브클래스가 일부 단계를 오버라이드해 채우는 패턴이고, Fowler는 이를 제어의 역전의 쉬운 예로 듭니다. 그런데 `JdbcTemplate`과 `TransactionTemplate`은 서브클래스가 아니라 콜백 객체를 넘기는 방식입니다. 스프링 문서는 이 템플릿들이 자원 획득과 해제 같은 반복 흐름을 맡고 개발자는 콜백 인터페이스만 구현하면 되며, `JdbcTemplate`은 서브클래싱할 필요가 없다고 합니다. 반대로 `AbstractPlatformTransactionManager`는 서브클래스가 구현할 템플릿 메서드를 두는 상속 방식입니다.

```java
// 상속 방식: 변하는 단계를 서브클래스가 채운다
abstract class Report { final String render() { return "H|" + body() + "|F"; } abstract String body(); }
// 콜백 방식: 변하는 단계를 호출할 때 넘긴다
class ReportTemplate { String render(Supplier<String> body) { return "H|" + body.get() + "|F"; } }
```

(원저자 자료) Fowler, Inversion Of Control 글: 템플릿 메서드에서는 상위 클래스가 제어 흐름을 정의하고 서브클래스가 메서드를 오버라이드하거나 추상 메서드를 구현해 확장하므로 제어가 역전된다고 하며, JUnit의 `setUp`과 `tearDown`을 예로 든다. Nystrom, "Subclass Sandbox" 장은 템플릿 메서드를 기반 클래스에 메서드가 있고 원시 연산은 파생 클래스가 구현하는 구조로 설명하며 그 반대 역할이 Subclass Sandbox라고 한다.
(공식 문서) `JdbcTemplate` API 문서는 콜백 인터페이스와 `SQLExceptionTranslator`로 매개변수화되므로 서브클래싱할 필요가 없다고 하고, 설정 후에는 스레드 안전하다고 한다. 프로그래밍 방식 트랜잭션 페이지는 `TransactionTemplate`이 `JdbcTemplate` 같은 다른 스프링 템플릿과 같은 방식으로 콜백을 써서 자원 획득·해제 보일러플레이트를 없앤다고 한다. `AbstractPlatformTransactionManager` API 문서는 서브클래스가 begin, suspend, resume, commit, rollback 같은 상태별 템플릿 메서드를 구현한다고 한다.
(실험 확인) 상속 방식과 콜백 방식이 같은 출력 `H|sales|F`를 냈고, 콜백 방식은 같은 템플릿 인스턴스에 호출마다 다른 단계를 넘길 수 있었다(`H|stock|F`).
(보충) 읽은 스프링 문서에서 이 템플릿 클래스를 템플릿 메서드 패턴이라고 직접 부르는 문장은 찾지 못했다. 위 관계는 두 구조를 비교한 해석이다.
