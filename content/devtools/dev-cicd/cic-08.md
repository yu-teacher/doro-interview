---
slug: "cic-08"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "GitHub Actions에서 의존성 캐시는 어떻게 동작하고, 캐시 키는 어떻게 설계하나요?"
keywords: ["key가 정확히 일치하면 cache hit", "restore-keys 접두사 일치", "의존성 파일 해시로 key 구성", "cache miss면 성공 후 저장", "저장된 캐시는 수정 불가"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching", "https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching", "https://docs.github.com/en/actions/tutorials/build-and-test-code/java-with-gradle"]
concepts: [ci-pipeline]
importance: 2
links: [{to: "cic-03", kind: PREREQ}, {to: "bld-21", kind: RELATED}]
---
**모범 답변 (30~60초)**
`actions/cache`는 `key`가 정확히 일치하는 캐시를 찾아 `path`로 복원하고(cache hit), 없으면(cache miss) job이 성공으로 끝날 때 그 key로 새 캐시를 저장합니다. 한 번 저장된 캐시의 내용은 바꿀 수 없어서 내용이 달라지려면 key가 달라야 합니다. 그래서 key를 OS와 의존성 정의 파일의 해시로 만들어, 의존성이 바뀌면 새 캐시가 생기고 안 바뀌면 재사용되게 합니다. `restore-keys`는 정확히 일치하는 캐시가 없을 때 접두사가 맞는 가장 최근 캐시를 순서대로 찾아 복원해서, 처음부터 전부 내려받는 일을 줄여 줍니다. 캐시는 없어도 job이 동작해야 하고, 비밀값은 절대 담지 않습니다.

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.gradle/caches
      ~/.gradle/wrapper
    key: ${{ runner.os }}-gradle-${{ hashFiles('**/*.gradle*', '**/gradle-wrapper.properties') }}
    restore-keys: |
      ${{ runner.os }}-gradle-
```

(공식 문서) Dependency caching reference 문서는 먼저 key의 정확 일치를 찾고, 없으면 `restore-keys`를 차례로 부분 일치로 검사하며, 여러 개가 맞으면 가장 최근에 만든 캐시를 쓴다고 한다. cache miss에서 job이 성공하면 새 캐시가 자동 생성되고, 기존 캐시의 내용은 바꿀 수 없으며 새 key로 새로 만들어야 한다고 한다. key는 최대 512자다. 캐시는 현재 브랜치와 기본 브랜치(PR이면 베이스 브랜치 포함)의 것만 복원할 수 있고, 7일간 쓰이지 않으면 삭제되며 저장소당 기본 10 GB 한도를 넘으면 오래된 것부터 지운다. 캐시 내용은 서명·검증되지 않으므로 신뢰할 수 없는 입력으로 취급하고 secret을 넣지 말라고 한다. 같은 문서의 표는 Gradle과 Maven은 `setup-java`로, npm은 `setup-node`로 캐시를 설정할 수 있다고 하고, Building and testing Java with Gradle 문서는 `gradle/actions/setup-gradle`이 기본으로 캐시를 해 준다고 한다(2026-10-20 원문 확인). 캐시 동작은 GitHub 서버가 필요해 실험하지 않았다.
