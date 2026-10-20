---
slug: "cic-09"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "matrix 전략은 무엇이고, include·exclude, fail-fast는 어떻게 동작하나요?"
keywords: ["변수 조합마다 job 생성", "include로 조합 추가·확장", "exclude로 조합 제외", "fail-fast 기본 동작", "버전 값은 문자열로 따옴표"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/run-job-variations", "https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax", "https://docs.github.com/en/actions/tutorials/build-and-test-code/java-with-gradle"]
---
**모범 답변 (30~60초)**
matrix는 job 정의 하나에 변수와 값 목록을 주면 모든 조합마다 job을 자동으로 만들어 주는 기능입니다. 예를 들어 JDK 두 개와 OS 두 개를 주면 job이 네 개 돕니다. `include`는 기존 조합에 변수를 덧붙이거나 새 조합을 추가하고, `exclude`는 특정 조합을 뺍니다. `include`는 `exclude` 처리가 모두 끝난 뒤에 처리됩니다. `fail-fast`는 기본값이 true라서 한 조합이 실패하면 진행 중이거나 대기 중인 나머지 조합이 취소되고, 실험용 조합은 `continue-on-error`를 true로 두어 실패해도 다른 조합에 영향이 없게 합니다. 버전 값은 `'17'`처럼 문자열로 적는 것이 안전합니다.

```yaml
on: push
jobs:
  test:
    runs-on: ${{ matrix.os }}
    continue-on-error: ${{ matrix.experimental }}
    strategy:
      fail-fast: true
      matrix:
        os: [ubuntu-latest, windows-latest]
        java: ['17', '21']
        experimental: [false]
        exclude:
          - os: windows-latest
            java: '17'
        include:
          - os: ubuntu-latest
            java: '25'
            experimental: true
    steps:
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: ${{ matrix.java }}
      - run: java -version
```

(공식 문서) Running variations of jobs 문서는 `matrix`에 준 변수의 가능한 모든 조합마다 job이 하나씩 실행된다고 하고, `include`는 기존 조합에 겹치지 않는 값을 덧붙이거나 덧붙일 수 없으면 새 조합으로 추가하며 `exclude`는 조합을 제거한다고 설명한다. workflow 문법 문서는 모든 `exclude`가 처리된 뒤에 `include`가 처리되고(제외한 조합을 `include`로 다시 넣을 수 있다), `fail-fast`의 기본값은 true이며, `continue-on-error`가 true인 조합이 실패해도 다른 조합은 계속 실행된다고 한다. 이 문서의 `max-parallel` 절에는 기본적으로 runner 가용성에 따라 최대한 병렬 실행한다는 한 문장뿐이라 상한 설정에 대한 설명은 원문에서 확인하지 못해 답변에서 뺐다. Building and testing Java with Gradle 문서의 `setup-java` 예제도 `java-version`을 `'11'`처럼 따옴표로 쓴다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. PyYAML 6.0.3으로 `python: [3.9, 3.10, 3.11]`을 읽으면 `3.10`이 숫자 3.1이 되어 `[3.9, 3.1, 3.11]`로 나왔고, `'3.10'`처럼 따옴표를 붙이면 문자열로 유지됐다. 이것은 일반적인 YAML 파서 동작을 보인 것이며 GitHub가 같은 파서를 쓴다는 증명은 아니다. 조합 생성과 취소는 GitHub 서버가 필요해 실험하지 않았다.
(보충) JDK 버전이 `21`처럼 정수로 읽혀도 문제가 없는 경우가 많지만 `21.0`이나 `3.10` 같은 값은 해석이 달라질 수 있어 문자열로 적는 습관이 안전하다는 점은 일반적인 실무 조언이다.
