---
slug: "tst-15"
topic: "dev-test"
tier: DEEP
difficulty: 2
title: "`@SpringBootTest`의 `webEnvironment`는 `MOCK`, `RANDOM_PORT`, `DEFINED_PORT`, `NONE` 중 무엇을 고르나요?"
keywords: ["MOCK 기본값은 서버 미기동", "RANDOM_PORT 실제 서버", "MockMvc", "DEFINED_PORT 포트 충돌", "NONE 웹 환경 없음"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/testing/spring-boot-applications.html", "https://docs.spring.io/spring-framework/reference/testing/testcontext-framework/tx.html"]
---
**모범 답변 (30~60초)**
기본값인 `MOCK`은 웹 컨텍스트를 만들되 내장 서버는 띄우지 않고 mock 웹 환경을 제공해서, `MockMvc` 같은 도구로 컨트롤러를 빠르게 호출해 볼 때 씁니다. `RANDOM_PORT`는 내장 서버를 임의 포트에 실제로 띄워서 진짜 HTTP 요청으로 확인할 수 있고, 포트는 `@LocalServerPort`로 받습니다. `DEFINED_PORT`는 설정한 포트나 8080에 띄우기 때문에 포트가 겹치면 충돌할 수 있습니다. `NONE`은 웹 환경 없이 컨텍스트만 올려서 비웹 로직을 확인할 때 씁니다. 실제 서버를 띄우면 요청이 다른 스레드에서 처리되므로, 테스트에 건 롤백이 서버 쪽 변경에는 적용되지 않는다는 점을 주의해야 합니다.

(공식 문서) Spring Boot 4.1.1 문서는 `webEnvironment`의 네 값을 설명한다. `MOCK`(기본)은 mock 웹 환경이고 내장 서버를 띄우지 않으며 `MockMvc` 등과 함께 쓸 수 있고, `RANDOM_PORT`와 `DEFINED_PORT`는 실제 웹 환경에서 내장 서버가 각각 임의 포트와 설정된 포트(기본 8080)에서 시작되며, `NONE`은 웹 환경을 제공하지 않는다. 또 실제 서블릿 환경에서는 HTTP 클라이언트와 서버가 다른 스레드, 즉 다른 트랜잭션에서 돌기 때문에 서버에서 시작된 트랜잭션은 롤백되지 않는다고 한다. `@LocalServerPort`로 실제 포트를 주입받는다고 한다.
(실험 확인) Spring Boot 4.1.0 실험 프로젝트에서 네 값을 각각 실행했다. 기본(`MOCK`)의 컨텍스트는 `GenericWebApplicationContext`로 웹 애플리케이션 컨텍스트이지만 `WebServerApplicationContext`는 아니었고(서버 미기동), `@AutoConfigureMockMvc`와 함께 `MockMvcTester`로 `POST /users/mockmvc`가 200이었다. `RANDOM_PORT`는 `WebServerApplicationContext`였고 `@LocalServerPort`로 받은 포트(8080이 아님)로 `java.net.http.HttpClient` 요청 `GET /greet/kim`이 200과 `hello kim`을 돌려줬다. `DEFINED_PORT`에 `server.port=18291`을 주니 그 포트에서 서버가 떠서 200이었고, 같은 방식으로 다른 소켓이 이미 점유한 포트(18292)를 지정하면 컨텍스트 로딩이 `PortInUseException`(`Port 18292 is already in use`)으로 실패했다. `NONE`의 컨텍스트는 `AnnotationConfigApplicationContext`로 웹 애플리케이션 컨텍스트가 아니었다. 트랜잭션 롤백 주의점은 `RANDOM_PORT`에서 `POST /users/http`가 200이고 그 변경이 남아 있었던 것으로 확인했다(자세한 실험은 tst-16).
(보충) 어떤 상황에 어떤 값을 고르는가(`MockMvc`로 충분하면 `MOCK`, 실제 HTTP가 필요하면 `RANDOM_PORT`, 웹이 필요 없으면 `NONE`)는 위 문서의 각 값 설명에서 이끌어낸 일반적인 선택 기준이다.
