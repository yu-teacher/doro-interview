---
slug: "cic-10"
topic: "dev-cicd"
tier: DEEP
difficulty: 2
title: "아티팩트(artifact)와 캐시는 어떻게 다르고, job 사이에 빌드 결과물을 넘기려면 어떻게 하나요?"
keywords: ["캐시는 재생성 가능한 의존성", "아티팩트는 실행 결과 파일", "upload-artifact와 download-artifact", "retention-days 보존 기간", "job마다 별도 가상 머신"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://docs.github.com/en/actions/concepts/workflows-and-actions/workflow-artifacts", "https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching", "https://docs.github.com/en/actions/tutorials/store-and-share-data", "https://docs.github.com/en/actions/get-started/understand-github-actions"]
---
**모범 답변 (30~60초)**
캐시는 의존성처럼 자주 안 바뀌고 다시 만들 수 있는 파일을 실행 사이에 재사용해 속도를 높이는 용도라서, 캐시가 없어도 job은 동작해야 합니다. 아티팩트는 job이 만든 JAR, 테스트 결과, 로그 같은 파일을 실행이 끝난 뒤에도 보관하거나 같은 워크플로의 다른 job에 넘기는 용도입니다. job마다 별도 가상 머신에서 돌기 때문에 빌드 job에서 `actions/upload-artifact`로 올리고, 배포 job에서 `needs`로 순서를 건 뒤 `actions/download-artifact`로 받습니다. 보존 기간은 `retention-days`로 정하되 저장소나 조직 한도를 넘을 수 없습니다. 이렇게 하면 테스트를 통과한 바로 그 JAR를 배포할 수 있습니다.

```yaml
on: push
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - run: ./gradlew build
      - uses: actions/upload-artifact@v4
        with:
          name: app-jar
          path: build/libs/*.jar
          retention-days: 5
  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v5
        with:
          name: app-jar
      - run: ls
```

(공식 문서) Workflow artifacts 문서는 아티팩트를 워크플로 실행 중에 만들어진 파일로, job이 끝난 뒤에도 남기고 같은 워크플로의 다른 job과 공유하게 해 준다고 설명한다. 캐시는 의존성처럼 자주 안 바뀌고 재생성 비용이 큰 파일을 재사용하는 용도이며 job은 캐시가 없어도 파일을 다시 받거나 만들 수 있어야 하고, 둘은 서로 바꿔 쓸 수 없다고 한다. Store and share data 문서는 `upload-artifact`의 `name`을 주지 않으면 기본 이름이 `artifact`이고, `retention-days`는 저장소·조직·엔터프라이즈가 정한 한도를 넘을 수 없으며, `download-artifact`로 이름을 지정해 받거나 이름을 생략해 전부 받을 수 있다고 한다. 실행을 삭제하면 그 실행의 아티팩트도 함께 삭제된다(2026-10-20 원문 확인).
(실험 확인) 위 YAML은 actionlint 1.7.12로 문법 검사를 통과했다. 업로드와 다운로드가 실제로 동작하는지는 GitHub 서버가 필요해 실험하지 않았다.
