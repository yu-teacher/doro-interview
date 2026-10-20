---
slug: "jpa-10"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "IDENTITY와 SEQUENCE 전략은 INSERT 시점이 어떻게 다른가요?"
keywords: ["IDENTITY는 persist 즉시 INSERT", "SEQUENCE는 flush 때 INSERT", "allocationSize", "배치 insert"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://docs.hibernate.org/orm/7.0/introduction/html_single/"]
concepts: [entity-mapping, persistence-context]
importance: 2
links: [{to: "jpa-05", kind: PREREQ}, {to: "jpa-30", kind: FOLLOWUP}, {to: "dbd-07", kind: RELATED}, {to: "dbd-02", kind: RELATED}]
---
**모범 답변 (30~60초)**
IDENTITY는 DB의 auto-increment 컬럼을, SEQUENCE는 DB 시퀀스를 씁니다. IDENTITY는 id를 INSERT를 실행해야 알 수 있기 때문에 `persist` 직후에 바로 INSERT가 실행되어, 쓰기 지연이 깨집니다. SEQUENCE는 시퀀스에서 id를 먼저 받아 컨텍스트에 올리고 INSERT는 flush나 커밋 때 보내므로 쓰기 지연이 유지됩니다. 또 Hibernate는 IDENTITY 생성기를 쓰는 엔티티의 INSERT를 JDBC 배치로 묶지 못하지만, SEQUENCE는 가능합니다. SEQUENCE는 `allocationSize`만큼 id 블록을 한 번에 확보해서 시퀀스 호출을 줄이고, 그 대신 id가 연속적이지 않을 수 있습니다.

(공식 문서) 사용자 가이드 3.7.10절은 IDENTITY 생성기가 INSERT로 생성된 값을 받아 오는 방식이라고 하고, IDENTITY를 고르면 해당 엔티티의 INSERT를 배치할 수 없다고 한다. 13.2절은 IDENTITY 생성기를 쓰면 JDBC 수준의 INSERT 배치가 투명하게 꺼지며, JDBC 배치는 기본으로 꺼져 있고 `hibernate.jdbc.batch_size`로 켠다고 한다. 7.1.1절은 SEQUENCE·TABLE 생성기에서는 flush가 커밋 때 일어나 INSERT가 그때 나가고, IDENTITY 생성기는 `persist` 직후 INSERT를 실행해야 한다고 한다. 입문서 3.5절은 `GenerationType.IDENTITY`가 identity/auto-increment 컬럼, `SEQUENCE`가 DB 시퀀스에 대응한다고 하며, `@SequenceGenerator`의 `allocationSize`만큼 id 블록을 확보해 매번 DB에 가지 않고, 생성된 id는 연속적이지 않다고 설명한다. 외부에서 관리하는 스키마라면 `initialValue`와 `allocationSize`를 DDL의 start/increment와 맞추라고 한다.

(실험 확인) IDENTITY의 INSERT는 `persist` 시점에 실행되어 id가 채워지지만 커밋 전이라 다른 커넥션에서는 보이지 않는다. 주의: `TransactionTemplate` 안에서 `JdbcTemplate`을 쓰면 같은 커넥션을 공유해 커밋 전 행도 보이므로, 다른 커넥션 관점은 `REQUIRES_NEW`로 확인해야 한다.

```java
tx.executeWithoutResult(s -> {
    Member m = Member.builder().name("identity").email(email).build();
    em.persist(m);                         // flush·commit 없이 INSERT 실행, m.getId() != null
    int visibleOutside = requiresNew.execute(t ->      // 별도 커넥션
            jdbc.queryForObject("select count(*) from member where email = ?", Integer.class, email));
    // visibleOutside == 0 : 아직 커밋 전
});
```
