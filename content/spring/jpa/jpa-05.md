---
slug: "jpa-05"
topic: "jpa"
tier: BASIC
difficulty: 1
title: "쓰기 지연과 flush는 언제 일어나나요?"
keywords: ["쓰기 지연", "auto-flush", "커밋 전 flush", "쿼리 실행 전 flush", "네이티브 SQL 주의", "flush != commit"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/7.0/introduction/html_single/", "https://docs.hibernate.org/orm/7.0/userguide/html_single/", "https://jakarta.ee/specifications/persistence/3.2/jakarta-persistence-spec-3.2.html"]
concepts: [persistence-context]
importance: 2
links: [{to: "jpa-03", kind: PREREQ}, {to: "jpa-10", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
`persist`나 값 변경은 바로 SQL이 되지 않고 영속성 컨텍스트에 쌓였다가 flush 때 한꺼번에 DB로 나갑니다(IDENTITY 키 생성은 예외). Hibernate 입문서에 따르면 flush는 기본적으로 트랜잭션 커밋 시, 결과가 영향받을 수 있는 쿼리 실행 전(auto-flush), 그리고 `flush()`를 직접 호출할 때 일어납니다. 네이티브 SQL은 JPA `EntityManager`로 실행하면 항상 flush하지만, Hibernate `Session`의 네이티브 쿼리는 기본적으로 flush하지 않아 오래된 결과가 나올 수 있습니다. 플러시 모드 COMMIT이나 MANUAL은 쿼리가 stale한 결과를 돌려줄 수 있다고 문서가 경고합니다. flush는 커밋이 아니라 SQL을 DB로 보내는 것입니다.

(공식 문서) 입문서 5.9절은 flush가 기본적으로 커밋 시, 쿼리 결과에 영향을 줄 변경이 있을 때의 쿼리 실행 전, 명시적 `flush()` 호출 시 일어난다고 설명하고, 플러시 모드 표(MANUAL: 자동 flush 없음, COMMIT: 커밋 전, AUTO: 커밋 전과 영향받을 쿼리 전, ALWAYS: 모든 쿼리 전)를 싣는다. 6.3절은 쿼리 실행 전 auto-flush가 기본이며 NO_FLUSH, COMMIT, MANUAL이면 오래된 결과가 나올 수 있다고 한다. 6.6절은 Hibernate가 네이티브 쿼리 전에는 기본적으로 flush하지 않으므로 오래된 데이터가 나올 수 있고 `flush()` 호출, ALWAYS 모드, 영향받는 엔티티 동기화 지정 중 하나를 쓰라고 한다. 사용자 가이드 7.1.3절은 JPA `EntityManager` API로 네이티브 쿼리를 실행하면 flush가 항상 일어난다고 설명한다(같은 절에서 Hibernate를 JPA 없이 부트스트랩한 `Session` API의 기본 동작은 본문 문장과 예제가 서로 어긋나 있어 이 답변에서는 입문서 6.6절을 따랐다). 같은 장 7.1.1절은 SEQUENCE·TABLE 생성기는 커밋 때 INSERT가 나가고 IDENTITY는 `persist` 직후 INSERT가 나간다고 한다. 사양 3.3.4절은 영속 엔티티의 상태가 트랜잭션 커밋 때 DB에 동기화되고, 구현체가 그 밖의 시점에도 동기화할 수 있으며, 애플리케이션이 `flush`로 동기화를 강제할 수 있다고 한다.

(보충) flush로 나간 SQL도 같은 DB 트랜잭션 안에서 실행되므로 롤백하면 DB가 되돌린다는 설명은 문서 문장이 아니라 DB 트랜잭션의 일반 성질에서 온 것이다. 아래 실험에서 IDENTITY INSERT가 커밋 전에 나갔어도 예외로 롤백되면 행이 남지 않는 것을 확인했다.

(실험 확인) 엔티티를 수정한 뒤 `FlushModeType.COMMIT`으로 JPQL을 실행하면 수정 전 값이 조회되고, 기본 AUTO로 실행하면 수정된 값이 조회된다(JPQL 실행 전 auto-flush). 트랜잭션 안에서 `save`한 뒤 예외를 던져 롤백하면 저장한 행이 DB에 남지 않는다.

```java
m.update("changed");
em.createQuery("select m.name from Member m where m.id = :id", String.class)
  .setParameter("id", id).setFlushMode(FlushModeType.COMMIT).getSingleResult(); // "orig"
em.createQuery("select m.name from Member m where m.id = :id", String.class)
  .setParameter("id", id).getSingleResult();                                   // "changed" (auto-flush)
```
