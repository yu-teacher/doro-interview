---
slug: "tst-01"
topic: "dev-test"
tier: BASIC
difficulty: 1
title: "단위 테스트와 통합 테스트는 무엇이 다르고, 스프링 프로젝트에서는 어떻게 나눠 작성하나요?"
keywords: ["컨테이너 없이 new로 생성", "협력 객체는 목으로 대체", "스프링 컨텍스트로 배선 검증", "통합 테스트가 더 느림", "테스트 피라미드"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/testing.html", "https://docs.spring.io/spring-framework/reference/testing/unit.html", "https://docs.spring.io/spring-framework/reference/testing/integration.html"]
concepts: [test-strategy]
importance: 3
links: [{to: "tst-04", kind: FOLLOWUP}, {to: "tst-11", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
단위 테스트는 스프링 컨테이너 없이 객체를 `new`로 만들고 협력 객체는 목이나 스텁으로 바꿔서, 클래스 하나의 로직을 빠르게 검증합니다. 통합 테스트는 실제 스프링 컨텍스트를 띄워서 빈 배선이 맞는지, JDBC나 ORM으로 하는 데이터 접근과 SQL, 매핑이 맞는지 확인합니다. 공식 문서도 통합 테스트는 단위 테스트보다 느리지만 Selenium이나 서버에 배포해서 하는 원격 테스트보다는 훨씬 빠르다고 설명합니다. 그래서 서비스 로직은 단위 테스트로 많이, 컨텍스트가 필요한 부분은 통합 테스트로 적게, 전체 흐름을 보는 E2E는 가장 적게 두는 테스트 피라미드 구성을 보통 씁니다.

(공식 문서) Spring Framework 테스트 장 Unit Testing 절은 의존성 주입 덕분에 POJO를 `new`로 만들어 컨테이너 없이 테스트할 수 있고, 서비스 계층은 DAO나 리포지토리 인터페이스를 스텁·목으로 대체해 영속 데이터 없이 검증할 수 있으며, 진짜 단위 테스트는 런타임 인프라를 설정할 필요가 없어 매우 빠르다고 설명한다. Integration Testing 절은 통합 테스트로 컴포넌트 배선, JDBC·ORM 데이터 접근(SQL, Hibernate 쿼리, JPA 매핑)을 애플리케이션 서버 배포 없이 검증할 수 있고, 단위 테스트보다는 느리지만 Selenium이나 원격 테스트보다 훨씬 빠르다고 한다.
(보충) 단위 테스트를 가장 많이, E2E를 가장 적게 두는 테스트 피라미드 비율과 E2E의 정의는 위 문서에 있는 내용이 아니라 일반적인 구성 관행이다. 속도 차이를 직접 재 보지는 않았다.
