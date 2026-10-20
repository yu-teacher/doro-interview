---
slug: "git-10"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "merge와 rebase는 결과 히스토리가 어떻게 다르고, 어떤 기준으로 고르나요?"
keywords: ["merge는 히스토리 보존", "rebase는 커밋을 새로 만들어 이식", "선형 히스토리", "최종 파일 내용은 동일", "공유 브랜치에는 merge"]
has_extra: true
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-rebase", "https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-Rebase-%ED%95%98%EA%B8%B0"]
---
**모범 답변 (30~60초)**
둘 다 한 브랜치의 변경을 다른 브랜치에 합치는 방법이고 최종 파일 내용은 같을 수 있지만 히스토리가 다릅니다. merge는 기존 커밋을 그대로 두고 두 갈래를 부모로 가진 merge 커밋을 추가해 실제 진행 과정을 보존합니다. rebase는 내 브랜치의 커밋들을 대상 브랜치 끝 위에 하나씩 다시 적용해서 내용은 같지만 해시가 다른 새 커밋을 만들고, 그 결과 히스토리가 선형이 됩니다. 아직 공개하지 않은 내 작업을 정리해 올릴 때는 rebase, 이미 공유된 브랜치에서는 merge를 쓰는 식으로 구분합니다.

(공식 문서) git-rebase 문서는 rebase를 한 브랜치의 커밋들을 다른 시작점 위로 옮겨 재적용하는 것으로 설명하며, 내부적으로 `git cherry-pick`을 하나씩 하는 것과 비슷하고 끝나면 브랜치를 마지막 커밋으로 갱신한다고 한다. 시작할 때 `ORIG_HEAD`가 이전 끝을 가리키고, 이전 끝은 reflog의 `@{1}`로도 찾을 수 있다고 한다. Pro Git 3.6절은 merge와 rebase는 합치는 관점에서 최종 결과물이 같고 커밋 히스토리만 다르다고 하며, rebase는 기존 커밋을 그대로 쓰는 게 아니라 내용이 같은 다른 커밋을 새로 만든다고 하고, 이미 공개 저장소에 push한 커밋은 rebase하지 말라고 한다.
(실험 확인) Git 2.50.1에서 `topic`의 커밋 T1, T2를 `main`(M1이 추가됨) 위로 `git rebase main` 하자 T1과 T2의 해시가 모두 바뀌었고 그래프가 직선이 되었다. 변경 내용을 나타내는 `git patch-id`는 전후가 같았다. `ORIG_HEAD`는 rebase 전 끝을 가리켰고, reflog에 `rebase (pick)` 기록이 남았다. 이후 `main`에서 `git merge topic`은 fast-forward였다.
(보충) 어느 쪽이 팀에 맞는지는 문서가 정하지 않으며 팀 규칙의 문제다. 위의 구분 기준은 일반적인 실무 관행이다.
