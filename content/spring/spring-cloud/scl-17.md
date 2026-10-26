---
slug: "scl-17"
topic: "spring-cloud"
tier: DEEP
difficulty: 2
title: "Config Server가 Git 저장소에 접근하지 못하면 어떻게 되고, 클라이언트는 어떻게 대비하나요?"
keywords: ["첫 요청 때 지연 clone", "cloneOnStart로 기동 시 검증", "로컬 작업 복사본으로 계속 응답", "클라이언트 optional: 접두어", "fail-fast와 retry"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://docs.spring.io/spring-cloud-config/reference/server/environment-repository/git-backend.html", "https://docs.spring.io/spring-cloud-config/reference/client.html"]
concepts: [externalized-config, resilience]
importance: 1
links: [{to: "scl-04", kind: PREREQ}, {to: "scl-16", kind: FOLLOWUP}]
---
**모범 답변 (30~60초)**
Config Server는 기본으로 첫 요청 때 저장소를 clone하기 때문에 Git 주소가 틀리거나 닿지 않아도 서버 기동은 성공하고 오류는 첫 설정 요청에서 드러납니다. 기동 때 확인하려면 `cloneOnStart=true`를 켭니다. 한 번 clone한 뒤에는 로컬 작업 복사본을 유지하므로 원격이 죽어도 그 복사본에 브랜치와 파일이 있는 한 마지막으로 받은 설정으로 계속 응답합니다. 클라이언트 쪽은 `spring.config.import`에서 `optional:`을 빼면 서버에 닿지 못할 때 기동이 실패하고, 일시 장애를 견디게 하려면 `fail-fast=true`에 `spring-retry`를 더해 기본 6회, 1초 백오프로 재시도시킵니다.

(공식 문서) Git 백엔드 문서의 Git 백엔드 불가 시 동작 절은 서버가 기본으로 첫 요청 때 지연 clone하므로 잘못되거나 닿지 않는 Git URI가 기동을 막지 않고 첫 설정 요청에서 오류가 드러난다고 한다. `cloneOnStart=true`면 기동 중 clone을 시도해 실패 시 기동이 실패한다. 성공적으로 기동해 clone한 뒤에는 로컬 작업 복사본을 유지해 원격이 불가해져도 그 복사본에 요청된 브랜치와 파일이 있는 한 유효한 응답을 준다. `refreshRate`가 양수면 주기적으로 가져오려 시도하고 원격이 죽어 있는 동안 실패는 조용히 무시되며 복사본은 마지막 리비전에 머문다. 기본 `refreshRate`는 0으로 요청마다 가져온다.
(공식 문서) 로컬 복사본이 원격과 어긋나 가져오기가 실패하는 경우를 위해 `force-pull` 속성이 있고 기본은 false다. 클라이언트 문서는 `optional:` 접두어를 빼면 연결 실패 시 실패하고(`fail-fast`와 같은 효과), 재시도를 쓰려면 `spring.cloud.config.fail-fast=true`와 `spring-retry`, `spring-boot-starter-aop`가 필요하며 기본은 6회, 초기 백오프 1000ms, 배수 1.1이라고 한다. 프로파일 파일 안에 임포트가 있으면 재시도 설정을 임포트 URL 파라미터로 넣어야 한다. 실제 Git 서버를 끊어 실험하지는 않았다.
