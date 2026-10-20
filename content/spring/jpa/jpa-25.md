---
slug: "jpa-25"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Spring Data JPA 리포지토리는 인터페이스만 만들었는데 어떻게 동작하나요?"
keywords: ["리포지토리 프록시", "SimpleJpaRepository", "쿼리 메서드 파싱", "JpaRepositoryFactory", "인터페이스 계층"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-data/commons/reference/repositories/create-instances.html", "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/core/support/RepositoryFactorySupport.html", "https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/support/SimpleJpaRepository.html", "https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/support/JpaRepositoryFactory.html", "https://docs.spring.io/spring-data/jpa/docs/current/api/org/springframework/data/jpa/repository/JpaRepository.html", "https://docs.spring.io/spring-data/commons/docs/current/api/org/springframework/data/repository/PagingAndSortingRepository.html", "https://docs.spring.io/spring-data/commons/reference/repositories/query-methods-details.html", "https://docs.spring.io/spring-data/jpa/reference/jpa/transactions.html"]
---
**모범 답변 (30~60초)**
시작 시 Spring Data가 `Repository`를 상속한 인터페이스를 스캔해 인터페이스마다 FactoryBean이 만든 프록시를 빈으로 등록합니다. 팩토리(JPA는 `JpaRepositoryFactory`)가 만든 프록시의 호출은 `QueryExecutorMethodInterceptor`로 넘어갑니다. CRUD는 기본 구현체 `SimpleJpaRepository`가 처리하고 `@Transactional`도 여기에 선언되어 있습니다. 쿼리 메서드는 기본 전략(CREATE_IF_NOT_FOUND)에 따라 `@Query` 같은 선언된 쿼리를 먼저 찾고, 없으면 메서드 이름을 파싱합니다. `JpaRepository`는 `ListCrudRepository` 등을 상속하고 `PagingAndSortingRepository`는 `Repository`를 상속합니다.

(공식 문서) Spring Data Commons "Creating Repository Instances"는 `Repository` 또는 그 하위 인터페이스를 상속한 인터페이스를 스캔해, 찾은 인터페이스마다 저장소 기술별 FactoryBean이 쿼리 메서드 호출을 처리하는 프록시를 만든다고 한다. `RepositoryFactorySupport` Javadoc은 설정된 리포지토리 인터페이스를 구현한 프록시를 만들고 `QueryExecutorMethodInterceptor`에 제어를 넘기는 advice를 적용한다고 한다. `JpaRepositoryFactory`는 JPA용 리포지토리 팩토리이고, `SimpleJpaRepository`는 `CrudRepository`의 기본 구현으로 클래스에 `@Transactional(readOnly = true)`가 붙고 `save`나 `deleteById` 같은 변경 메서드에는 `@Transactional`이 붙어 있다. Spring Data JPA 트랜잭션 문서도 상속한 CRUD 메서드가 `SimpleJpaRepository`의 설정을 따른다고 한다. 쿼리 탐색 전략은 Commons의 "Query Lookup Strategies" 절에 있고, 기본값 CREATE_IF_NOT_FOUND는 선언된 쿼리를 먼저 찾고 없을 때 메서드 이름 기반 쿼리를 만든다. 계층 구조는 `JpaRepository` Javadoc이 `ListCrudRepository`, `ListPagingAndSortingRepository`, `QueryByExampleExecutor`를 상속한다고 하고, `PagingAndSortingRepository` Javadoc이 `Repository`를 상속한다고 한다.

(실험 확인) 구현 클래스를 작성하지 않은 리포지토리 빈은 `Proxy.isProxyClass`가 true이고 `AopUtils.isJdkDynamicProxy`도 true인 JDK 동적 프록시이며, 리포지토리 인터페이스의 인스턴스다.

```java
interface MemberRepository extends JpaRepository<Member, Long> { }

// 주입받은 빈은 구현 클래스가 아니라 JDK 동적 프록시다
assertThat(AopUtils.isJdkDynamicProxy(memberRepository)).isTrue();
assertThat(memberRepository).isInstanceOf(MemberRepository.class);
```
