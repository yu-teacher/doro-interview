# 도로 면접 (doro-interview)

자바·스프링·네트워크·DB 등 개발 면접 질문을 종합적으로 모아 두고, 내가 "완전히 학습했다"고 체크한 질문만 랜덤으로 받아 점검하는 면접 준비 서비스. [Doro](https://github.com/yu-teacher) 플랫폼의 서브 서비스(`/interview/`)입니다.

- 설계: [docs/DESIGN.md](docs/DESIGN.md)
- 착수 계획: [M0](docs/M0-PLAN.md) · [M1](docs/M1-PLAN.md) · 검수 트랙: [docs/REVIEW-TRACK.md](docs/REVIEW-TRACK.md)
- 배포: [docs/DEPLOY.md](docs/DEPLOY.md) (배포 리허설: `scripts/rehearse-deploy.sh`)

## 구조
- `src/` Spring Boot 백엔드. 모듈: `catalog`(사전) · `progress`(학습 진도) · `quiz`(시험) · `account`(사용자 사본) · `api`(합성). 의존 방향은 아키텍처 테스트가 강제한다.
- `content/` 질문 원본(마크다운). 빌드 때 jar 에 실리고 앱이 시작할 때 DB 에 반영한다.
- `web/` React + Vite PWA.
- `scripts/` CI·변환 도구.

## 로컬 검증
```bash
scripts/ci-test.sh backend   # 격리 Postgres 를 올려 백엔드 테스트 후 내린다
scripts/ci-test.sh web       # 프런트 린트·타입·단위 테스트·빌드·번들 예산
scripts/ci-test.sh mobile    # 모바일 레이아웃·접근성(실제 Chromium 헤드리스)
scripts/ci-test.sh e2e       # 통합 e2e(격리 DB + 백엔드 jar + 웹 + 실제 Chromium)
scripts/ci-test.sh rehearse  # 배포 리허설(실제 이미지·배포 스크립트·게이트웨이 CSP·롤백, 도커 레지스트리 필요)
```
필요: Docker, Java 25, Node 24, Python 3, Playwright 내장 Chromium(없으면 `web/` 에서 `npx playwright install chromium`; 시스템 Chrome 은 쓰지 않는다).

## 콘텐츠 추가·수정 방법
질문 원본은 `content/` 의 마크다운이다. DB 는 앱이 시작할 때 이 파일을 반영한 사본이라 DB 에 직접 쓰지 않는다.

```
content/<카테고리>/_category.yml
content/<카테고리>/<주제>/_topic.yml        # 이름, 출처 URL, 기준 버전, slug_prefix, default_evidence, published
content/<카테고리>/<주제>/<slug>.md         # YAML frontmatter + 본문(마크다운)
```

질문 파일 frontmatter: `slug`(`<주제 접두사>-<두 자리 번호>`, 한 번 정하면 바꾸지 않는다), `topic`, `tier`(BASIC/DEEP/TRICKY), `difficulty`(1~3), `title`, `keywords`, `has_extra`(본문에 `(보충)` 표기가 있는지), `status`(DRAFT/REVIEWED), `reviewed_at`(REVIEWED 일 때). 본문은 `**모범 답변`으로 시작하고 `(공식 문서)`/`(보충)`/`(실험 확인)` 표기를 그대로 둔다.

- **검수**: 공식 문서와 대조해 `status: REVIEWED` + `reviewed_at: YYYY-MM-DD` 로 바꾼다. 주제 전체가 검수되면 `_topic.yml` 의 `published: true` 로 공개한다(검수 전 질문이 있는 주제는 공개할 수 없다).
- **선택 메타데이터**(없어도 된다, 모두 해시·`needs_review` 에 영향을 주지 않는다):
  - `sources: ["https://…"]` 그 질문을 검수하며 실제로 대조한 출처(http/https, 20개 이하).
  - `concepts: [proxy, tx-boundary]` 개념 태그, **질문당 1~3개**. 값은 `content/_concepts.yml`(`concepts:` 목록의 `slug`·`name`·`description`, 파일 순서가 표시 순서) 안에 있어야 한다.
  - `importance: 1~3` 필수도(3 필수, 2 자주, 1 심화). **판단하지 않았으면 쓰지 않는다**(미분류). 기준은 `docs/REVIEW-TRACK.md` §9.3.
  - `links: [{to: "tx-03", kind: FOLLOWUP}]` 질문 연결. 종류 `FOLLOWUP`(이어 물을 질문)·`PREREQ`(먼저 알아야 할 질문)·`RELATED`(함께 볼 질문, 방향 없음). 이 질문에서 나가는 연결만 적고 질문당 5개 이하, 같은 (대상, 종류) 중복과 자기 연결 금지, `FOLLOWUP`·`PREREQ` 순환 금지.
- **질문 삭제**: 파일을 지우면 DB 에서 지워지지 않고 `retired_at` 으로 닫힌다(학습 기록 보존). 닫힌 질문은 개념·연결 소속을 잃는다. **다른 질문 파일의 `links` 가 그 질문을 가리키고 있으면 로드가 거부되니 그 연결을 먼저 지운다.**
- **검증**: `scripts/ci-test.sh backend` 의 콘텐츠 정합성 테스트가 형식·중복·개수를 검사한다. 질문 수를 바꾸면 `ContentIntegrityTest`·`RealContentLoadTest` 의 기대 수도 같은 커밋에서 고친다.
- **시드 변환**(일회성): `python3 -I scripts/convert_seed.py --seed <시드 디렉터리> --out content`. slug 는 첫 변환 때만 매기고 이후 제목으로 찾아 유지한다.
