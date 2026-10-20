---
slug: "git-02"
topic: "dev-git"
tier: BASIC
difficulty: 1
title: "워킹 트리, 스테이징 영역(index), 저장소는 각각 무엇이고 `git add`와 `git commit`은 그 사이에서 무엇을 하나요?"
keywords: ["워킹 트리", "스테이징 영역(index)", "Git 디렉터리(저장소)", "add는 index를 갱신", "commit은 index를 스냅샷으로 기록"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/book/ko/v2/%EC%8B%9C%EC%9E%91%ED%95%98%EA%B8%B0-Git-%EA%B8%B0%EC%B4%88", "https://git-scm.com/book/ko/v2/Git-%EB%8F%84%EA%B5%AC-Reset-%EB%AA%85%ED%99%95%ED%9E%88-%EC%95%8C%EA%B3%A0-%EA%B0%80%EA%B8%B0"]
---
**모범 답변 (30~60초)**
워킹 트리는 실제로 편집하는 파일이고, 스테이징 영역(index)은 다음 커밋에 들어갈 스냅샷을 모아 두는 곳이며, 저장소(.git 디렉터리)는 커밋과 객체가 영구적으로 저장되는 곳입니다. git add는 워킹 트리의 내용을 index에 올리고, git commit은 index에 올라 있는 내용을 새 커밋으로 기록합니다. 그래서 add한 뒤 파일을 또 고치면 add 시점의 내용만 커밋되고 이후 수정은 워킹 트리에만 남습니다. git status는 이 세 영역의 차이를 보여 줍니다.

(공식 문서) Pro Git 1.3절은 Git 디렉터리가 메타데이터와 객체 데이터베이스를 저장하는 곳이고, 워킹 트리는 특정 버전을 체크아웃한 것이며, 스테이징 영역은 곧 커밋할 파일 정보를 담은 단순한 파일이고 기술 용어로는 index라고 한다. 7.7절은 HEAD(마지막 커밋 스냅샷), index(다음에 커밋할 스냅샷), 워킹 디렉터리(샌드박스)를 세 개의 트리로 설명한다.
(실험 확인) Git 2.50.1에서 새 파일은 `?? a.txt`(추적 안 됨)였다가 `git add` 뒤에 `A  a.txt`가 되었고, 이 시점에 `git cat-file --batch-all-objects --batch-check`로 센 blob 객체가 1개에서 2개로 늘어 있었다(커밋 전). 같은 파일을 add한 뒤 내용을 다시 바꾸면 상태가 `MM a.txt`였다. 이때 `git diff`는 index와 워킹 트리의 차이(v2에서 v3)를, `git diff --cached`는 HEAD와 index의 차이(v1에서 v2)를 보여 주었고, 커밋 후 HEAD의 내용은 add 시점의 v2였다.
