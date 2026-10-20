---
slug: "dkr-09"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "멀티 스테이지 빌드란 무엇이고 왜 쓰나요?"
keywords: ["FROM 여러 개로 단계 분리", "COPY --from으로 결과물만 복사", "빌드 도구는 최종 이미지에서 제외", "AS로 단계 이름 지정", "--target으로 특정 단계까지 빌드"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/building/multi-stage/", "https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/", "https://docs.docker.com/build/building/best-practices/"]
---
**모범 답변 (30~60초)**
멀티 스테이지 빌드는 Dockerfile에 `FROM` 을 여러 번 써서 단계를 나누고, 앞 단계에서 빌드한 결과물만 `COPY --from` 으로 최종 단계에 가져오는 방식입니다. 컴파일러 같은 빌드 도구는 앞 단계에 남고 최종 이미지에는 실행에 필요한 것만 들어가서, 이미지가 작아지고 공격 표면도 줄어듭니다. 단계에 `AS build` 처럼 이름을 붙여 참조하면 Dockerfile 순서를 바꿔도 깨지지 않고, `--target` 으로 특정 단계까지만 빌드할 수도 있습니다. 자바라면 JDK로 빌드하고 JRE 이미지에 jar만 담는 구성이 흔합니다.

```dockerfile
FROM amazoncorretto:25-alpine AS build
COPY Hello.java /src/Hello.java
RUN javac -d /app /src/Hello.java \
 && jlink --add-modules java.base --no-header-files --no-man-pages --output /jre
# 실험 환경에 있던 이미지만 쓰려고 최종 베이스를 nginx로 뒀다(실무에서는 알맞은 런타임 베이스를 쓴다)
FROM nginx:1.27-alpine
COPY --from=build /jre /jre
COPY --from=build /app /app
ENTRYPOINT ["/jre/bin/java", "-cp", "/app", "Hello"]
```

(공식 문서) Multi-stage builds 페이지는 여러 `FROM` 이 각각 새 빌드 단계를 시작하고 한 단계의 결과물을 선택적으로 다른 단계에 복사해 원하지 않는 것은 최종 이미지에 남기지 않는다고 한다. 단계에는 `AS <NAME>` 으로 이름을 붙일 수 있고 `COPY --from=<이름>` 으로 참조하며, `docker build --target <단계>` 로 특정 단계에서 멈출 수 있고, BuildKit은 대상 단계가 의존하는 단계만 빌드한다고 한다. best-practices 페이지는 멀티 스테이지가 빌드와 최종 출력을 분리해 최종 이미지 크기를 줄이고, 빌드·테스트용과 운영용 베이스 이미지를 따로 쓰면 공격 표면이 줄어든다고 한다.
(실험 확인) 위 Dockerfile은 JDK가 든 amazoncorretto:25-alpine(OpenJDK 25.0.4.1)에서 `javac` 로 컴파일하고 `jlink` 로 `java.base` 만 담은 런타임을 만들어, 로컬에 있던 nginx:1.27-alpine에 복사한 실험용 구성이다. 실행하면 `hello from java 25.0.4.1+10-LTS` 가 나왔고 최종 이미지에서 `javac` 는 없었다. `docker images` 의 SIZE는 JDK 이미지를 그대로 쓴 단일 스테이지가 558MB, 위 멀티 스테이지 결과가 156MB였다. 알파인 이미지에는 `objcopy` 가 없어 `jlink --strip-debug` 가 실패해서 뺐다. Docker Engine 29.6.1.
(보충) "자바는 JDK로 빌드하고 JRE 이미지에 jar만 담는다"는 일반적인 구성 설명이며 공식 문서의 예시는 Go 프로그램이다.
