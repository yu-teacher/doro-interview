---
slug: "git-12"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "작업 중인 변경을 잠시 치워 두는 `git stash`는 무엇을 저장하고, 기본으로는 무엇이 빠지나요?"
keywords: ["수정과 스테이징 변경 저장", "untracked 파일은 기본 제외", "-u 옵션", "pop은 적용 후 삭제", "충돌 시 stash 유지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-stash", "https://git-scm.com/book/ko/v2/Git-%EB%8F%84%EA%B5%AC-Stashing%EA%B3%BC-Cleaning"]
concepts: [git-undo]
importance: 2
links: [{to: "git-02", kind: PREREQ}]
---
**모범 답변 (30~60초)**
git stash는 추적 중인 파일의 수정 내용과 스테이징한 변경을 저장하고 워킹 디렉터리를 HEAD 상태로 되돌려, 브랜치를 바꾸거나 급한 일을 먼저 처리할 수 있게 합니다. 기본으로는 추적되지 않는 새 파일은 stash에 들어가지 않고 그대로 남으며, 포함하려면 -u 옵션을 씁니다. git stash pop은 가장 최근 stash를 적용하고 목록에서 지우고, apply는 적용하되 목록에 남깁니다. pop 중 충돌이 나면 stash는 지워지지 않고 남으므로 해결한 뒤 직접 drop 해야 합니다.

(공식 문서) git-stash 문서는 현재 워킹 디렉터리와 index 상태를 기록하고 HEAD 커밋과 같은 깨끗한 상태로 되돌리는 명령이라고 하며, 최근 stash는 `refs/stash`에, 이전 것은 그 reflog에 저장되어 `stash@{0}`처럼 부른다고 한다. `-u`(`--include-untracked`)를 주면 추적되지 않는 파일도 stash하고, `pop`은 적용 후 목록에서 제거하되 충돌이 나면 제거하지 않는다고 한다. `apply`는 제거하지 않는다. Pro Git 7.3절도 같은 용도를 설명한다.
(실험 확인) Git 2.50.1에서 수정한 `f`, 스테이징한 새 파일 `h`, 추적되지 않는 `untracked.txt`가 있을 때 `git stash` 후 `untracked.txt`만 남아 있었다. `git stash -u -m ...`는 `untracked.txt`까지 치웠다. `-u` stash 커밋은 `parent`가 3개였다. 다른 브랜치로 옮겨서도 `git stash pop`이 적용되었다. 같은 파일을 main에서 다르게 커밋해 둔 뒤 pop하자 `CONFLICT`와 함께 `The stash entry is kept in case you need it again.`가 나왔고 stash 목록이 1개로 남았다.
