---
slug: "dkr-10"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "도커 이미지 크기를 줄이는 방법에는 어떤 것들이 있나요?"
keywords: ["작은 베이스 이미지", "멀티 스테이지 빌드", "불필요한 패키지 설치 금지", "같은 RUN에서 캐시 정리", "dockerignore로 컨텍스트 축소"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/building/best-practices/", "https://docs.docker.com/build/building/multi-stage/", "https://docs.docker.com/build/building/context/"]
concepts: [container]
importance: 2
links: [{to: "dkr-19", kind: FOLLOWUP}, {to: "dkr-09", kind: PREREQ}]
---
**모범 답변 (30~60초)**
먼저 요구 사항에 맞는 작은 베이스 이미지를 고르고, 멀티 스테이지 빌드로 컴파일러 같은 빌드 도구를 최종 이미지에서 뺍니다. 공식 문서는 있으면 좋을 것 같다는 이유로 불필요한 패키지를 설치하지 말라고 하고, `apt-get` 캐시는 설치와 같은 `RUN` 안에서 지우라고 합니다. 레이어에 한번 들어간 파일은 나중 명령에서 지워도 이미지 크기가 줄지 않기 때문입니다. `.dockerignore` 로 빌드 컨텍스트에서 필요 없는 파일을 빼면 `COPY . .` 로 이미지에 딸려 들어가는 것도 줄일 수 있습니다.

(공식 문서) best-practices 페이지는 신뢰할 수 있고 요구 사항에 맞는 최소한의 베이스 이미지를 고르면 이식성, 다운로드 속도, 이미지 크기, 취약점 수에 이롭다고 한다. 멀티 스테이지로 최종 출력에 필요한 파일만 남기라고 하고, 불필요한 패키지를 설치하지 않으면 복잡도·의존성·파일 크기·빌드 시간이 줄어든다고 한다. 또 `apt-get update` 와 `install` 을 같은 RUN에서 하고 `/var/lib/apt/lists` 를 지우면 apt 캐시가 레이어에 저장되지 않아 이미지 크기가 줄어든다고 한다. Build context 페이지는 `.dockerignore` 로 불필요한 파일을 컨텍스트에서 빼면 빌드 속도가 개선된다고 한다(이미지 크기에 대한 직접 언급은 없다).
(실험 확인) `docker images` 의 SIZE 열로 비교한 값이다(Docker Engine 29.6.1). 실험 환경의 베이스 이미지는 busybox:1.36이 6.14MB, nginx:1.27-alpine이 76.8MB, amazoncorretto:25-alpine이 559MB, amazoncorretto:25가 851MB였다. 같은 자바 Hello 프로그램을 JDK 이미지에서 그대로 실행하는 이미지는 558MB, 멀티 스테이지로 만든 실험용 이미지는 156MB였다. 같은 RUN 안에서 큰 파일을 지우는 효과는 dkr-19에서 실험했다(2026-10-20 재실행에서 69.1MB 대 6.15MB).
(보충) `.dockerignore` 가 `COPY . .` 로 들어가는 파일을 줄여 이미지 크기에도 영향을 준다는 점은 문서가 빌드 속도로만 설명한 것을 dkr-14 실험(제외한 파일이 이미지에 없음)으로 이끌어 낸 일반 설명이다.
