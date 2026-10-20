---
slug: "git-14"
topic: "dev-git"
tier: DEEP
difficulty: 2
title: "경량 태그(lightweight)와 주석 태그(annotated)는 무엇이 다르고, 태그는 원격에 어떻게 올라가나요?"
keywords: ["경량 태그는 이름만", "주석 태그는 태그 객체", "릴리스에는 주석 태그", "태그는 push 때 따로 전송", "이미 공개한 태그 이동 금지"]
has_extra: false
status: REVIEWED
reviewed_at: 2026-10-20
sources: ["https://git-scm.com/docs/git-tag", "https://git-scm.com/docs/git-push", "https://git-scm.com/book/ko/v2/Git%EC%9D%98-%EA%B8%B0%EC%B4%88-%ED%83%9C%EA%B7%B8"]
---
**모범 답변 (30~60초)**
경량 태그는 커밋을 가리키는 이름일 뿐이고, 주석 태그는 만든 사람, 날짜, 메시지, 선택적으로 서명을 담은 별도의 태그 객체입니다. 공식 문서는 릴리스에는 주석 태그를, 개인적이거나 임시 표시에는 경량 태그를 권하고, git describe 같은 명령은 기본으로 경량 태그를 무시합니다. 태그는 일반 git push로는 올라가지 않아서 git push origin 태그이름이나 --tags로 따로 보내야 합니다. 이미 공개한 태그를 다른 커밋으로 옮기는 것은 피하고 새 이름을 쓰라고 안내합니다.

(공식 문서) git-tag 문서는 `-a`, `-s`, `-u`를 주면 태그 객체(주석 태그)를 만들며 생성 날짜, 태거 이름과 이메일, 메시지, 선택적 서명을 담고, 그렇지 않으면 객체를 직접 가리키는 경량 태그가 만들어진다고 한다. 주석 태그는 릴리스용, 경량 태그는 비공개·임시 레이블용이라 `git describe`가 기본으로 경량 태그를 무시한다고 한다. 'On Re-tagging' 절은 이미 공개한 태그는 같은 이름으로 바꾸지 말고 `X.1`처럼 다른 이름을 쓰라고 권한다. git-push 문서의 `--tags`는 `refs/tags` 아래 모든 ref를 함께 push한다고 한다. Pro Git 2.6절은 태그를 만들었으면 서버에 별도로 push해야 한다고 한다.
(실험 확인) Git 2.50.1에서 `git tag light`의 `git cat-file -t`는 `commit`, `git tag -a v1.0 -m ...`은 `tag`였고 `git cat-file -p v1.0`은 `object`, `type commit`, `tag`, `tagger` 줄과 메시지를 보여 주었다. 주석 태그를 오래된 커밋에, 경량 태그를 최신 커밋에 붙이자 `git describe`는 `v1.0-<커밋 수>-g<해시>` 형태(주석 태그 기준)였고 `git describe --tags`는 경량 태그 `light-new`였다. 빈 bare 저장소에 `git push origin main`을 한 뒤 원격의 태그는 0개였고, `git push origin v1.0` 뒤 `v1.0`만, `git push --tags` 뒤 모든 태그가 있었다. 이미 push한 `v1.0`을 `git tag -f`로 옮겨 push하자 `rejected ... (already exists)`로 거부되었다.
