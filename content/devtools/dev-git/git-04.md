---
slug: "git-04"
topic: "dev-git"
tier: BASIC
difficulty: 1
title: "git fetch와 git pull은 무엇이 다른가요? 로컬과 원격이 갈라졌을 때 pull은 어떻게 동작하나요?"
keywords: ["fetch는 원격 추적 브랜치만 갱신", "pull은 fetch 후 통합", "내 브랜치와 워킹 트리는 그대로", "갈라진 경우 합치는 방법 지정", "--rebase, --ff-only"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-fetch", "https://git-scm.com/docs/git-pull/2.50.0", "https://git-scm.com/docs/git-pull", "https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%A6%AC%EB%AA%A8%ED%8A%B8-%EB%B8%8C%EB%9E%9C%EC%B9%98"]
concepts: [git-branching]
importance: 3
links: [{to: "git-07", kind: FOLLOWUP}, {to: "git-21", kind: FOLLOWUP}, {to: "git-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
git fetch는 원격의 새 커밋을 받아 origin/main 같은 원격 추적 브랜치만 갱신하고, 내 로컬 브랜치와 워킹 트리는 건드리지 않습니다. git pull은 fetch를 한 뒤 그 결과를 현재 브랜치에 merge나 rebase로 통합하는 명령입니다. 내 브랜치가 단순히 뒤처진 경우에는 fast-forward로 따라가지만, 로컬과 원격에 서로 다른 커밋이 생겨 갈라졌다면 Git 2.50에서는 합치는 방법을 정하라며 중단합니다. 그래서 --rebase, --no-rebase, --ff-only 중 하나를 지정하거나 pull.rebase 설정을 둡니다.

(공식 문서) git-fetch 문서는 원격에서 브랜치와 태그를 객체와 함께 받아 오고 원격 추적 브랜치를 갱신하며, 받은 ref 이름은 `.git/FETCH_HEAD`에 기록된다고 한다. git-pull 2.50.0 문서는 현재 브랜치가 원격보다 뒤처졌으면 기본으로 fast-forward하고, 갈라졌으면 `--rebase` 또는 `--no-rebase`(또는 `pull.rebase` 설정)로 조정 방법을 지정해야 한다고 한다. 이 동작은 버전에 따라 달라서, 2.55.0에서 갱신된 최신 문서는 `--ff-only`를 기본으로 적고 있으니 쓰는 버전의 문서를 확인해야 한다. Pro Git 3.5절은 fetch가 워킹 디렉터리 파일을 바꾸지 않으며, 일반적으로 fetch와 merge를 명시적으로 쓰는 편이 pull보다 낫다고 한다.
(실험 확인) Git 2.50.1에서 원격에 커밋이 생긴 뒤 `git fetch`를 하자 `origin/main`만 앞으로 이동했고 `main`과 워킹 트리 파일 내용은 그대로였으며 상태는 `[behind 1]`이었다. 이후 `git pull`은 Fast-forward로 따라갔다. 로컬과 원격에 각각 커밋이 있는 상태(`ahead 1, behind 1`)에서 설정 없이 `git pull`을 하자 `fatal: Need to specify how to reconcile divergent branches.`로 중단되었다. `--ff-only`는 `Not possible to fast-forward, aborting.`, `--rebase`는 내 커밋을 원격 커밋 위로 옮겨 선형 히스토리를 만들었다.
