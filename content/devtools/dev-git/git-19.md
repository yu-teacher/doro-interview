---
slug: "git-19"
topic: "dev-git"
tier: TRICKY
difficulty: 2
title: "detached HEAD 상태에서 커밋하면 어떻게 되고, 그 커밋을 잃지 않으려면 어떻게 하나요?"
keywords: ["HEAD가 커밋을 직접 가리킴", "브랜치가 따라오지 않음", "다른 브랜치로 이동하면 고립", "reflog로 찾기", "git branch나 git switch -c로 보존"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/gitglossary", "https://git-scm.com/docs/git-switch", "https://git-scm.com/docs/git-reflog", "https://git-scm.com/docs/git-checkout"]
concepts: [git-internals, git-branching]
importance: 1
links: [{to: "git-03", kind: PREREQ}]
---
**모범 답변 (30~60초)**
detached HEAD는 HEAD가 브랜치가 아니라 특정 커밋을 직접 가리키는 상태입니다. 태그나 과거 커밋, origin/main 같은 원격 추적 브랜치를 체크아웃하면 이 상태가 됩니다. 여기서도 커밋은 만들어지지만 어떤 브랜치도 그 커밋을 가리키지 않아서, 다른 브랜치로 이동하면 그 커밋은 어디에도 연결되지 않은 채 남고 경고가 나오며 결국 가비지 컬렉션으로 지워질 수 있습니다. 잃지 않으려면 이동하기 전에 git switch -c 이름이나 git branch 이름 커밋으로 브랜치를 만들어야 하고, 이미 이동했다면 reflog에서 커밋 해시를 찾아 브랜치를 만듭니다.

(공식 문서) gitglossary는 HEAD가 보통 브랜치 이름을 담지만 브랜치 끝이 아닌 임의의 커밋을 체크아웃할 수도 있고 이때를 detached라 부른다고 한다. detached에서도 `git commit`은 동작해 HEAD가 새 히스토리 끝을 가리키되 어떤 브랜치도 건드리지 않으며, `--set-upstream-to`처럼 현재 브랜치를 묻는 명령은 동작하지 않는다고 한다. git-switch 문서는 `--detach`로 브랜치에서 분리해 이동할 수 있다고 한다. git-checkout 문서의 DETACHED HEAD 절은 태그(`v2.0`)나 `master^^`를 체크아웃하면 HEAD가 커밋을 직접 가리키는 detached 상태가 되고, 이 상태에서 만든 커밋은 다른 브랜치로 옮기고 나면 아무것도 가리키지 않아 결국 가비지 컬렉션으로 삭제된다고 한다. 보존하려면 `git checkout -b`/`git switch -c`, `git branch`, `git tag`로 참조를 만들고, 이미 떠났다면 reflog로 이름을 찾으라고 한다.
(실험 확인) Git 2.50.1에서 `git switch --detach HEAD~1` 후 `.git/HEAD`는 `ref:` 없이 커밋 해시 한 줄이었고 `git status` 첫 줄은 `HEAD detached at <해시>`였다. 여기서 커밋하고 `git switch main` 하자 `you are leaving 1 commit behind, not connected to any of your branches` 경고와 브랜치 만들기 안내가 나왔고, `git branch --contains`는 그 커밋을 포함하는 브랜치를 0개로 답했다. `git reflog`에는 `commit: detached work`가 남아 있었고 `git branch rescue <해시>` 후 `rescue`가 그 커밋을 포함했다. `git switch --detach origin/feat`로 원격 추적 브랜치를, `--detach t1`로 태그를 체크아웃해도 `HEAD detached at ...`이었다. detached 상태에서 `git branch --set-upstream-to`는 `could not set upstream of HEAD ... when it does not point to any branch`로 실패했다.
