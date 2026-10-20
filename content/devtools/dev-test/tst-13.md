---
slug: "tst-13"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "스프링 테스트에서 ApplicationContext 캐싱은 어떻게 동작하고, 언제 컨텍스트가 다시 만들어지나요?"
keywords: ["static 캐시", "설정 조합이 캐시 키", "기본 최대 32개 LRU", "@DirtiesContext", "프로세스 포크 시 캐시 무효"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/ctx-management/caching.html", "https://docs.spring.io/spring-framework/reference/testing/integration.html", "https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html"]
---
**모범 답변 (30~60초)**
TestContext 프레임워크는 한 번 로드한 컨텍스트를 static 캐시에 보관해서, 설정이 같은 테스트 클래스끼리 재사용합니다. 캐시 키는 설정 클래스나 위치, 활성 프로필, 프로퍼티 소스, 컨텍스트 초기화기와 커스터마이저 같은 설정 조합이라서, 프로필이나 `@TestPropertySource`, `@MockitoBean` 구성이 하나라도 다르면 새 컨텍스트가 만들어집니다. 캐시 크기는 기본 32개이고 넘으면 가장 오래 쓰지 않은 것부터 닫습니다. 테스트가 컨텍스트를 오염시켰다면 `@DirtiesContext`로 캐시에서 제거합니다. 캐시가 static이어서 테스트를 프로세스별로 포크해서 돌리면 캐시가 지워져 효과가 없습니다.

(공식 문서) Spring Framework 테스트 장의 Context Caching 절은 캐시 키를 만드는 설정 요소(locations, classes, 초기화기, 컨텍스트 커스터마이저, 프로필, 프로퍼티 소스 등)를 나열하고, 컨텍스트가 static 변수에 저장되어 프로세스를 포크하면 캐시가 효과가 없고, 기본 최대 크기가 32이며 LRU로 내보내고 `spring.test.context.cache.maxSize`로 바꿀 수 있고, `@DirtiesContext`로 컨텍스트를 캐시에서 제거할 수 있다고 설명한다. Boot 문서도 설정이 같은 테스트는 컨텍스트 로딩이 한 번만 일어난다고 한다.
(실험 확인) Spring Boot 4.1.0 실험 프로젝트에서 설정이 같은 `@SpringBootTest` 클래스 둘은 같은 컨텍스트 객체(해시가 같음)를 썼다. `@MockitoBean`을 추가한 클래스, `@ActiveProfiles("other")`를 붙인 클래스, `@SpringBootTest(properties = "demo.x=1")`를 쓴 클래스, `@WebMvcTest` 슬라이스는 각각 앞의 것과 다른 컨텍스트를 썼다. 같은 설정의 클래스 중 `@DirtiesContext(classMode = AFTER_CLASS)`를 붙인 클래스는 기존 컨텍스트를 쓴 뒤 그것을 캐시에서 제거했고, 바로 다음에 실행된 같은 설정의 클래스는 새 컨텍스트를 받았으며 그 뒤 클래스는 그 새 컨텍스트를 다시 재사용했다. 캐시 크기 32 초과 때의 LRU 제거는 실행해 보지 않았다.
