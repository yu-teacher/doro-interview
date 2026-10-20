---
slug: "jpa-14"
topic: "jpa"
tier: DEEP
difficulty: 2
title: "Open-in-view(OSIV)는 무엇이고 켜 두면 어떤 문제가 있나요?"
keywords: ["OSIV", "spring.jpa.open-in-view", "커넥션 점유", "서비스에서 DTO 변환"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
OSIV는 영속성 컨텍스트(EntityManager)를 웹 요청 시작부터 뷰 렌더링(응답)까지 열어 두는 설정입니다. 켜져 있으면 컨트롤러나 뷰에서도 지연 로딩이 되어 LazyInitializationException이 줄어듭니다. 하지만 요청 내내 DB 커넥션을 붙들고 있을 수 있어 커넥션 풀 고갈 위험이 있고, 트랜잭션 밖에서 지연 로딩 쿼리가 몰래 나가서 성능 문제를 숨깁니다. Spring Boot의 `spring.jpa.open-in-view` 기본값은 true이고 시작 시 경고 로그가 뜨는 것으로 알고 있습니다. **(보충: 이번에 공식 문서에서 확인하지 않음)** 그래서 끄고(false) 서비스 계층 트랜잭션 안에서 필요한 데이터를 모두 DTO로 만들어 반환하는 구조를 선호합니다. 데모 프로젝트의 설정값은 `application` 설정 파일에서 확인해야 합니다.
