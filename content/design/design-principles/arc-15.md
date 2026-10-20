---
slug: "arc-15"
topic: "design-principles"
tier: TRICKY
difficulty: 3
title: "빈약한 도메인 모델(Anemic Domain Model)은 왜 안티패턴이라 하나요? 서비스에 로직이 있으면 무조건 문제인가요?"
keywords: ["데이터 주머니와 서비스에 몰린 로직", "절차적 설계", "도메인 모델의 비용만 치름", "얇은 서비스 계층"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://martinfowler.com/bliki/AnemicDomainModel.html", "https://www.domainlanguage.com/ddd/reference/"]
concepts: [ddd]
importance: 1
links: [{to: "arc-10", kind: PREREQ}, {to: "arc-05", kind: PREREQ}]
---
**모범 답변 (30~60초)**
빈약한 도메인 모델은 도메인 객체가 이름만 도메인 명사일 뿐 getter와 setter만 가진 데이터 주머니이고, 모든 도메인 로직이 서비스 객체에 몰려 있는 구조입니다. Martin Fowler는 이것이 데이터와 처리를 합친다는 객체지향의 기본 취지에 어긋나는 절차적 설계이며, 도메인 모델의 비용인 O/R 매핑은 다 치르면서 이점은 얻지 못한다고 비판합니다. 다만 그는 도메인 모델이 항상 최선의 도구는 아니라고도 말하고, 서비스 계층 자체는 문제가 아니라 얇게 유지하며 풍부한 도메인 모델과 함께 써야 한다고 합니다. 로직이 서비스에 많을수록 모델의 이점을 잃기 쉽다는 것이 요지입니다.

```java
class Account {                                  // 규칙이 객체 안에 있으면 어느 경로로 호출해도 적용된다
    void withdraw(long amt) { if (amt > balance) throw new IllegalStateException("insufficient"); balance -= amt; }
}
```

(원저자 자료) Martin Fowler, "Anemic Domain Model"(2003-11-25). 글은 이 안티패턴의 증상을 명사 이름의 객체들이 풍부한 관계를 갖지만 행동이 거의 없어 getter·setter 주머니이고, 로직은 모두 서비스 객체에 있는 것이라고 설명한다. 저자는 이것이 데이터와 처리를 합친다는 객체지향의 기본 취지에 어긋나는 절차적 스타일이라고 하며, 결정적 문제는 도메인 모델의 모든 비용(특히 O/R 매핑 계층)을 치르면서 이점을 얻지 못하고 사실상 Transaction Script가 된다는 점이라고 주장한다. 또 도메인 모델이 항상 최선의 도구는 아니라고 하고, 도메인 객체에 도메인 로직을 두는 것은 계층 분리와 모순되지 않으며, 서비스 계층은 글이 인용한 Evans의 서술처럼 얇게 유지하고 풍부한 도메인 모델과 함께 써야 한다고 한다. 서비스에 행동이 많을수록 모델의 이점을 잃을 가능성이 크다고 쓴다.
(원저자 자료) Evans Reference 쪽 17 Repositories는 쿼리와 애플리케이션 계층에 도메인 로직이 옮겨 가면 엔티티와 값 객체가 데이터 컨테이너가 된다고 경고한다.
(실험 확인) JDK 25 `java Anemic.java`에서 규칙이 없는 데이터 객체는 `balance -= 500`으로 잔액이 -400이 되었고, `withdraw`에 규칙을 둔 `Account`는 같은 요청을 `insufficient`로 거부하고 잔액 100을 유지했다. 이 장난감 예는 규칙의 위치만 보여 주며 Fowler의 주장을 검증하는 것은 아니다.
