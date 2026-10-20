---
slug: "boot-19"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "자동 설정이 어떤 빈을 만들었는지, 혹은 왜 안 만들었는지 어떻게 확인하나요?"
keywords: ["--debug", "conditions report", "exclude"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/using/auto-configuration.html", "https://docs.spring.io/spring-boot/reference/features/logging.html", "https://docs.spring.io/spring-boot/reference/actuator/endpoints.html", "https://docs.spring.io/spring-boot/api/rest/actuator/conditions.html"]
---
**모범 답변 (30~60초)**
`--debug` 옵션이나 `debug=true`로 실행하면 일부 핵심 로거의 디버그 로그가 켜지고 조건 평가 리포트(conditions report)가 콘솔에 출력되어, 어떤 자동 설정이 적용됐고 어떤 조건 때문에 빠졌는지 볼 수 있습니다. 이 옵션은 애플리케이션의 모든 로그를 DEBUG로 바꾸는 게 아니라 임베디드 컨테이너, Hibernate, Spring Boot 같은 일부 핵심 로거만 올립니다. Actuator를 쓰고 있다면 `conditions` 엔드포인트(`/actuator/conditions`)로 같은 조건 평가 정보를 볼 수 있습니다. 원치 않는 자동 설정은 `exclude`로 제외합니다.

- 공식 문서: 현재 적용되는 자동 설정과 이유는 `--debug`로 시작해 알아내며, 일부 핵심 로거의 디버그 로그를 켜고 조건 리포트를 콘솔에 출력한다. 원치 않는 클래스는 `@SpringBootApplication`의 `exclude`(클래스패스에 없으면 `excludeName`)나 `spring.autoconfigure.exclude`로 제외한다.
- 공식 문서(로깅): 디버그 모드는 `--debug` 플래그 또는 `application.properties`의 `debug=true`로 켜고, 임베디드 컨테이너, Hibernate, Spring Boot의 핵심 로거가 더 많은 정보를 출력하게 한다. 애플리케이션이 모든 메시지를 DEBUG로 로깅하게 하지는 않는다.
- 공식 문서(Actuator): `conditions` 엔드포인트는 설정 클래스와 자동 설정 클래스에서 평가된 조건과 매치 여부의 이유를 보여 준다. `GET /actuator/conditions`로 조회한다(엔드포인트를 노출해야 한다).
