---
slug: "boot-17"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "같은 키가 `application.yml`, 환경 변수, 명령행에 모두 있으면 무엇이 이기나요?"
keywords: ["명령행 > 환경 변수 > 설정 파일", "오버라이드"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.spring.io/spring-boot/reference/features/external-config.html"]
concepts: [externalized-config]
importance: 1
---
**모범 답변 (30~60초)**
명령행 인자가 가장 높고, 그 다음이 환경 변수, 그 다음이 `application.yml` 같은 설정 파일(config data)입니다. 예를 들어 `application.yml`에 `server.port: 8080`이 있어도 `--server.port=9000`으로 실행하면 9000이 됩니다. 시스템 프로퍼티는 환경 변수보다 높고 명령행보다 낮습니다. 프로파일 전용 파일은 같은 위치의 기본 파일을 항상 덮어씁니다. 그래서 파일에는 기본값을 두고 환경별 값은 환경 변수나 명령행으로 덮어쓰는 방식을 씁니다. 이때 환경 변수는 점 대신 밑줄과 대문자로 씁니다.

```bash
java -jar app.jar --server.port=9000
SERVER_PORT=9001 java -jar app.jar   # 환경 변수: 파일보다 강하고 명령행보다 약하다
```

- 공식 문서: 소스는 낮은 것부터 나열되고 뒤의 것이 앞의 것을 덮어쓴다. config data(`application.properties` 등) < OS 환경 변수 < 시스템 프로퍼티 < `SPRING_APPLICATION_JSON` < 명령행 인자(그 위에 테스트용 소스와 devtools 전역 설정이 있다).
- 공식 문서: 명령행 옵션(`--server.port=9000`)은 프로퍼티로 변환되어 Environment에 추가되고, 명령행 프로퍼티는 항상 파일 기반 프로퍼티 소스보다 우선한다.
- 공식 문서: 프로파일 전용 파일(`application-{profile}`)은 같은 위치의 일반 파일보다 항상 우선한다.
- 공식 문서: 환경 변수 이름은 점을 밑줄로, 대시를 제거하고 대문자로 바꾼다(`SERVER_PORT`).
- (실험 확인) `server.port`를 yml에 두고 시스템 프로퍼티, 명령행 인자를 차례로 추가하자 yml < 시스템 프로퍼티 < 명령행 순으로 이겼고, 환경 PropertySource 목록에서도 `commandLineArgs`가 `systemProperties`보다, 그것이 yml보다 앞에 있었다.
