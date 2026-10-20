---
slug: "dkr-14"
topic: "dev-docker"
tier: DEEP
difficulty: 1
title: ".dockerignore는 무엇이고 왜 필요한가요?"
keywords: ["빌드 컨텍스트에서 제외", "컨텍스트 크기와 전송 감소", "빌드 속도 개선", "비밀 파일 실수 포함 방지", "컨텍스트 루트에 위치"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/building/context/", "https://docs.docker.com/build/building/best-practices/"]
---
**모범 답변 (30~60초)**
`.dockerignore` 는 `docker build` 에 넘기는 빌드 컨텍스트에서 제외할 파일의 패턴을 적는 파일로, 컨텍스트의 루트 디렉터리에 둡니다. 패턴에 맞는 파일은 빌더로 보내기 전에 컨텍스트에서 빠지기 때문에, 의존성 디렉터리나 빌드 산출물처럼 큰 것을 빼면 전송량이 줄어 빌드가 빨라집니다. `COPY . .` 를 써도 제외된 파일은 이미지에 들어가지 않아서 `.env` 같은 비밀 파일이 실수로 담기는 것도 막을 수 있습니다. `!` 로 제외의 예외를 줄 수 있고 `**` 는 여러 단계의 디렉터리에 매칭됩니다.

```text
build/
.env
```

(공식 문서) Build context 페이지는 `.dockerignore` 가 컨텍스트 루트에 있으면 패턴에 맞는 파일과 디렉터리가 빌더로 보내지기 전에 컨텍스트에서 제거되고, 원치 않는 파일을 빌더에 보내지 않아 특히 원격 빌더에서 빌드 속도가 개선된다고 한다. 패턴은 Go의 `filepath.Match` 규칙을 따르고 `**` 는 여러 단계 디렉터리에 매칭되며 `!` 로 예외를 줄 수 있다고 한다. Dockerfile 이름에 맞춘 `<Dockerfile이름>.dockerignore` 가 루트의 `.dockerignore` 보다 우선한다고도 한다. best-practices 페이지도 `.dockerignore` 로 빌드와 무관한 파일을 제외하라고 한다.
(실험 확인) 40MB 임의 파일이 든 `build/` 디렉터리, 작은 `src/` 디렉터리, `.env` 파일이 있는 컨텍스트에서 `COPY . /app` 을 하는 busybox:1.36 기반 빌드를 했다(Docker Engine 29.6.1). `.dockerignore` 가 없으면 `transferring context: 40.01MB`(2026-10-20 재실행)였고 이미지의 `/app` 에 `.env` 와 `build` 가 있었다. 위 두 줄을 `.dockerignore` 에 넣으면 컨텍스트 전송이 132B로 줄었고 `/app` 에는 `.env` 와 `build` 가 없었다(`Dockerfile` 과 `.dockerignore` 자체는 `/app` 에 복사됐다).
(보충) `.env` 같은 비밀 파일이 실수로 이미지에 담기는 것을 막는다는 설명은 위 실험으로 확인한 일반 설명이며, 문서는 빌드 속도 개선을 이유로 든다.
