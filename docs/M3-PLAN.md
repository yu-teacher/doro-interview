# M3 상세 계획: 랜덤 면접 (체크한 질문 풀) + 오답 후보 + 현황 + 퀴즈

> 상태: **초안 (2026-10-20)**. §10 의 결정 질문에 답이 오면 확정하고 S1 부터 구현한다. 기준: [DESIGN.md](DESIGN.md) §6~§9·§12(M3), [M2-PLAN.md](M2-PLAN.md) §13(M2 결과·인터페이스 §5).
> 이 문서는 구현 순서와 시험 기준을 정한다. 제품 규칙(풀·가중치·평가)은 DESIGN §7 이 원본이고 여기서 다시 정의하지 않는다.

## 1. 목표와 비목표

**목표**: 사용자가 사전에서 "완전히 학습함"으로 체크한 질문만으로 랜덤 면접을 보고, 맞음/틀림을 기록하고, 틀린 질문을 사전·홈에서 "다시 공부 후보"로 보게 한다. 현황(진도·최근 30일 출제량·정답률·자주 틀린 질문)을 보여 준다.

**비목표**: 간격 반복(`due_at/interval`), AI 피드백(M6), 학습 연속 일수(홈), 편집자 화면·Guard(M4), 체크 자동 해제(틀려도 체크는 건드리지 않는다: DESIGN 결정 3).

## 2. 가정 (착수 전 확인할 것)

| # | 가정 | 확인 방법 |
|---|---|---|
| A1 | 게이트웨이 `limit_except GET HEAD PUT` 때문에 **POST 는 403** 이다(M2 S8, 시험으로 고정). 시험 쓰기를 PUT 으로 설계하면 **Doro PR·서버 반영 없이** 배포된다 | D1 결정, S4 의 게이트웨이 통과 시험(통합 e2e) |
| A2 | `ProgressReader.learnedAmong/learnedSlugs` 로 풀을 만들 수 있다(M2 §5 에서 정함). 풀 = 보이는 질문 ∩ 내 체크 | S3 시험(비공개·닫힌 질문이 풀에 없음) |
| A3 | `catalog` 에는 "보이는 질문의 (slug, 주제, 카테고리, tier)" 전체를 한 번에 주는 좁은 조회가 아직 없다 | S2 에서 추가 |
| A4 | 서비스 워커 내비게이션 허용 목록은 `APP_ROUTE_PATHS` 한 곳이라 새 화면은 거기에 더하면 따라온다(M2 S9) | S8 시험(라우트 목록 ↔ App.tsx 일치 시험이 이미 있음) |
| A5 | `AccountDeleted` 이벤트에 `quiz` 리스너만 더하면 탈퇴 정리가 된다(M2 D11) | S3 시험(리스너 실패 시 롤백 포함) |

## 3. 결정 (권장안; 사용자 확인 대상은 §10)

| # | 결정 | 이유 | DESIGN 영향 |
|---|---|---|---|
| D1 | **모든 시험 쓰기는 PUT, 세션 id 는 클라이언트가 만든 UUID**: `PUT /api/v1/quiz/{sessionId}`(세션 시작), `PUT /api/v1/quiz/{sessionId}/items/{seq}`(결과), `PUT /api/v1/quiz/{sessionId}/finish` | M2 의 게이트웨이 규칙(쓰기는 PUT 만)을 지키고 멱등이 공짜로 따라온다(같은 id 로 다시 보내면 같은 세션). POST 로 하면 게이트웨이 조각 변경 → Doro PR → 서버 반영이 또 필요하다 | §9 의 `POST /v1/quiz…` 표기를 PUT 으로 정정 |
| D2 | **세션을 시작할 때 문제 순서를 전부 정한다**(`quiz_item` 을 `result NULL` 로 n 개 만든다) | 새로고침·재접속해도 이어서 풀 수 있고, "같은 세션 중복 금지"가 구조로 보장된다. 가중 랜덤은 시작 시 한 번만 돈다(`pick` 순수 함수) | §7 의 "도중에 retired 되면 그대로 진행" 이 자연스럽게 성립 |
| D3 | **결과는 한 번 기록되면 고정**: 같은 결과를 다시 보내면 무시(멱등), 다른 결과는 409 | 통계(`ask_count`·`miss_count`)를 되돌리는 재계산이 필요 없다. 잘못 누르면? → §10 Q2 | — |
| D4 | **키는 `question_slug`**(M2 D7 와 같다). 외래키 없음 | 카탈로그가 UUID 를 노출하지 않는다 | §6 의 `question_id` → `question_slug` |
| D5 | **`quiz` 모듈은 `progress.read` 와 `catalog` 만 읽는다.** 풀 구성은 `QuizService` 안에서 `catalog.visibleQuestionIndex()` ∩ `ProgressReader.learnedSlugs(userId)`. "다시 공부 후보"는 `quiz.read.QuizStatsReader`(읽기 전용 패키지)로 `api` 가 합성한다 | M2 §5 의 경계를 그대로 쓴다(진도 쓰기 클래스를 쓰면 ArchUnit 이 깨뜨린다) | §6.0 에 `quiz.read` 추가 |
| D6 | **다시 공부 후보** = 체크했고(`learned`) 마지막 출제 결과가 `WRONG`. 이후 `CORRECT` 가 한 번이라도 나오면 사라진다. 응답에는 `learned` 와 같은 방식(**로그인 응답에만, 없으면 키 자체가 없음**)으로 `reviewCandidate` 를 합친다 | M2 D8 과 같은 캐시 규칙(본문이 곧 사용자별 ETag) | §9 에 필드 추가 |
| D7 | **내 답은 저장하되 길이 상한**(M2 노트와 같은 2,000자·NUL 거부·일반 텍스트) | DESIGN 결정 4. 탈퇴 시 삭제 | — |
| D8 | **웹은 새 화면 4개**: 시험 시작(범위), 시험 진행(질문 → 내 답 → 모범 답변과 비교 → 맞음/틀림), 결과, 현황. 라우트는 `APP_ROUTE_PATHS` 에 더한다 | A4 | — |
| D9 | **시간 측정은 표시용**: 질문마다 `seconds` 를 기록하되 제한 시간은 없다 | 면접 연습의 부담을 늘리지 않는다(§10 Q3) | — |

## 4. 데이터 (V8)

- `quiz_session(id UUID PK, user_id, scope JSONB, include_unlearned BOOL, planned_count INT, started_at, finished_at NULL)`
- `quiz_item(session_id, seq, question_slug, result NULL|CORRECT|WRONG|SKIPPED, seconds NULL, answer_text NULL, answered_at NULL, PK(session_id, seq))`, `CHECK(char_length(answer_text) BETWEEN 1 AND 2000)`, 같은 세션에서 `question_slug` 유일
- `quiz_question_stats(user_id, question_slug, ask_count, miss_count, last_asked_at, last_result, PK(user_id, question_slug))`
- `user_pref(user_id PK, include_unlearned_default BOOL DEFAULT false)`
- 외래키 없음, 인덱스: `quiz_session(user_id, started_at)`, `quiz_item(question_slug)` 는 만들지 않는다(통계는 `quiz_question_stats` 로 읽는다).

## 5. 작업 순서

각 단계는 **시험이 초록인 상태로 로컬 커밋**하고, 핵심 보장은 일부러 망가뜨려(◆) 시험이 실패하는지 확인한다. 푸시는 CI 가 도는 단위로(CD 가 서버에 배포한다).

### S1. 스키마·`pick` 순수 함수·ArchUnit
- V8 마이그레이션, `QuizSchemaTest`(칸 목록, `CHECK`, 외래키 없음).
- `quiz.QuizPicker.pick(pool, stats, previousSessionSlugs, n, mode, rng)`: DESIGN §7 의 가중치(기본 1.0, 한 번도 안 나옴 ×1.5, 오래될수록 ×(1+최대 1.0), `miss_count` ×(1+0.25·min(miss,4)), 직전 세션 ×0.5, "완전 무작위" 모드는 가중 없음). **난수는 주입**.
- 시험: 풀 < n 이면 있는 만큼, 풀 0 이면 빈 결과, 중복 없음, 가중치 경계값 표, 같은 시드는 같은 결과, 통계 없는 질문의 기본 가중치. ◆ 중복 방어 제거, ◆ 가중치 곱 하나 제거.
- ArchUnit: `quiz → progress` 는 `progress.read` 만(M2 에서 완료) + `quiz.read` 패키지 규칙 추가 + `ModuleRulesSelfTest` fixture.

### S2. `catalog` 좁은 조회
- `visibleQuestionIndex()`: 보이는 질문의 (slug, topicSlug, categorySlug, tier) 전체(표시 순서). `CatalogVisibility` 한 곳의 조건을 쓴다(M1 D3). 노출 스위치 켠 시험·닫힌 질문 시험.

### S3. `quiz` 서비스 (HTTP 없음)
- `QuizService.start(userId, sessionId, scope, includeUnlearned, count)`: 풀 = 보이는 질문 ∩ (체크 | 미학습 포함이면 전체) ∩ 범위(카테고리·주제·tier). 풀 0 → 예외(안내용), 같은 id 재시작은 같은 세션(멱등), 다른 사용자의 id 와 충돌하면 거부.
- `record(userId, sessionId, seq, result, seconds, answerText)`: 본인 세션만, D3 규칙, 통계 갱신을 **같은 트랜잭션**에서, `answer_text` 검증(D7).
- `finish`, 탈퇴 리스너(`AccountDeleted` → 세션·문항·통계·prefs 삭제).
- 시험: 풀 구성(체크/미체크/주제 필터/옵션), 비공개·닫힌 질문 제외, 중복 없음, 멱등 시작, 남의 세션 접근 거절, 결과 고정·멱등·409, 통계 수치(손계산), **시험이 진도에 쓰지 않음**(체크 행 수 불변), 병렬 같은 결과 20번 → 통계 한 번만, 탈퇴 정리·롤백. ◆ 통계 갱신을 별도 트랜잭션으로, ◆ 소유 검사 제거, ◆ `learned` 조건 제거(미체크가 풀에 들어감).

### S4. 시험 API
- `PUT /api/v1/quiz/{sessionId}`(시작: 범위·개수·미학습 포함), `GET /api/v1/quiz/{sessionId}`(진행 상태: 문항 목록의 질문 제목·tier·주제, 기록된 결과; 모범 답변은 싣지 않는다), `PUT …/items/{seq}`, `PUT …/finish`. 본문은 M2 와 같은 엄격 검증(정해진 필드만, 정확한 JSON 타입), 인증은 `CurrentUser.require()`, 사용자 id 입력 없음(**`ApiSurfaceTest` 가 새 엔드포인트를 자동으로 대상에 넣는다**), 보이지 않게 된 질문의 문항도 404 가 아니라 진행(§7 엣지).
- 시험: 인증 401, 엄격 검증 400, 멱등, 남의 세션 404, 응답에 모범 답변 없음, 통합 e2e 에서 **게이트웨이 경유 PUT 통과**(A1).

### S5. 현황·설정·다시 공부 후보
- `GET /api/v1/me/stats`(30일 출제량·정답률, 자주 틀린 질문 TOP), `GET/PUT /api/v1/me/prefs`, `GET /api/v1/review-candidates`.
- 사전 응답 합성: `QuizStatsReader` 로 `reviewCandidate` 를 로그인 응답에만 합친다(D6): 주제 질문 목록·질문 상세·검색·개념 상세. 비로그인 응답은 M2 와 바이트 동일(시험). ETag 가 체크·시험 결과에 따라 바뀌고 옛 ETag 는 304 가 아님(M2 와 같은 시험). ◆ 비로그인에도 합성.

### S6. 웹: 시험 시작·진행·결과
- 시작 화면: 범위(카테고리·주제·tier), 개수, "미학습 포함"(기본값은 `prefs`), 풀 크기 미리보기와 부족 안내(풀 0 이면 질문 은행으로 안내).
- 진행 화면: 질문만 보이고 경과 시간 표시, 내 답 입력(선택, 2,000자, M2 노트 편집기와 같은 규칙), "모범 답변 보기"(기존 `GET /questions/{slug}` 사용) → 맞음/틀림/건너뛰기. 새로고침하면 이어서 진행. 결과 화면: 맞힌 비율, 틀린 질문 목록과 "사전에서 보기".
- 시험: 컴포넌트 단위(낙관 갱신 없이 서버 확정 후 다음 문항), 오류 분기, 노트 초안 레지스트리 연동(작성 중에는 서비스 워커 업데이트 미룸: M2 와 같음), jsdom axe.

### S7. 웹: 현황·다시 공부 후보·설정
- 현황 화면(진도 바는 M2 요약 재사용 + 30일 통계 + TOP), 사전·홈에 "다시 공부 후보" 표시와 해제 버튼(기존 체크 해제 PUT 재사용), 홈의 후보 목록, 설정(미학습 포함 기본값).

### S8. 퀴즈(훑기)·라우트·모바일 감사
- 답을 가리고 키워드로 자가 점검하는 가벼운 모드(기록 없음, 서버 호출 없음).
- 새 라우트를 `APP_ROUTE_PATHS` 에 추가(기존 시험이 허용 목록 일치를 확인), 모바일 감사에 새 화면 4종 × 폭 4 × 라이트·다크(넘침·터치 영역·axe 색 대비), 번들 예산 유지. ◆ 새 화면의 터치 영역을 일부러 줄여 감사가 실패하는지.

### S9. 통합 e2e
- 가짜 Doro 로 로그인 → 풀이 0 일 때 안내 → 체크 후 시험 시작 → 한 세션 완주 → 결과·통계 → **틀린 질문이 "다시 공부 후보"로 표시, 정답 후 사라짐** → 사용자 격리(남의 세션 404) → 새로고침 후 이어서 진행 → 탈퇴 동기화로 시험 기록 삭제(스텁 `/dev/deleted`).

### S10. 결과 기록
- 이 문서 끝에 "결과" 절(M2-PLAN §13 형식), DESIGN 정정(§6 `question_slug`, §9 PUT·`reviewCandidate`, §6.0 `quiz.read`).

## 6. 시험 계획 요약
- 실제 Postgres(격리 스키마), 실제 Chromium(헤드리스 내장), 게이트웨이 경유 통합 e2e, 변이 ◆ 약 15건.
- **정직한 한계**: 가중 랜덤의 "체감"(너무 쉽거나 어렵다)은 시험으로 확인할 수 없다. 공식은 단위 시험으로 고정하고, 쓰면서 조정한다.

## 7. 위험

| 위험 | 완화 |
|---|---|
| 체크를 후하게 해서 시험이 쉬워짐(DESIGN 위험) | 다시 공부 후보, "미학습 포함" 옵션, 현황의 정답률 |
| 통계 중복 반영(재전송·병렬) | D3(고정·멱등) + 같은 트랜잭션 + 병렬 시험 |
| 모범 답변이 문제 응답에 실림(미리 보임) | 응답 모양 시험(진행 API 에 답 없음) |
| 사전 응답 캐시 | M2 D8 와 같은 규칙과 시험(사용자별 ETag, 비로그인 바이트 동일) |
| 게이트웨이 규칙과 어긋남 | D1(PUT 만) + 통합 e2e |

## 8. 사용자가 할 일(★)
- 이 문서의 결정(§10) 확인. 구현 후: 푸시(CD 가 자동 배포), 서버·Doro 레포 변경은 **없다**(D1 덕분).

## 9. DESIGN.md 정정 목록
S10 에서 반영: §6 `quiz_*` 의 `question_id` → `question_slug`, §9 의 시험 API 를 PUT·세션 id 클라이언트 생성으로, `reviewCandidate` 필드, §6.0 의 `quiz.read`, §8 의 "학습 연속 일수" 는 비목표로 표시.

## 10. 사용자 결정 질문

| # | 질문 | 권장 | 이유 / 대안 |
|---|---|---|---|
| Q1 | 시험 쓰기를 **PUT 만**(D1)으로 할까 | PUT | 대안: POST 로 두고 게이트웨이 조각·Doro PR·서버 반영을 한 번 더(DESIGN 원안 표기) |
| Q2 | 맞음/틀림을 잘못 눌렀을 때 | **고정**(D3, 단순) | 대안: 같은 세션 안에서는 바꿀 수 있게 하고 통계를 차이만큼 보정(복잡, 시험 늘어남) |
| Q3 | 개수 기본값·제한과 타이머 | 기본 10개, 최대 30개, 타이머는 경과 시간 표시만 | 대안: 제한 시간(압박 연습) |
| Q4 | 퀴즈(훑기) 모드를 M3 에 넣을까 | 넣는다(작다: 서버 호출 없음) | 대안: M3 이후로 미룬다 |
| Q5 | "학습 연속 일수"(홈) | **비목표**로 뺀다 | 날짜 기반 활동 기록이 새로 필요하다. 원하면 M3 뒤에 |
| Q6 | 단계 사이 푸시 | S3·S5·S8 뒤에 푸시(CD 가 배포) | 서버에 보이는 변화는 S6 이후부터다 |
