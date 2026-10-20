---
slug: "git-21"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "원격 추적 브랜치(origin/main)와 upstream 설정은 무엇이고, 새 브랜치에서 `git push`가 실패하는 이유는 무엇인가요?"
keywords: ["원격 추적 브랜치는 북마크", "fetch/push로만 갱신", "upstream 설정", "git push -u", "fetch --prune"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/gitglossary", "https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%A6%AC%EB%AA%A8%ED%8A%B8-%EB%B8%8C%EB%9E%9C%EC%B9%98", "https://git-scm.com/docs/git-push", "https://git-scm.com/docs/git-fetch", "https://git-scm.com/docs/git-config"]
concepts: [git-branching]
importance: 2
links: [{to: "git-17", kind: FOLLOWUP}, {to: "git-04", kind: PREREQ}]
---
**모범 답변 (30~60초)**
origin/main 같은 원격 추적 브랜치는 마지막으로 원격과 통신했을 때 그 브랜치가 어디를 가리켰는지 기억하는 로컬 북마크입니다. 직접 커밋하는 브랜치가 아니고 fetch나 push 때 자동으로 갱신됩니다. 로컬 브랜치의 upstream은 그 브랜치가 기본으로 pull과 push 대상으로 삼는 원격 브랜치로 config에 저장됩니다. 기본 설정에서 새로 만든 브랜치는 upstream이 없어서 git push가 실패하므로 git push -u origin 브랜치로 처음 한 번 연결하고, 원격에서 지워진 브랜치의 흔적은 git fetch --prune으로 정리합니다.

(공식 문서) gitglossary는 remote-tracking branch를 `refs/remotes/foo/bar` 형태로 다른 저장소의 변경을 따라가는 ref이며 직접 수정하거나 커밋을 얹지 말아야 한다고 한다. Pro Git 3.5절은 그것이 북마크와 같고 원격에 연결될 때마다 자동 갱신된다고 한다. git-push 문서의 UPSTREAM BRANCHES 절은 upstream이 `.git/config`의 `branch.<name>.remote`와 `merge`에 저장되고, 인수 없는 pull·fetch·push의 기본 대상이며, `git push --set-upstream`이나 clone으로 설정되고, `push.default=simple`(기본)에서는 이름이 같은 브랜치로 보낸다고 한다. git-config 문서는 `push.autoSetupRemote`를 true로 하면 upstream이 없는 기본 push에서 `--set-upstream`을 가정한다고 한다(`push.default`가 simple, upstream, current일 때).
(실험 확인) Git 2.50.1에서 새 브랜치 `feat`에서 `git push`는 `The current branch feat has no upstream branch.`와 `git push --set-upstream origin feat` 안내로 실패했고, `-u`로 push하자 `branch -vv`에 `[origin/feat]`가 보이고 config에 `branch.feat.remote origin`, `branch.feat.merge refs/heads/feat`가 생겼다. `.git/refs/remotes/origin/feat`는 로컬 파일이었다. `git switch --detach origin/feat`는 detached HEAD였다. 다른 곳에서 원격 `feat`를 지운 뒤 `git fetch` 후에도 `origin/feat`가 남았고 `git fetch --prune` 뒤에 사라졌으며 `status -sb`는 `[gone]`을 표시했다. upstream을 `origin/main`으로 바꾼 `feat`에서 `git push`는 upstream 이름이 현재 브랜치 이름과 다르다며 거부되었다. 이 실험은 `push.default`와 `push.autoSetupRemote`를 설정하지 않은 환경(전역 설정 없음)에서 했다.
