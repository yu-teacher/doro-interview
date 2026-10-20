---
slug: "boot-17"
topic: "spring-boot"
tier: TRICKY
difficulty: 3
title: "같은 키가 `application.yml`, 환경 변수, 명령행에 모두 있으면 무엇이 이기나요?"
keywords: ["명령행 > 환경 변수 > 설정 파일", "오버라이드"]
has_extra: true
status: DRAFT
---
**모범 답변 (30~60초)**
"명령행 인자가 가장 높고, 그 다음이 환경 변수, 그 다음이 `application.yml` 같은 설정 파일입니다. 예를 들어 `application.yml`에 `server.port: 8080`이 있어도 `--server.port=9000`으로 실행하면 9000이 됩니다. 프로파일 전용 파일도 기본 파일보다 우선합니다. 그래서 운영에서는 파일에 기본값을 두고 환경별 값을 환경 변수나 명령행으로 덮어쓰는 방식이 흔합니다."

```bash
java -jar board.jar --server.port=9000
```

- 공식 문서: 명령행 인자가 파일 기반 소스보다 우선하고, OS 환경 변수는 config data보다 우선한다.
- (보충) "프로파일 전용 파일이 기본 파일을 덮어쓴다"는 이번에 읽은 페이지의 발췌에서 직접 문장으로 확인하지 못했고, 프로파일 페이지의 "프로파일별 변형 파일이 활성 시 로드된다"는 설명과 일반 지식에 근거한다.
