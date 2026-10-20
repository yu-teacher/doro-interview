---
slug: "misc-11"
topic: "spring-misc"
tier: DEEP
difficulty: 2
title: "`@Transactional`이 동작하지 않을 때 원인을 어떻게 찾나요?"
keywords: ["프록시", "self-invocation", "접근 제어자", "예외 삼킴", "롤백 규칙", "트랜잭션 로그", "`isActualTransactionActive`"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
`@Transactional`은 프록시 기반 AOP라서 "프록시를 거치지 않는 호출"이면 적용되지 않습니다. 그래서 순서대로 점검합니다. 첫째, 같은 클래스 안에서 `this.method()`로 호출하는 self-invocation인지. 둘째, 빈이 아닌 `new`로 만든 객체인지. 셋째, 메서드가 private이거나 final이라 프록시가 가로채지 못하는지(프록시 방식에 따라 다름). 넷째, 예외를 catch로 삼켜서 롤백 트리거가 사라졌거나, checked 예외라 커밋된 것은 아닌지. 다섯째, `readOnly=true`나 전파 속성(`REQUIRES_NEW` 등)을 잘못 쓴 것은 아닌지. 마지막으로 `org.springframework.transaction` 로그를 DEBUG로 켜고 "Creating new transaction" 메시지가 찍히는지 확인하거나, 현재 트랜잭션 활성 여부를 `TransactionSynchronizationManager.isActualTransactionActive()`로 찍어 봅니다. 데모의 `MemberService`는 클래스에 `readOnly=true`를 두고 쓰기 메서드에만 `@Transactional`을 덮어쓰는데, 이 구조를 모르고 쓰기 메서드의 어노테이션을 빼면 쓰기가 반영되지 않을 수 있습니다.

```yaml
logging:
  level:
    org.springframework.transaction.interceptor: TRACE
    org.springframework.orm.jpa: DEBUG
```

(보충) 이 점검 순서는 필자의 일반 지식을 정리한 것이며 이번 조사에서 공식 트랜잭션 문서를 직접 확인하지 않았다.
