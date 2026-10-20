---
slug: "git-18"
topic: "dev-git"
tier: TRICKY
difficulty: 2
title: "`git reset --hard`로 커밋을 날렸을 때 `git reflog`로 복구할 수 있나요? 복구할 수 없는 것은 무엇이고 reflog는 언제까지 남나요?"
keywords: ["reflog는 ref 이동 기록", "HEAD@{n}으로 복구", "reset --hard로 복구", "미커밋 변경은 복구 불가", "로컬 전용, 만료 기한"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-reflog", "https://git-scm.com/docs/git-config", "https://git-scm.com/book/ko/v2/Git%EC%9D%98-%EB%82%B4%EB%B6%80-%EC%9A%B4%EC%98%81-%EB%B0%8F-%EB%8D%B0%EC%9D%B4%ED%84%B0-%EB%B3%B5%EA%B5%AC", "https://git-scm.com/docs/git-reset"]
concepts: [git-undo]
importance: 2
links: [{to: "git-06", kind: PREREQ}]
---
**모범 답변 (30~60초)**
커밋한 작업이라면 대부분 복구됩니다. reflog는 브랜치와 HEAD가 가리킨 위치의 이동 기록을 이 저장소 안에만 남기므로, git reflog에서 날아가기 전 위치를 찾아 git reset --hard HEAD@{1}처럼 되돌리거나 그 커밋에서 새 브랜치를 만들 수 있습니다. 하지만 커밋도 add도 하지 않은 워킹 트리 수정은 reflog에 없어서 reset --hard로 덮어쓰면 되살릴 수 없습니다. 또 reflog 항목은 영구적이지 않아서 기본 90일, 도달할 수 없는 항목은 30일 뒤 정리 대상이 되고, 다른 저장소에는 공유되지 않습니다.

(공식 문서) git-reflog 문서는 reflog가 이 로컬 저장소에서 브랜치 끝과 다른 참조가 갱신된 때를 기록하고, `HEAD@{2}`는 'HEAD가 두 번 이동하기 전 위치'를 뜻하며 `git reflog show`는 `git log -g --abbrev-commit --pretty=oneline`의 별칭이라고 한다. git-config 문서는 `gc.reflogExpire`의 기본값이 90일, `gc.reflogExpireUnreachable`의 기본값이 30일(현재 끝에서 도달 불가한 항목)이라고 한다. Pro Git 10.7절은 `git reflog`로 이동 기록을 보는 방법과, reflog에도 없을 때 `git fsck --full`의 dangling 객체를 쓰는 방법을 보여 준다.
(실험 확인) Git 2.50.1에서 c1~c4 상태에서 `git reset --hard HEAD~2` 후 `git reflog`에 `HEAD@{1}: commit: c4`가 있었고 `git reset --hard HEAD@{1}`로 c4가 되살아났다. `ORIG_HEAD`도 직전 위치(c4)를 가리켰다. 커밋하지 않고 고친 `f`(내용 `precious`)는 `reset --hard HEAD` 후 사라졌고 reflog에는 `reset: moving to HEAD` 기록만 있었다. 다만 `git add`만 하고 커밋하지 않은 새 파일은 `reset --hard` 후 파일은 없어졌어도 `git fsck --lost-found`가 `dangling blob`으로 그 내용을 가리켰다.
(보충) 90일·30일은 설정 기본값이며 저장소·서버 설정에 따라 다를 수 있다. gc가 실제로 언제 도는지는 이번에 실험하지 않았다.
