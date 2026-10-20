---
slug: "cic-13"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "Spring Boot JAR를 Docker 이미지로 빌드할 때 레이어 캐시와 멀티스테이지 빌드는 어떻게 활용하나요?"
keywords: ["레이어 캐시 무효화", "변경이 적은 파일을 먼저 COPY", "멀티스테이지로 빌드 도구 제외", "레이어드 JAR 추출", ".dockerignore"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/cache/optimize/", "https://docs.docker.com/build/building/multi-stage/", "https://docs.docker.com/build/building/best-practices/", "https://docs.spring.io/spring-boot/reference/packaging/container-images/dockerfiles.html"]
concepts: [container, ci-pipeline]
importance: 2
links: [{to: "dkr-08", kind: RELATED}, {to: "dkr-09", kind: RELATED}, {to: "bld-15", kind: RELATED}]
---
**모범 답변 (30~60초)**
Docker는 빌드 단계마다 캐시를 확인해서, 명령이나 그 명령이 쓰는 파일이 바뀌면 그 단계와 뒤 단계를 모두 다시 빌드합니다. 그래서 잘 안 바뀌는 의존성 정의 파일을 먼저 복사해 의존성 설치 레이어가 캐시에 남게 하고, 자주 바뀌는 소스는 나중에 복사합니다. 멀티스테이지 빌드는 빌드용 단계에서 결과물을 만든 뒤 실행 단계로는 필요한 파일만 `COPY --from`으로 가져가서, 컴파일러 같은 빌드 도구가 최종 이미지에 남지 않게 합니다. Spring Boot는 `jarmode` 도구로 JAR를 의존성과 애플리케이션 같은 레이어로 풀어 넣게 해서, 코드만 바뀌면 작은 레이어만 새로 만들어지게 합니다. 빌드에 필요 없는 파일은 `.dockerignore`로 빼서 컨텍스트를 작게 유지합니다.

```bash
java -Djarmode=tools -jar app.jar list-layers
docker build --progress=plain .   # 두 번째 빌드의 출력에서 CACHED 표시를 확인한다
```

(공식 문서) Optimize cache usage 문서는 명령이나 그 명령이 쓰는 파일이 바뀌지 않았을 때 캐시의 레이어를 재사용한다고 하고, 변경이 있으면 뒤 단계가 다시 빌드되므로 비싸고 잘 안 바뀌는 단계를 앞에, 자주 바뀌는 단계를 뒤에 두라고 하고, `COPY . .`를 먼저 두면 어떤 파일이 바뀌어도 의존성을 다시 설치하게 되니 패키지 관리 파일을 먼저 복사하고 의존성을 설치한 뒤 소스를 복사하라고 한다. `.dockerignore`로 컨텍스트를 작게 하라고도 한다. Multi-stage builds 문서는 여러 `FROM`으로 단계를 나누고 한 단계의 결과물만 골라 복사해 최종 이미지에 불필요한 것을 남기지 않게 한다고 하며, Building best practices 문서는 빌드용과 실행용 베이스 이미지를 나누면 공격 면이 줄어든다고 한다. Spring Boot Dockerfiles 문서는 레이어 정보가 든 JAR를 `java -Djarmode=tools -jar my-app.jar extract --layers`로 풀어 레이어별로 `COPY` 하는 멀티스테이지 예제를 보여 준다(2026-10-20 원문 확인).
(실험 확인) Docker 29.6.1(buildx v0.35.0-desktop.2)에서 `busybox:1.36`으로 같은 구조를 빌드했다. 의존성 파일 복사와 설치 레이어를 소스 복사보다 앞에 둔 Dockerfile은 소스 파일 하나를 바꿔 다시 빌드하자 의존성 단계가 CACHED로 표시되고 소스 복사 이후만 다시 실행됐다. `COPY . .`를 맨 앞에 둔 변형은 같은 변경에서 복사 이후 모든 단계가 다시 실행됐다. 단일 단계 이미지에는 빌드 중 만든 `/toolchain.bin`이 남았고 멀티스테이지 최종 이미지에는 없었다. Spring Boot 4.1.1로 만든 `bootJar`에 `list-layers`를 실행하자 `dependencies`, `spring-boot-loader`, `snapshot-dependencies`, `application` 네 레이어가 나왔다. 실제 JRE 이미지로 Spring Boot 이미지를 빌드하는 것은 실험하지 않았다.
