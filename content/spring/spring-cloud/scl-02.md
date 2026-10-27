---
slug: "scl-02"
topic: "spring-cloud"
tier: BASIC
difficulty: 1
title: "스프링 클라우드 버전(2025.1.x 같은 릴리스 트레인)은 어떻게 읽고, 스프링 부트 버전과는 어떻게 맞추나요?"
keywords: ["캘린더 버저닝", "릴리스 트레인 BOM", "부트 세대와 매핑", "최신 서비스 릴리스 사용", "코드명은 버전에 안 씀"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-27
sources: ["https://spring.io/projects/spring-cloud", "https://github.com/spring-cloud/spring-cloud-release/wiki/Supported-Versions", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.0-Release-Notes", "https://github.com/spring-cloud/spring-cloud-release/wiki/Spring-Cloud-2025.1-Release-Notes"]
concepts: [dependency-management, spring-migration]
importance: 2
links: [{to: "boot-06", kind: RELATED}, {to: "boot-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
스프링 클라우드는 개별 프로젝트를 묶은 릴리스 트레인으로 배포되고, 2020년부터 `YYYY.MINOR.MICRO` 형태의 캘린더 버전을 씁니다. 앞 두 자리가 트레인 세대이고, 런던 지하철역 이름 코드명(2025.1은 Oakwood)은 저장소에 올라가는 버전에는 쓰지 않습니다. 부트 버전에 맞는 트레인을 먼저 고른 뒤 `spring-cloud-dependencies` BOM을 가져와 하위 프로젝트 버전을 맡기고, 그 트레인의 최신 서비스 릴리스를 쓰라고 안내합니다. 대응표에서 2025.1은 부트 4.0.x(2025.1.2부터 4.1.x도), 2025.0은 3.5.x에 해당하므로 부트를 올릴 때 트레인도 함께 맞춰야 합니다.

(공식 문서) spring.io 프로젝트 페이지의 호환 표는 2025.1.x(Oakwood)가 부트 4.0.x와 4.1.x(2025.1.2부터), 2025.0.x(Northfields)가 3.5.x, 2024.0.x가 3.4.x, 2023.0.x가 3.2.x와 3.3.x(2023.0.2부터)에 대응한다고 보여 준다. 별표가 붙은 트레인은 수명이 끝난 것이라고 쓰며, 확인한 시점의 문서에서는 2025.1만 별표가 없었다. BOM은 의존성 관리만 담고 플러그인이나 부트 직접 참조가 없으며, 서비스 릴리스는 하위 호환 기능과 버그 수정을 담으니 확인한 트레인의 최신 서비스 릴리스를 쓰라고 안내한다.
(공식 문서) 릴리스 노트 위키의 Supported Versions 문서는 2020년 초에 `YYYY.MINOR.MICRO` 캘린더 버저닝으로 바꿨고 MINOR는 해마다 0부터 시작하며 `.0`이 예전 `.RELEASE`, `.2`가 `.SR2`에 해당한다고 설명한다. 앞 두 자리가 트레인 세대이고, 런던 지하철역 이름은 코드명으로만 계속 쓰고 Maven 저장소에 올라가는 버전에는 쓰지 않는다. 트레인 자체에는 지원 기간이 없고 포함된 프로젝트의 지원 기간이 누적되며, 일반적으로 부트 지원이 끝난 뒤 3개월 안에 해당 트레인의 프로젝트 지원도 끝난다고 한다.
(공식 문서) 2025.0 릴리스 노트는 게이트웨이 모듈과 스타터 이름이 바뀌고 옛 이름이 deprecated 됐다고 알린다. 2025.1 릴리스 노트는 Jackson 3, JSpecify 널 가능성, 스프링 프레임워크 7과 부트 4의 변경을 수용하느라 여러 호환성 깨짐이 있었다고 쓰고, 2025.1.0은 2025-11-24에 나왔다.
