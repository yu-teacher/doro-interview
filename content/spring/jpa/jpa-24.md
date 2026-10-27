---
slug: "jpa-24"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "JPA와 트랜잭션의 관계, 그리고 `readOnly = true`의 효과는?"
keywords: ["트랜잭션 경계 = 컨텍스트 경계", "readOnly → FlushMode.MANUAL", "더티 체킹 생략", "드라이버 힌트", "자기호출", "쓰기 차단 보장 없음"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/transaction/annotation/Transactional.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/JpaDialect.html", "https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/orm/jpa/vendor/HibernateJpaDialect.html", "https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
concepts: [declarative-tx, persistence-context]
importance: 3
links: [{to: "jpa-03", kind: PREREQ}, {to: "jpa-26", kind: FOLLOWUP}, {to: "tx-04", kind: RELATED}, {to: "tx-13", kind: RELATED}]
---
**모범 답변 (30~60초)**
JPA 사양상 컨테이너 관리 영속성 컨텍스트는 기본이 트랜잭션 범위이고 변경은 커밋 시 DB에 반영되므로, 쓰기는 `@Transactional` 경계 안에서 일어납니다. 공식 문서에 따르면 Spring Data의 `CrudRepository` 읽기 메서드는 readOnly 트랜잭션, 나머지는 기본 `@Transactional`로 돌고, 선언형 쿼리 메서드에는 기본 트랜잭션 설정이 없습니다. readOnly는 트랜잭션 시스템에 주는 힌트로, flush 모드나 JDBC `Connection`의 read-only에 반영될 수 있지만 쓰기를 막는다는 보장은 없습니다. Spring Data JPA 문서에 따르면 Hibernate에서는 readOnly 트랜잭션의 flush 모드가 MANUAL이 되어 더티 체크를 건너뜁니다. 같은 클래스 내부 호출(자기호출)은 프록시를 우회해 트랜잭션이 적용되지 않습니다.

(공식 문서) Jakarta Persistence 3.2 사양 3.4절은 컨테이너 관리 영속성 컨텍스트의 수명이 기본적으로 트랜잭션 범위이고 커밋 시 관리 엔티티가 준영속이 된다고 하며, 3.3.4절은 영속 엔티티의 변경이 트랜잭션 커밋 시 DB에 동기화된다고 한다. Spring Data JPA "Transactionality" 절은 `CrudRepository`에서 상속한 메서드가 `SimpleJpaRepository`의 설정을 따르고, 읽기 연산은 readOnly, 나머지는 평범한 `@Transactional`이라고 하며, 선언형 쿼리 메서드(default 메서드 포함)에는 기본 트랜잭션 설정이 적용되지 않는다고 한다. 또 상위 서비스 트랜잭션이 있으면 리포지토리의 설정보다 그것이 우선한다. `@Transactional.readOnly` Javadoc은 실제 트랜잭션 시스템에 대한 힌트일 뿐이며 쓰기 시도를 반드시 실패시키지는 않는다고 한다. `JpaDialect` Javadoc은 구현이 readOnly 플래그를 flush 모드로 적용할 수 있고 JDBC `Connection`에도 적용할 수 있다고 하며, `HibernateJpaDialect`는 기본적으로(`prepareConnection` true) read-only 상태를 JDBC `Connection`에 전달한다고 한다. Hibernate 입문서 5.9절은 flush 모드 MANUAL을 "자동으로 flush하지 않음"으로 정의하고, flush가 영속성 컨텍스트의 모든 엔티티를 더티 체크하는 비싼 작업이라고 한다. Spring Framework 레퍼런스(`@Transactional` 절)는 프록시 모드에서 프록시를 통해 들어오는 외부 호출만 가로채이고, 자기호출은 `@Transactional`이 붙은 메서드를 불러도 실제 트랜잭션을 만들지 않는다고 한다.
(공식 문서) Spring Data JPA "Transactionality" 절은 Hibernate를 쓸 때 트랜잭션을 readOnly로 설정하면 flush 모드가 MANUAL로 설정되어 Hibernate가 더티 체크를 건너뛴다고 한다.

(실험 확인) readOnly 트랜잭션에서 엔티티를 조회해 이름을 바꾸고 메서드를 끝내면, 별도 조회에서 DB 값은 원래 값 그대로다. 또 트랜잭션이 없는 메서드가 `this`로 `@Transactional` 메서드를 호출하면 그 안에서 예외가 나도 롤백되지 않고 저장된 행이 남는다.

```java
@Transactional(readOnly = true)
public void updateInReadOnly(Long id) {
    memberRepository.findById(id).orElseThrow().update("changed");   // DB에는 반영되지 않는다
}

public void selfInvocation(String email) {
    this.innerTransactional(email);   // 프록시를 거치지 않아 @Transactional이 무시된다
}
```
