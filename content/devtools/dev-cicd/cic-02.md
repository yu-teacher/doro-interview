---
slug: "cic-02"
topic: "dev-cicd"
tier: BASIC
difficulty: 1
title: "자바·스프링 프로젝트의 CI/CD 파이프라인은 보통 어떤 단계로 구성되고, 각 단계에서 무슨 일을 하나요?"
keywords: ["체크아웃과 JDK 준비", "빌드와 테스트", "JAR 패키징과 아티팩트", "Docker 이미지 빌드", "테스트 통과 후 배포"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/tutorials/build-and-test-code/java-with-gradle", "https://docs.github.com/en/actions/get-started/understand-github-actions", "https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-jobs", "https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html"]
---
**모범 답변 (30~60초)**
흔한 흐름은 소스 체크아웃, JDK와 빌드 도구 준비, 빌드와 테스트, 패키징, 배포 순서입니다. Gradle 프로젝트라면 `./gradlew build` 한 번이 의존성 내려받기, 컴파일, 테스트, JAR 패키징까지 해 줍니다. 앞 단계가 실패하면 뒤 단계로 넘어가지 않게 해서 깨진 결과물이 배포되지 않도록 합니다. 패키징 결과인 JAR는 아티팩트로 저장하거나 Docker 이미지로 만들어 레지스트리에 올리고, 배포 단계에서는 그 결과물을 서버나 클러스터에 반영합니다. 스테이징과 운영에는 다시 빌드하지 않고 한 번 만든 같은 결과물을 옮기는 것이 좋습니다.

```yaml
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '21'
      - run: ./gradlew build
      - uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: build/libs/*.jar
```

(공식 문서) Building and testing Java with Gradle 문서는 Gradle 워크플로 템플릿이 저장소 체크아웃, JDK 설정, Gradle 환경 설정, Gradle Wrapper로 `build` 태스크 실행의 순서로 구성된다고 설명한다. 기본 구성에서 `build`는 의존성을 내려받고 클래스를 빌드하고 테스트를 실행하고 JAR 같은 배포 형식으로 패키징하며, 결과는 보통 `build/libs`에 생겨서 `upload-artifact`로 올릴 수 있다고 한다. Understanding GitHub Actions 문서는 job 안의 step이 순서대로 실행된다고 하고, job 사용 문서는 `needs`로 지정한 선행 job이 실패하면 그 job을 필요로 하는 job은 건너뛴다고 한다. Spring Boot Dockerfiles 문서는 JAR를 Docker 이미지로 만드는 방법을 다룬다.
(실험 확인) 위 YAML은 actionlint 1.7.12(서드파티 정적 검사 도구)로 문법 검사를 통과했다. GitHub에서 실행한 것은 아니므로 Actions의 동작을 증명한 것은 아니다.
(보충) 단계의 이름과 개수, 그리고 한 번 빌드한 결과물을 환경마다 재사용한다는 원칙은 일반적인 실무 설명이며 위 문서들이 규정한 것이 아니다.
