---
slug: "dst-05"
topic: "design-distributed"
tier: BASIC
difficulty: 1
title: "API 게이트웨이는 무엇이고 왜 두나요?"
keywords: ["단일 진입점", "라우팅과 여러 서비스 팬아웃", "클라이언트별 API", "인증 같은 공통 관심사", "추가 홉과 운영 부담"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://microservices.io/patterns/apigateway.html", "https://docs.spring.io/spring-cloud-gateway/reference/", "https://samnewman.io/patterns/architectural/bff/"]
---
**모범 답변 (30~60초)**
API 게이트웨이는 클라이언트가 마이크로서비스들에 접근하는 단일 진입점입니다. 어떤 요청은 해당 서비스로 그대로 라우팅하고, 어떤 요청은 여러 서비스를 호출해 결과를 합쳐 줍니다. 클라이언트는 서비스가 어떻게 나뉘었는지, 인스턴스가 어디 있는지 몰라도 되고 클라이언트마다 맞는 API를 받을 수도 있으며, 한 번의 왕복으로 필요한 데이터를 받으므로 네트워크가 느린 모바일에 특히 유리합니다. 인증 확인 같은 공통 관심사도 둘 수 있습니다. 대신 개발·배포·운영할 부품이 하나 늘고 네트워크 홉이 추가됩니다. 클라이언트 종류마다 게이트웨이를 따로 두는 BFF 변형도 있는데, 이는 따로 다룹니다.

(원저자 자료) Richardson의 microservices.io "API Gateway / Backends for Frontends"는 서비스 API의 세분성이 클라이언트가 필요한 것과 다르고, 클라이언트마다 필요한 데이터와 네트워크 성능이 다르며, 인스턴스 위치가 동적이고 분할이 시간에 따라 바뀌는 것을 숨겨야 한다는 힘(forces)을 든다. 해법으로 모든 클라이언트의 단일 진입점을 두고, 요청을 프록시하거나 여러 서비스로 팬아웃하며, 클라이언트별로 다른 API를 제공할 수 있고 권한 검증도 할 수 있다고 한다. 이점은 분할과 인스턴스 위치로부터 클라이언트를 격리, 왕복 수 감소, 클라이언트 단순화, 외부 프로토콜 변환이다. 단점은 움직이는 부품이 하나 더 늘어나는 복잡도와 추가 홉에 따른 응답 시간 증가이며, 저자는 대부분의 애플리케이션에서 추가 왕복 비용은 무시할 만하다고 쓴다.
(공식 문서) Spring Cloud Gateway 문서(Spring Framework 7, Boot 4 기반 현행판 소개)는 이 프로젝트가 API로의 라우팅과 보안, 모니터링·메트릭, 복원력 같은 공통 관심사를 제공하는 것이 목적이라고 소개한다.
(원저자 자료) Newman은 범용 API 백엔드가 여러 UI를 위한 배포 단위라서 변경이 몰리는 병목이 되기 쉽다고 지적하며 UI별 BFF를 대안으로 제시한다(dst-15).
