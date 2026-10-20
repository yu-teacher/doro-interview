---
slug: "aop-14"
topic: "aop-proxy"
tier: DEEP
difficulty: 2
title: "Hibernate 엔티티 프록시와 Spring AOP 프록시는 같은 건가요?"
keywords: ["지연 로딩용 프록시", "엔티티 상속 기반", "세션 종료 시 LazyInitializationException", "AOP 프록시와 목적이 다름"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.hibernate.org/orm/current/userguide/html_single/", "https://docs.spring.io/spring-framework/reference/core/aop/introduction-proxies.html"]
---
**모범 답변 (30~60초)**
이름만 같고 별개입니다. Spring AOP 프록시는 빈에 횡단 관심사(트랜잭션 등)를 붙이려고 컨테이너가 만드는 프록시입니다. Hibernate 프록시는 지연 로딩을 위해 만드는 런타임 대리 객체로, 엔티티 클래스가 final이 아니면 그 클래스를 상속하고 실제 데이터가 필요해지는 시점에 DB를 조회해 초기화합니다. 영속성 컨텍스트(세션)가 닫힌 뒤 초기화되지 않은 지연 연관에 접근하면 `LazyInitializationException`이 납니다. 필요한 연관은 영속성 컨텍스트가 닫히기 전에 가져와야 하고, 이 문제는 AOP 프록시가 아니라 세션 수명의 문제입니다.

(공식 문서, Hibernate User Guide) 엔티티 참조는 지연 로딩이 가능하도록 일반적으로 런타임 프록시로 만들어지고, 데이터가 필요한 방식으로 쓰이는 시점에 실제 상태를 가져온다. 엔티티 클래스가 final이 아니면 프록시가 엔티티 클래스를 상속하고, final이면 프록시가 인터페이스를 구현한다. 지연 연관은 접근하기 전에 초기화해야 하며 그렇지 않으면 `LazyInitializationException`이 던져지고, 가장 좋은 방법은 영속성 컨텍스트를 닫기 전에 필요한 연관을 가져오는 것이다.
(공식 문서, Spring AOP) Spring AOP 프록시는 JDK 동적 프록시 또는 CGLIB 프록시이며 advice를 적용하기 위한 것이다.
(실험 확인) 트랜잭션 안에서 `post.getMember()`는 Hibernate 프록시(`HibernateProxy`)이고 엔티티 클래스를 상속하며 처음에는 초기화되지 않은 상태이고 AOP 프록시(`Advised`)가 아니다. 식별자 `getId()`는 초기화하지 않지만 `getName()`처럼 값을 읽으면 초기화된다. 트랜잭션 밖으로 빠져나온 프록시에서 `getName()`을 부르면 `LazyInitializationException`이 나지만 `getId()`는 된다. 함정: `Hibernate.getClass(proxy)`와 `Hibernate.unproxy(proxy)`는 호출하는 순간 프록시를 초기화하므로 초기화 여부는 `Hibernate.isInitialized()`를 먼저 호출해 확인해야 한다.
