---
slug: "aop-14"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "Hibernate 엔티티 프록시와 Spring AOP 프록시는 같은 건가요?"
keywords: ["지연 로딩용 프록시", "엔티티 상속 기반", "세션 종료 시 LazyInitializationException", "AOP 프록시와 목적이 다름"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
이름만 같고 별개입니다. Spring AOP 프록시는 빈에 횡단 관심사(트랜잭션 등)를 붙이려고 컨테이너가 만드는 프록시입니다. Hibernate 프록시는 지연 로딩을 위해 엔티티 클래스를 상속해 만든 대리 객체로, 실제 필드에 처음 접근할 때 DB를 조회해 초기화합니다. 영속성 컨텍스트(세션)가 닫힌 뒤 초기화하면 `LazyInitializationException`이 납니다. 그래서 엔티티 클래스에도 final 제약 같은 상속 가능성 조건이 생깁니다.

- (실험 확인) 트랜잭션 안에서 `post.getMember()`는 `Member$HibernateProxy`이고 초기화되지 않은 상태이며 AOP 프록시(`Advised`)가 아니다. `getId()`는 초기화하지 않지만 `getName()`은 초기화한다. 함정: `Hibernate.getClass(proxy)`와 `Hibernate.unproxy(proxy)`는 호출하는 순간 프록시를 초기화한다. 초기화 여부를 보려면 `Hibernate.isInitialized()`를 먼저 호출해야 한다. 확인 테스트: `experiment/aop/BootProxyExperimentTest`.

- (보충) 이 문항은 Hibernate 관련 일반 지식이며 Spring AOP 공식 문서에서 확인한 내용이 아니다.
- 실험: TxExperimentTest `트랜잭션_안에서는_지연로딩이_된다` / `트랜잭션_밖에서는_지연로딩이_실패한다`(`LazyInitializationException`)가 Hibernate 쪽 현상을 보여준다. 이 현상 자체는 Spring AOP 프록시가 아니라 트랜잭션 범위(세션 수명) 문제다.
