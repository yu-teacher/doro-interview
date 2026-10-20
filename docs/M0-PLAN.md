# M0 착수 계획 — 뼈대와 콘텐츠 파이프라인

> 범위: [DESIGN.md](DESIGN.md) §12의 M0. **로그인·학습 체크·랜덤 면접은 이번에 만들지 않는다**(M2·M3). M0가 끝나면 "시드 159개가 검증된 콘텐츠 파일로 저장소에 있고, 앱이 그것을 DB에 멱등하게 반영하며, CI가 초록"인 상태다.

## 1. 완료 기준 (전부 만족해야 M0 종료)
1. `content/` 에 질문 파일 **159개**, 주제 **7개**(카테고리 `spring`), tier 분포 BASIC/DEEP/TRICKY, **TRICKY 39개**. 모두 `status: DRAFT`, 주제는 `published: false`.
2. 앱을 두 번 연속 기동해도 DB 행 수·`content_hash`가 같다(멱등). 파일에서 질문을 지우면 `retired_at`이 채워지고 행은 남는다.
3. 검증 테스트가 다음을 잡는다: slug 중복, 필수 필드 누락, 알 수 없는 주제·tier, 질문·모범 답변·키워드 개수 불일치(변환기).
4. CI(린트·타입·테스트)가 초록. 백엔드 테스트는 **실제 Postgres**.
5. `./gradlew bootRun` + 격리 DB에서 기동하고 `/actuator/health`가 UP.
6. 아키텍처 테스트가 모듈 의존 규칙(DESIGN §6.0)을 강제하고, 일부러 만든 위반이 실제로 빌드를 실패시킨다.

## 2. 결정 (M0 착수 전 못 박는 것)
| 항목 | 결정 | 이유 |
|---|---|---|
| 질문 slug | **`<주제약어>-<두 자리 번호>`** (예: `tx-07`) 로 변환 때 한 번 부여하고 파일에 고정 | 시드 문서 순서 기준, 한국어 제목에서 영문 의미 slug를 만드는 수고를 줄이면서 "안정 ID" 요건(제목이 바뀌어도 불변)을 만족. DESIGN §5.2를 이에 맞춰 고침 |
| 콘텐츠 파일 | **질문 1개 = 파일 1개**, `content/spring/transaction/tx-07.md`, YAML frontmatter + 본문 | 검수·diff가 질문 단위. 159개 정도는 관리 가능 |
| 주제 메타 | `content/<category>/<topic>/_topic.yml`(이름, 정렬, 설명, 출처 URL, 기준 버전, `default_evidence`, `published`), 카테고리는 `content/<category>/_category.yml` | |
| tier 매핑 | `## 기본→BASIC`, `## 심화→DEEP`, `## 꼬리 질문→TRICKY`. `## 개요`, `## 출처`, `## 버전 변화 한눈에 보기`는 질문이 아니므로 건너뜀(07의 버전 표는 주제 설명으로 옮길지 M1에서 판단) | §3.2 실측 |
| 난이도 | 초기값 BASIC=1, DEEP=2, TRICKY=3. 검수 때 조정 | |
| 근거 | 본문의 `(공식…)/(보충)/(실험 확인)` 표기는 **그대로 둔다**(M1 렌더러가 배지로 변환). `has_extra` = 본문에 `(보충)` 포함 여부. 주제 `default_evidence`: 02·06은 `OFFICIAL`(표시 없는 것은 공식이라는 문서 규칙), 나머지는 `UNKNOWN` | §3.3-3 |
| 로더 | **Java(Spring) 로더**가 시작 시 `content/`(classpath에 포함)를 읽어 upsert. YAML은 Spring Boot에 이미 있는 SnakeYAML | 배포물이 jar 하나. 서버에 파일 마운트 불필요 |
| 변환기 | **Python 표준 라이브러리만**(`scripts/convert_seed.py`), 일회성 도구로 저장소에 남김. 문자열은 `json.dumps`로 쓰면 유효한 YAML 따옴표 문자열 | 시드의 `build.py`와 같은 방식, 의존성 없음 |
| 패키지·포트 | `com.doro.interview`, API **8088**, 웹 **3007**, DB `service_interview`, 마이그레이션 테이블 `interview_schema_history` | 포트는 서버 확인 전까지 가정(DESIGN §11) |
| M0의 CI | Postgres만 올림(Guard·Redis는 M2에서 추가) | M0은 Guard를 쓰지 않음 |

## 3. 작업 순서

### S1. 저장소와 뼈대
- `doro-interview/` 에 git 초기화, `.gitignore`(games 것 + `.private/`, `.env*`, `build/`, `node_modules`), `README.md`(서비스 소개 한 단락).
- games에서 **가져올 것**: Gradle 설정(`includeBuild('../Doro')` 포함), `common/`(예외·응답·`PageLimits`), `config/FlywayConfig`·`OpenApiConfig`, `infra/guard/` 틀(M2에서 채움), `Dockerfile`, `docker-compose.ci.yml`, `scripts/ci-test.sh`, `.github/workflows/ci.yml`, 웹 PWA 틀(`web/`의 Vite·eslint·tsconfig·Playwright 설정).
- **가져오지 않을 것**: `domain/game`, `domain/idle`, `domain/auth`(embedded BFF·세션), `GamesBffConfig`/`ConditionalOnEmbeddedBff`, `domain/user/sync`(M4), 게임·농장 화면, 에셋 스크립트.
- 이름 바꾸기: `games`→`interview` (패키지, `application.yaml`, compose 컨테이너 이름, 워크플로).
- **모듈 틀**: `com.doro.interview.account`, `catalog`, `progress`, `quiz`, `api`(합성). M0에서는 `catalog`만 채우고 나머지는 `package-info.java` 한 줄만 둔다(`account`는 M2: 사용자 사본·session 엔드포인트, M4: 탈퇴 동기화). 의존 규칙(DESIGN §6.0)을 **아키텍처 테스트(ArchUnit)** 로 지금 넣는다: `catalog`·`account`는 다른 모듈에 의존 금지, `progress`는 `catalog`·`account`만, `quiz`는 `catalog`·`account`·`progress`(읽기 인터페이스)만, 모듈 사이 순환 금지. 규칙이 비어 있는 상태에서도 통과해야 하고, 위반 예시 하나를 일부러 넣어 테스트가 실제로 실패하는지 확인한 뒤 되돌린다.
- 검증: 빈 앱이 격리 Postgres에서 기동하고 health UP, `ci-test.sh backend` 통과.

### S2. 마이그레이션 V1 (콘텐츠 테이블만)
- `category`, `topic`, `question`, `question_link` (DESIGN §6). `pg_trgm` 확장과 제목·키워드 인덱스는 M1에서 추가(검색을 만들 때).
- 사용자 사본(`interview_user`)·진도(`user_progress`, `my_note`)는 **M2**, 시험(`quiz_*`)은 **M3 마이그레이션**. 모듈 사이에는 외래키를 걸지 않는다(DESIGN §6.0): `question_link`·`question` 은 `catalog` 안에서만 FK.
- 규칙: 번호는 `ls db/migration` 으로 확인 후 부여, 손으로 INSERT 하지 않음.
- 검증: 빈 DB에 마이그레이션이 적용되고, 같은 마이그레이션을 두 번 돌려도 오류가 없는지(Flyway 이력으로).

### S3. 변환기 → `content/` 생성
1. 파서: 시드 마크다운에서 `## 기본/심화/꼬리 질문` 절의 `### Q.` 블록을 추출. 블록 = 제목, 본문(모범 답변 이후 전부, 코드 펜스·배지 표기 보존), 키워드 줄.
2. 검증(실패 시 종료 코드 1): 문서별 Q 수 = 모범 답변 수 = 키워드 수, 기대 합계 159(7편: 22/20/25/23/31/21/17), TRICKY 합계 39.
3. 출력: 질문 파일(frontmatter: `slug, topic, tier, difficulty, title, keywords[], has_extra, base_version, status: DRAFT`), `_topic.yml`(출처 URL은 `## 출처` 절에서 추출), `_category.yml`.
4. 같은 입력을 두 번 변환하면 바이트까지 동일(멱등). slug는 첫 변환 때만 부여하고, 이후 기존 `content/`가 있으면 제목으로 매칭해 **slug를 유지**(번호를 재배정하지 않음).
5. 파서 단위 테스트(`scripts/test_convert_seed.py`, 표준 `unittest`): **직접 쓴 작은 샘플 문서**로 정상 변환, 개수 불일치 실패, 비질문 절 건너뜀, 코드 펜스·배지 보존. (시드 원문을 테스트에 복사하지 않는다.)
- 검증: 변환 실행 → 159/7/39 확인, `git diff`로 한 파일을 열어 원문과 대조(표본 5개: 각 tier·코드 블록 있는 것·`(보충)` 있는 것·02/06 문서에서 각 1개).

### S4. 콘텐츠 로더 (upsert)
- `ContentLoader`: 시작 시 `classpath:content/**` 순회 → 파싱 → `category`/`topic`/`question` upsert(slug 기준).
- `content_hash` = 정규화한 본문+제목+키워드의 SHA-256. 기존 행과 해시가 다르면 갱신하고 `needs_review=true`(DRAFT면 무의미하므로 `REVIEWED` 상태일 때만).
- 파일이 사라진 질문은 `retired_at = now()`(삭제 안 함). 다시 나타나면 `retired_at = null`.
- 상태(`status`, `reviewed_at`)와 주제 `published` 는 **파일이 아니라 DB가 원본**이 되지 않도록 결정: 검수 상태도 frontmatter(`status`, `reviewed_at`)로 파일에 둔다(검수가 곧 파일 변경이라 git 이력이 감사 기록). 관리 화면(M4)은 파일을 쓰지 않으므로 M4에서 "관리 화면 vs 파일" 중 하나로 정리한다 → **열린 항목**(§5).
- 한 트랜잭션으로 반영하고 실패하면 전체 롤백(반쯤 반영된 콘텐츠 방지). 기동 실패로 이어지게 하되 `content.load.fail-fast` 설정으로 끌 수 있게.
- 검증(실제 Postgres, 통합 테스트): ① 빈 DB → 159/7/1 ② 재실행 → 행 수·해시 동일 ③ 질문 파일 하나를 테스트 리소스에서 빼고 → `retired_at` 채움, 행 존재 ④ 본문을 바꾸고 → 해시 변경 ⑤ 깨진 frontmatter → 전체 롤백, DB 변화 없음.

### S5. 콘텐츠 정합성 테스트 (CI에서 항상)
`content/` 자체를 검사하는 테스트: slug 전역 유일·패턴, 주제·카테고리 참조 유효, tier 값, 필수 필드, 키워드 1개 이상, 본문 비어 있지 않음, 코드 펜스 개수 짝수, 총 159/7/39(콘텐츠가 늘면 이 기대값을 갱신하는 커밋이 따라와야 한다는 점을 테스트 주석에 적는다).

### S6. CI와 마무리
- `ci.yml`: 웹(린트·타입·테스트·빌드), 백엔드(격리 Postgres), 변환기 단위 테스트, 콘텐츠 정합성. Playwright는 **내장 Chromium 헤드리스**(`PW_CHANNEL=chrome` 쓰지 않음)이고 M0의 웹은 틀만이라 모바일 레이아웃 시험은 M1에서 켠다.
- `docs/DESIGN.md` 의 slug 문구 정정, `README.md` 에 "콘텐츠 추가 방법"(질문 파일 형식, 변환기, 검증 테스트) 한 절.
- 첫 커밋 단위: (1) 뼈대 (2) V1 마이그레이션 (3) 변환기+콘텐츠 (4) 로더 (5) 정합성 테스트·CI. 각각 테스트가 초록인 상태로 커밋.

## 4. 사용자가 해야 하는 것 (이 세션이 대신할 수 없는 것)
- GitHub 저장소 `doro-interview` 생성과 첫 푸시(Doro 레포와 같이 **푸시는 사용자**). 공개 저장소 원칙: 비밀·서버 정보·약점은 `.private/`.
- M0에서 서버 작업은 **없다**(DB 생성·게이트웨이·BFF 등록은 M2에서 한다). 8088/3007 포트 최종 확인은 M2 전에 서버에서.

## 5. 열린 항목 (M0 중에 정리)
1. **검수 상태의 원본**: 파일 frontmatter(git 이력=감사 기록) vs 관리 화면(DB). M0는 파일을 원본으로 두고 M4에서 확정. 관리 화면이 필요한지 자체가 M4 판단이다(혼자 검수한다면 파일 수정으로 충분할 수 있음).
2. 07편 "버전 변화 한눈에 보기" 표를 어디에 둘지(주제 설명 vs 별도 질문). M1.
3. 주제 약어 목록: ioc, aop, tx, mvc, jpa, boot, misc (제안, 착수 때 확정).

## 6. 위험
| 위험 | 대응 |
|---|---|
| 시드 원문에 파서가 놓치는 형식(인용문 안 `### Q.`, 중첩 코드 펜스 등) | 개수 검증이 불일치로 즉시 드러남 + 표본 대조 5개 |
| `includeBuild('../Doro')` 때문에 CI에서 Doro 레포 필요 | games `ci.yml` 의 방식(형제 디렉터리 checkout)을 그대로 쓴다 |
| 변환 결과를 사람이 전부 못 읽음 | M0는 구조 검증까지. 내용 검수는 DESIGN §5.1의 별도 트랙(트랜잭션 편부터) |
| 콘텐츠 반영 중 일부만 들어감 | 단일 트랜잭션 + 롤백 테스트(S4-⑤) |
