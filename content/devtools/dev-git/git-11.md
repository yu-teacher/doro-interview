---
slug: "git-11"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "이미 원격에 push한 잘못된 커밋을 되돌리려면 reset, revert, restore 중 무엇을 쓰고 그 차이는 무엇인가요?"
keywords: ["revert는 되돌리는 새 커밋", "reset은 브랜치 포인터 이동", "restore는 파일만 복원", "히스토리 재작성 여부", "공유 브랜치에는 revert"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git", "https://git-scm.com/docs/git-revert", "https://git-scm.com/docs/git-reset", "https://git-scm.com/docs/git-restore", "https://git-scm.com/docs/git-push"]
concepts: [git-undo]
importance: 3
links: [{to: "git-18", kind: FOLLOWUP}, {to: "git-20", kind: FOLLOWUP}, {to: "git-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
이미 공유한 커밋은 revert가 안전합니다. git revert는 지정한 커밋의 변경을 거꾸로 적용하는 새 커밋을 추가해서 기존 히스토리를 건드리지 않습니다. git reset은 브랜치 포인터를 옮겨 커밋을 히스토리에서 빼는 것이라 히스토리가 바뀌므로, push한 뒤에 쓰면 원격에 force push가 필요해 동료에게 문제가 됩니다. git restore는 브랜치를 옮기지 않고 워킹 트리나 index의 파일만 다른 커밋이나 index 내용으로 되돌립니다. 아직 push하지 않은 내 커밋을 없앨 때는 reset을 써도 됩니다.

(공식 문서) git(1) 문서의 'Reset, restore and revert' 절은 `revert`가 다른 커밋의 변경을 되돌리는 새 커밋을 만들고, `restore`는 index나 다른 커밋에서 워킹 트리 파일을 복원하며 브랜치를 갱신하지 않고, `reset`은 브랜치 끝을 옮겨 커밋을 추가하거나 제거하므로 히스토리를 바꾼다고 구분한다. git-restore 문서는 `--staged`면 기본 원본이 HEAD이고 아니면 index라고 하며, git-reset 문서는 `git reset <pathspec>`이 `git restore --staged <pathspec>`와 같다고 한다. git-push 문서는 보통 원격 ref가 로컬 ref의 조상이 아니면 갱신을 거부하며 `--force`가 이 검사를 끈다고 한다.
(실험 확인) Git 2.50.1에서 c1, c2, c3 위에 `git revert --no-edit HEAD`를 하자 로그가 `Revert "c3"` 위에 c3·c2·c1이 그대로 남았고 파일 내용만 c2로 돌아갔다. 파일을 고쳐 `git add`한 뒤 `git reset f`와 `git restore --staged f`는 둘 다 스테이징만 취소해 ` M f`가 되었고, `git restore f`는 워킹 트리 수정을 index 내용으로, `git restore --source=<과거 커밋> f`는 그 커밋의 내용으로 되돌렸다. 원격에 push한 c3를 `git reset --hard HEAD~1`로 지우고 `git push`를 하자 `[rejected] main -> main (non-fast-forward)`로 거부되었다.
