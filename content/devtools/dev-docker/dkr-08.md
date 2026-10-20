---
slug: "dkr-08"
topic: "dev-docker"
tier: DEEP
difficulty: 2
title: "Docker 빌드 캐시는 어떻게 동작하고, Dockerfile 명령 순서는 왜 중요한가요?"
keywords: ["명령마다 레이어 캐시", "변경 시 이후 레이어 무효화", "자주 바뀌는 것을 아래에", "의존성 파일 먼저 COPY", "--no-cache"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.docker.com/build/cache/", "https://docs.docker.com/build/cache/invalidation/", "https://docs.docker.com/get-started/docker-concepts/building-images/using-the-build-cache/", "https://docs.docker.com/build/building/best-practices/"]
---
**모범 답변 (30~60초)**
Dockerfile의 각 명령은 레이어가 되고, 빌드는 명령마다 캐시에 같은 것이 있으면 다시 실행하지 않고 재사용합니다. 한 레이어의 캐시가 무효화되면 그 뒤 레이어는 모두 다시 실행됩니다. 그래서 덜 바뀌는 명령을 위에, 자주 바뀌는 명령을 아래에 둡니다. 소스 전체를 먼저 `COPY` 하면 코드 한 줄만 바뀌어도 의존성 설치가 다시 도니, 의존성 정의 파일만 먼저 복사해 설치하고 그다음 소스를 복사합니다. `RUN` 은 명령 문자열만 비교하므로 패키지가 새로 나와도 자동 갱신되지 않아, 필요하면 `--no-cache` 로 다시 빌드합니다.

```dockerfile
FROM busybox:1.36
WORKDIR /app
COPY deps.txt .                  # 의존성 정의 파일만 먼저
RUN echo "installing deps" && sleep 2 && cat deps.txt > /deps.out
COPY app.txt .                   # 자주 바뀌는 소스는 나중에
CMD ["cat", "/app/app.txt"]
```

(공식 문서) Build cache 페이지는 레이어가 바뀌면 그 레이어를 다시 빌드해야 하고, 한 레이어가 바뀌면 뒤따르는 모든 레이어가 영향을 받아 결과가 같아도 다시 실행된다고 한다. Cache invalidation 페이지는 ADD와 COPY는 파일 메타데이터로 체크섬을 계산해 캐시 유효성을 판단하며 수정 시각(mtime)은 포함하지 않고, 그 밖의 명령은 컨테이너 안의 파일이 아니라 명령 문자열만으로 캐시 일치를 찾는다고 한다. RUN 캐시는 자동으로 무효화되지 않아 일주일 뒤 다시 빌드해도 같은 패키지를 얻으며, `--no-cache` 나 `docker builder prune` 으로 다시 실행하게 할 수 있다고 한다. 캐시를 재사용하려면 덜 바뀌는 명령에서 더 자주 바뀌는 명령 순으로 두라고 하고, Using the build cache 페이지는 package.json만 먼저 복사해 의존성을 설치한 뒤 나머지를 복사하는 구조를 안내한다.
(실험 확인) busybox:1.36 기반 두 Dockerfile을 비교했다(Docker Engine 29.6.1, BuildKit 진행 로그 `--progress=plain`). `COPY . .` 후 `RUN` 으로 의존성을 설치하는 구조는 `app.txt` 만 바꿔도 `COPY` 와 `RUN` 이 다시 실행됐다(`installing deps` 출력). 위 Dockerfile처럼 의존성 파일을 먼저 복사하는 구조는 같은 변경에서 `COPY deps.txt` 와 `RUN` 이 `CACHED` 였고 마지막 `COPY app.txt` 만 다시 실행됐다. 같은 Dockerfile에서 `app.txt` 의 수정 시각만 바꾸고 내용은 그대로 두면 `COPY app.txt` 도 `CACHED` 였다(문서의 mtime 비포함 설명과 일치).
