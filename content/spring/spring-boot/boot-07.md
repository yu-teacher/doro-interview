---
slug: "boot-07"
topic: "spring-boot"
tier: DEEP
difficulty: 2
title: "외부 설정과 프로퍼티 우선순위를 설명해 주세요."
keywords: ["우선순위", "명령행 인자", "환경 변수", "relaxed binding", "`${}` 플레이스홀더"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"Boot는 여러 소스의 설정을 우선순위 순서로 합칩니다. 낮은 쪽부터 말씀드리면 `application.yml` 같은 설정 파일, OS 환경 변수, 자바 시스템 프로퍼티, `SPRING_APPLICATION_JSON`, 그리고 명령행 인자가 있고, 뒤에 있을수록 앞의 값을 덮어씁니다. 그래서 `--server.port=9000`은 파일 설정보다 강합니다. 환경 변수는 점을 쓸 수 없는 셸이 많아서 `SPRING_CONFIG_NAME`처럼 대문자와 밑줄로 씁니다. 그래서 운영에서는 DB 비밀번호 같은 값을 파일에 안 두고 환경 변수로 주입합니다. 데모의 `application-prod.yml`이 정확히 그 방식입니다."

```yaml
# application-prod.yml (데모 프로젝트)
spring:
  datasource:
    url: ${DB_URL}
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

- 공식 문서(발췌, 낮음 -> 높음): config data(application.yml) < 랜덤 값 < OS 환경 변수 < 시스템 프로퍼티 < JNDI < ServletContext/ServletConfig 파라미터 < `SPRING_APPLICATION_JSON` < 명령행 인자 < 테스트의 `properties`/`@DynamicPropertySource`/`@TestPropertySource` < devtools 전역 설정. (중간 일부 항목은 생략)
- 공식 문서: `application.yml`은 클래스패스 루트, `/config`, 현재 디렉터리, `config/` 순으로 읽고 나중 것이 덮어쓴다. jar 밖의 설정이 jar 안보다 우선한다.
- 공식 문서: `${username:Unknown}`처럼 기본값을 둔 플레이스홀더를 지원한다.
- 위 데모 설정에서 DB 접속 정보 `application-dev.yml`에는 평문이 들어 있다. 로컬 개발용이므로 그렇지만, 면접에서는 "운영 값은 환경 변수로, 개발용 값도 저장소에 올리지 않는 것이 이상적"이라고 덧붙이면 좋다. (보충)
