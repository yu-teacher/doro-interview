---
slug: "boot-20"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "운영 환경에서 Actuator나 DevTools, 로깅 설정을 어떻게 다룰 건가요?"
keywords: ["환경 분리", "최소 노출", "환경 변수 주입", "ddl-auto validate"]
has_extra: false
status: DRAFT
---
**모범 답변 (30~60초)**
"DevTools는 `developmentOnly`라 패키징된 jar에 들어가지 않고 자동 비활성화되므로, 운영에는 영향이 없도록 둡니다. Actuator는 필요한 엔드포인트만 `include`로 열고, health 상세는 `when-authorized`로 제한하며, Spring Security나 네트워크 수준에서 보호합니다. 로깅은 우리 프로젝트처럼 prod에서는 root와 앱 패키지를 info로 두고 SQL/Hikari 디버그 같은 상세 로그는 dev에만 둡니다. DB 접속 정보도 환경 변수로 주입하고, 스키마는 `ddl-auto: validate`로 검증만 합니다."

- 근거: 데모 `application-prod.yml`(환경 변수 주입, `validate`, 풀 크기 10, info 레벨)과 `application-dev.yml`(`update`, SQL/Hikari 디버그), 위 DevTools/Actuator 공식 문서 내용.
