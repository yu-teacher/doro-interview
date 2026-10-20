---
slug: "misc-05"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "Checked 예외와 Unchecked 예외, 스프링은 어떤 철학을 갖고 있나요?"
keywords: ["DataAccessException", "예외 번역", "공통 예외 처리", "롤백 기본 규칙", "rollbackFor"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/data-access/dao.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html", "https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-controller/ann-advice.html"]
concepts: [exception-handling, rollback-rules]
importance: 2
links: [{to: "jl-06", kind: RELATED}, {to: "tx-08", kind: RELATED}, {to: "mvc-10", kind: RELATED}]
---
**모범 답변 (30~60초)**
Checked 예외는 컴파일러가 처리를 강제하고, Unchecked(RuntimeException)는 강제하지 않습니다. 스프링은 `SQLException` 같은 기술별 예외를 `DataAccessException`을 루트로 하는 런타임 예외 계층으로 번역합니다. 그래서 DAO마다 catch-and-throw나 `throws` 선언을 반복하지 않고, 복구할 수 없는 예외는 상위 계층에서 한 번에 처리합니다. 웹에서는 `@RestControllerAdvice`의 `@ExceptionHandler`가 그 자리입니다. 트랜잭션에서 중요한 점은, 기본 설정에서는 RuntimeException과 Error일 때만 롤백하고 checked 예외는 롤백하지 않는다는 것입니다. checked 예외에도 롤백하려면 `rollbackFor`를 지정해야 합니다.

```java
@Transactional(rollbackFor = Exception.class)   // checked 예외도 롤백
public void register() throws IOException { ... }
```

(공식 문서) DAO 지원 문서는 스프링이 `SQLException` 같은 기술별 예외를 `DataAccessException`을 루트로 하는 자체 예외 계층으로 번역하며, 원래 예외를 감싸므로 정보가 유실되지 않는다고 설명한다. JPA·Hibernate 예외도 "초점이 분명한 런타임 예외"로 바뀌므로 복구 불가능한 영속성 예외를 적절한 계층에서만 처리하고 DAO에는 catch-and-throw 보일러플레이트와 예외 선언이 필요 없다고 한다(필요한 곳에서 직접 잡을 수도 있다). 롤백 규칙 문서는 기본 설정에서 트랜잭션 인프라가 런타임(unchecked) 예외, 즉 `RuntimeException`과 그 하위 클래스일 때 롤백 표시를 하고, `Error`도 기본적으로 롤백한다고 한다. 트랜잭션 메서드에서 던진 checked 예외는 기본 설정에서 롤백을 일으키지 않으며, checked 예외를 포함해 어떤 예외가 롤백을 일으킬지는 롤백 규칙(`rollbackFor`/`noRollbackFor` 등)으로 지정한다. 위 `rollbackFor = Exception.class` 예시는 이 규칙의 사용 예이며, 문서는 `rollbackFor`가 지정한 타입과 그 하위 타입에 매칭된다고 설명한다. `@RestControllerAdvice`는 `@ControllerAdvice`에 `@ResponseBody`를 합친 축약이고 `@ExceptionHandler` 메서드를 모든 컨트롤러에 적용할 수 있다고 문서가 설명한다.

(보충) "예외 번역으로 `throws` 확산을 막고 최상단 공통 처리기에서 한 번에 처리한다"는 설계 의도의 연결은 위 문서들을 묶은 일반적인 정리다.
