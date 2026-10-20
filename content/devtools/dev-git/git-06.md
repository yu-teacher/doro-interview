---
slug: "git-06"
topic: "dev-git"
tier: BASIC
difficulty: 2
title: "git reset의 --soft, --mixed, --hard는 무엇이 다른가요?"
keywords: ["HEAD 이동", "soft는 index와 워킹 트리 유지", "mixed는 index까지 되돌림(기본)", "hard는 워킹 트리까지 덮어씀", "미커밋 변경 유실 주의"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-reset", "https://git-scm.com/book/ko/v2/Git-%EB%8F%84%EA%B5%AC-Reset-%EB%AA%85%ED%99%95%ED%9E%88-%EC%95%8C%EA%B3%A0-%EA%B0%80%EA%B8%B0"]
---
**모범 답변 (30~60초)**
세 옵션 모두 현재 브랜치가 가리키는 커밋을 지정한 커밋으로 옮깁니다. 차이는 그다음에 index와 워킹 트리를 어디까지 맞추느냐입니다. --soft는 index와 워킹 트리를 그대로 두어 커밋만 취소한 효과가 나고, 기본값인 --mixed는 index까지 새 HEAD에 맞춰 변경이 스테이징되지 않은 상태로 워킹 트리에 남습니다. --hard는 워킹 트리까지 덮어써서 추적 파일의 수정 내용이 사라집니다. 그래서 커밋하지 않은 작업이 있을 때 --hard는 특히 조심해야 합니다.

(공식 문서) git-reset 문서는 `git reset <mode> <commit>`이 현재 브랜치 HEAD가 가리키는 커밋을 바꾸고, mode에 따라 index와 워킹 디렉터리도 맞춘다고 한다. `--mixed`(기본)는 워킹 디렉터리는 두고 index를 새 HEAD에 맞춰 아무것도 스테이징되지 않게 하고, `--soft`는 워킹 트리와 index를 그대로 두며, `--hard`는 모든 파일을 해당 커밋 버전으로 덮어쓰고 추적되지 않는 파일도 덮어쓸 수 있다고 한다. 동작 전에 `ORIG_HEAD`가 브랜치 끝으로 설정된다고도 한다. Pro Git 7.7절은 같은 내용을 HEAD, index, 워킹 디렉터리 세 트리의 관점으로 설명한다.
(실험 확인) Git 2.50.1에서 커밋 c1, c2, c3 위에 `work`로 고친 미커밋 수정이 있을 때 `git reset --X HEAD~1`의 결과는 다음과 같았다. soft는 로그가 c2까지로 줄고 상태 `MM f`에 파일 내용 `work`(c3의 변경이 스테이징된 채 유지), mixed는 상태 ` M f`에 내용 `work`, hard는 상태가 깨끗하고 파일 내용이 `2`(c2의 내용)였다. 즉 hard에서 미커밋 수정 `work`가 사라졌다. 추적되지 않는 새 파일은 hard 후에도 남았다.
