---
slug: "scl-04"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "Spring Cloud Config는 설정을 어떻게 중앙에서 제공하고, 클라이언트는 어떻게 받아 오나요?"
keywords: ["Config Server와 Config Client", "Git 저장소 백엔드", "application·profile·label 리소스", "spring.config.import=configserver:", "Environment 프로퍼티 소스로 매핑"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spring.io/projects/spring-cloud", "https://docs.spring.io/spring-cloud-config/reference/quickstart.html", "https://docs.spring.io/spring-cloud-config/reference/server.html", "https://docs.spring.io/spring-cloud-config/reference/server/environment-repository.html", "https://docs.spring.io/spring-cloud-config/reference/server/environment-repository/git-backend.html", "https://docs.spring.io/spring-cloud-config/reference/client.html"]
concepts: [externalized-config]
importance: 2
links: [{to: "scl-11", kind: FOLLOWUP}, {to: "scl-17", kind: FOLLOWUP}, {to: "scl-16", kind: FOLLOWUP}, {to: "boot-07", kind: RELATED}, {to: "boot-08", kind: RELATED}]
---
**모범 답변 (30~60초)**
Config Server는 `@EnableConfigServer`를 붙인 스프링 부트 앱으로, 외부 설정을 `/{application}/{profile}/{label}` 형태의 HTTP 리소스로 내려줍니다. 기본 백엔드는 Git 저장소라서 환경 관리와 변경 감사에 편하고, 응답은 스프링 `Environment`의 프로퍼티 소스 목록에 그대로 대응됩니다. 클라이언트는 의존성을 추가하고 `spring.config.import=optional:configserver:`처럼 임포트를 선언하면 기동 때 서버에서 설정을 받아 오며, 애플리케이션 이름과 활성 프로파일이 각각 application과 profile 값이 됩니다. `optional:`을 빼면 서버에 연결하지 못할 때 기동이 실패합니다.

(공식 문서) Config 퀵스타트와 서버 문서는 `@EnableConfigServer`로 서버를 만들고 서버가 `/{application}/{profile}[/{label}]`와 `{application}-{profile}.yml`, `.properties` 형태의 HTTP 리소스를 제공한다고 설명한다. 기본 전략은 git 저장소를 clone해 작은 `SpringApplication`을 초기화하고 그 `Environment`의 프로퍼티 소스를 JSON으로 노출하는 것이다. 환경 저장소 문서는 `{application}`이 클라이언트의 `spring.application.name`, `{profile}`이 활성 프로파일(쉼표 구분), `{label}`이 서버 쪽에서 설정 파일 묶음의 버전을 가리키는 값이라고 하고, git 백엔드가 기본 구현이며 업그레이드와 물리적 환경 관리, 변경 감사에 매우 편리하다고 쓴다.
(공식 문서) 클라이언트 문서는 스프링 부트 2.4가 도입한 `spring.config.import`가 이제 Config Server에 붙는 기본 방식이며, `optional:` 접두어를 빼면 연결 실패 시 클라이언트가 실패하고 기본 위치는 `http://localhost:8888`이라고 한다. 부트가 먼저 기본 프로파일로 설정을 읽고 활성화된 프로파일을 알게 된 뒤 추가로 읽기 때문에 서버에 요청이 여러 번 가는 것은 정상이라고 설명한다. 옛 부트스트랩 방식은 `spring-cloud-starter-bootstrap`이나 `spring.cloud.bootstrap.enabled=true`가 있어야 한다.
