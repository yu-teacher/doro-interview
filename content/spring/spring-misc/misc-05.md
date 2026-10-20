---
slug: "misc-05"
topic: "spring-misc"
tier: BASIC
difficulty: 1
title: "Checked 예외와 Unchecked 예외, 스프링은 어떤 철학을 갖고 있나요?"
keywords: ["DataAccessException", "예외 번역", "공통 예외 처리", "롤백 기본 규칙", "rollbackFor"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
Checked 예외는 컴파일러가 처리를 강제하고, Unchecked(RuntimeException)는 강제하지 않습니다. 스프링은 데이터 접근 계층의 `SQLException` 같은 checked 예외를 `DataAccessException` 계열의 unchecked 예외로 바꿔서 던지는 철학을 택했습니다. 호출 계층 전체에 `throws`가 번지는 것을 막고, 복구할 수 없는 예외는 최상단 공통 처리기, 즉 `@RestControllerAdvice`에서 한 번에 처리하게 하려는 것이죠. 그리고 트랜잭션 쪽 중요한 포인트가 있는데, `@Transactional`은 기본적으로 RuntimeException과 Error에서만 롤백하고 checked 예외에서는 커밋합니다. checked 예외에도 롤백하려면 `rollbackFor`를 지정해야 합니다.

(보충) 이 답변은 필자의 일반 지식이며 이번 조사에서 공식 페이지를 직접 확인하지 않았다. 데모 프로젝트는 `NotFoundException`, `IllegalArgumentException` 등 unchecked 예외로 서비스 계층 오류를 표현한다.

```java
@Transactional(rollbackFor = Exception.class)   // checked 예외도 롤백
public void register() throws IOException { ... }
```
