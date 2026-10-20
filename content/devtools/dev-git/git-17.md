---
slug: "git-17"
topic: "dev-git"
tier: TRICKY
difficulty: 3
title: "`git push --force`와 `--force-with-lease`는 무엇이 다르고, `--force-with-lease`가 완전히 안전하지 않은 경우는 언제인가요?"
keywords: ["--force는 무조건 덮어씀", "--force-with-lease는 기대값 확인", "원격 추적 브랜치와 비교", "백그라운드 fetch로 무력화", "기대 커밋 명시"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-push"]
concepts: [git-branching]
importance: 1
links: [{to: "git-16", kind: PREREQ}, {to: "git-21", kind: PREREQ}]
---
**모범 답변 (30~60초)**
git push --force는 원격 브랜치가 내 커밋의 조상이 아니어도 무조건 덮어써서 다른 사람이 올린 커밋을 잃게 만들 수 있습니다. --force-with-lease는 원격 브랜치가 내가 마지막으로 본 값과 같을 때만 덮어쓰고, 그 사이 누가 push했다면 거부합니다. 여기서 내가 본 값은 로컬의 원격 추적 브랜치 기록입니다. 그래서 fetch가 백그라운드에서 돌거나 내가 새 커밋을 확인하지 않고 fetch만 하면 기록이 갱신되어 보호가 무력화되며, 이때는 --force-with-lease=브랜치:기대커밋으로 기대 값을 직접 적습니다.

(공식 문서) git-push 문서는 `--force`가 non-fast-forward 거부 검사와 `--force-with-lease`의 검사까지 끄고 원격이 커밋을 잃을 수 있다고 한다. `--force-with-lease`는 원격 ref가 기대한 값일 때만 덮어쓰는 '임대(lease)'이며, 값을 따로 적지 않으면 로컬 원격 추적 브랜치의 값을 기대값으로 삼는다고 한다. 에디터 등이 백그라운드로 `git fetch`를 하면 이 보호가 쉽게 무력화되므로, `--force-with-lease=<refname>:<expect>`로 기대 값을 명시하거나 `--force-if-includes`를 함께 쓰라고 한다. 값을 적지 않는 형태의 의미는 아직 바뀔 수 있다고 적혀 있다.
(실험 확인) Git 2.50.1에서 bob이 `feature`에 B1을 push한 뒤 alice가(B1을 못 본 채) rebase해서 `git push --force`를 하자 `forced update`로 성공했고 원격 `feature`에서 B1이 사라졌다. 같은 상황에서 `--force-with-lease`는 `rejected ... (stale info)`로 거부되어 원격은 B1을 유지했다. alice가 `git fetch`한 뒤(B1은 통합하지 않고) 다시 `--force-with-lease`를 하자 성공해 B1이 사라졌다. fetch 전 값을 `--force-with-lease=feature:<fetch 전 SHA>`로 명시하면 fetch 후에도 `stale info`로 거부되었다. fetch 후 `--force-with-lease --force-if-includes`는 `remote ref updated since checkout`으로 거부되었고, 옵션 없는 일반 `git push`는 `fetch first`로 거부되었다.
