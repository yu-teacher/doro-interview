# M2 상세 계획 — 로그인(BFF 게이트웨이 모드)·학습 체크·진도·내 노트·서비스 워커·탈퇴 동기화

> 범위: [DESIGN.md](DESIGN.md) §12 의 M2 + M1 에서 미룬 것(서비스 워커, 로그인 연동 배포). **랜덤 면접(`quiz`)은 M3** 이지만 `quiz` 가 `progress` 를 읽기만 하는 경계는 이 단계의 인터페이스에 미리 반영한다(§5).
> 상태: **계획 확정 (2026-10-20): §11 의 권장안을 사용자가 모두 수용했다(Q12 는 "M1 선배포 아직 안 됨" 으로 가정 → §7 의 "앱 → 게이트웨이" 순서). 코드 없음.** 아래 "확인" 은 실제 파일로 읽어 확인한 것, "가정" 은 아직 확인하지 않은 것이며 어느 단계에서 확인하는지 적었다. 사용자 결정이 필요한 것은 §11 에 권장안과 함께 모았다.
> 이 문서는 공개 저장소에 있다: 비밀·서버 주소·약점·운영 세부는 적지 않는다(필요하면 git 제외 `.private/`).

## 0. 한눈에

| 덩어리 | 내용 | 우리 레포 | Doro 레포(사용자 PR) | ★ 서버·IAM(사용자) |
|---|---|---|---|---|
| A. 로그인 | SDK 연동, `account`, `GET /api/v1/bff/session` | S1·S2 | BFF 서비스 등록 | OAuth 클라이언트 등록 |
| B. 진도 | 체크(PUT 멱등)·주제 일괄·요약·`learned` 합성 | S3·S4 | — | — |
| C. 내 노트 | 일반 텍스트 노트 | S5 | — | — |
| D. 화면 | 세션·체크·진도·노트 UI | S6 | 허브 카드 | — |
| E. 탈퇴 동기화 | 노트·진도 삭제, 무덤 표식 | S7 | 동기화 스크립트 목록 | IAM 내부 토큰 |
| F. 게이트웨이 | `auth_request` 라우트, 가짜 BFF 로 리허설 | S8 | `nginx.conf`·기대 파일 | 게이트웨이 반영 |
| G. 서비스 워커 | PWA, 업데이트 시나리오 시험 | S9 | — | — |
| H. 배포·CD | SDK 때문에 바뀌는 빌드, CD 도입 | S10 | — | 러너 등록·배포 |

의존: S1 → S2 → S3 → S4 → S5 → S6. S7 은 S4 이후, S8 은 S6 이후, S9 는 S6 이후 서로 독립. S10 은 마지막.

## 1. 목표와 완료 기준

M1 처럼 **기능 완료**(개발 트랙)와 **운영 완료**(Doro 레포 PR·서버 작업 포함)를 나눠서 닫는다.

### 기능 완료 (이 문서의 S1~S9)
1. 로그인 없이 M1 의 모든 읽기 기능이 **바이트 단위로 그대로** 동작한다(공개 응답은 로그인 여부와 무관하게 같고 ETag·304 도 유지).
2. 게이트웨이가 붙인 Bearer 로 인증하고, `GET /api/v1/bff/session` 이 비로그인에도 200(`authenticated:false`)이며, 로그인 후 첫 조회에서 `interview_user` 행이 한 번만 만들어진다.
3. 체크·해제가 **멱등**(PUT)이고 더블 클릭·병렬 요청에도 행이 하나다. 주제 일괄 체크는 확인창을 거친다.
4. **다른 사용자의 진도·노트에는 접근할 방법이 구조적으로 없다**(사용자 id 를 받는 엔드포인트가 없고, 테스트가 이를 강제한다).
5. 진도 수치(카테고리·주제별 n/m)가 테스트 데이터와 일치하고, 비공개·닫힌 질문은 분모·분자 어디에도 들어가지 않는다.
6. 내 노트가 일반 텍스트로만 저장·표시되고(XSS 면적 0), 길이 상한·NUL 문자 같은 DB 가 거부하는 입력이 400 으로 막힌다.
7. 영구 탈퇴한 사용자의 노트·진도 행이 삭제되고(멱등), 탈퇴 후 유효한 토큰으로 사용자 행을 되살릴 수 없다.
8. 서비스 워커: precache 의 **모든 URL 이 게이트웨이를 거쳐 리다이렉트 없이 200**, 업데이트 시나리오(§6)가 실제 Chromium 에서 통과한다.
9. 실제 jar + 실제 DB + 가짜 Doro(IAM·BFF 스텁) + **게이트웨이(`auth_request` 설정 그대로)** + 실제 Chromium 으로 "로그인 → 체크 → 새로고침 유지 → 다른 사용자 격리 → 로그아웃" 이 통한다.
10. 모든 시험이 초록이고 `scripts/ci-test.sh all` 에 새 시험이 들어 있다. 핵심 보장마다 변이 검증(◆)을 했다.

### 운영 완료 (★ 포함, §8)
11. Doro 레포 PR 머지, OAuth 클라이언트·내부 토큰 등록, 서버 반영, **사용자가 실제 도로 계정으로 한 번 로그인해 체크까지 확인**한다(진짜 IAM 은 이 환경에서 시험하지 못한다, §2-가정 A1).

## 2. 확인한 사실과 가정

### 확인한 사실 (파일로 읽음)
| # | 사실 | 근거 |
|---|---|---|
| F1 | games 는 SDK 를 `implementation 'com.hunnit-beasts:doro-sdk'` + `settings.gradle` 의 `includeBuild('../Doro') { dependencySubstitution … :sdk }` 로 쓴다. SDK 는 JPA 에 의존하지 않는다(web·aspects·jjwt·grpc·jackson). 우리는 JDBC 라서 충돌 없음 | `doro-games/build.gradle`, `settings.gradle`, `Doro/sdk/build.gradle` |
| F2 | games 의 `games.auth.mode=gateway` 에서는 BFF 빈이 없고 **Bearer 만 검증**한다. `GET /api/v1/bff/session` 은 서비스가 제공하며 **비로그인도 200**, `Cache-Control: no-store`, 사용자 행은 이 조회에서 JIT 생성. 쿠키만 보내면 익명이고 `/api/v1/bff/login` 은 이 서비스에 없다(4xx) | `GamesBffConfig`, `BffSessionController`, `BffGatewayModeTest` |
| F3 | SDK 필터는 **잘못된·만료된 Bearer 를 예외 없이 익명으로 취급**(WARN 로그)한다. 인증 필요 여부는 서비스 책임이다. 토큰이 `cid` 클레임을 가지면 `doro.iam.oauth-client-ids` 에 있어야 받아 준다. `@CurrentDoroUser` 는 `DoroUserContext`(ThreadLocal)에서 읽는다 | `DoroJwtAuthFilter`, `DoroAutoConfiguration`, `CurrentDoroUserArgumentResolver` |
| F4 | `doro.guard.enabled=false` 면 `DoroGuardClient` 빈이 없고 `@DoroGuard` 는 **fail-closed**. doro-bff 가 이 설정을 쓴다. games 시험은 `doro.iam.revocation-check=OFF` + 가짜 JWKS 로 RS256 JWT 를 발급한다(`FakeIam`) | `DoroAutoConfiguration`, `DoroGuardAspect`, `bff/application.yaml`, `FakeIam` |
| F5 | 탈퇴 동기화 자동 구성은 `DeletedUsersProperties`·`DeletedUserHandler`·`SyncCursorStore` 빈 셋이 있고 `@EnableScheduling` 이면 돈다. 핸들러는 `boolean onDeleted(UUID, Instant)`, 예외를 던지면 다음 주기에 같은 사용자부터 재시도. games 는 `iam_sync_state(name, cursor_at, updated_at)` 와 `game_users.deleted_at`(V6) | `DoroDeletedUsersAutoConfiguration`, `DeletedUserHandler`, `GamesSyncCursorStore`, `V6__deleted_users.sql` |
| F6 | doro-bff 는 서비스별 설정 `doro.bff.services.<이름>`(client-id, cookie-name, login-cookie-name, csrf-header, cookie-path, web-base-path, return-path-relative-to-web-base, redirect-uri)와 `oauth-client-ids`(기본 `doro-blog,doro-party,doro-games`)를 가진다. 쿠키 이름·클라이언트 ID 가 겹치면 기동하지 않는다. **`interview` 는 Doro 레포 어디에도 아직 없다**(grep 0건) | `Doro/bff/src/main/resources/application.yaml`, `docs/BFF.md` |
| F7 | 게이트웨이의 games 구성: `= /games/api/v1/bff/login|callback|logout` 정확 일치 → `bff_upstream/bff/games/…`, `= /_bff_auth_games`(internal, 쿠키 없으면 BFF 를 부르지 않고 204), `/games/api/` 에 `auth_request` + `auth_request_set $bff_token` + `error_page 403 = @bff_forbidden` / `500 = @bff_unavailable` + `proxy_set_header Authorization $bff_authorization`. `$bff_authorization` 맵(쿠키 있으면 Bearer 로 덮어쓰고 없으면 클라이언트 값 통과)과 named location 은 게이트웨이 기본 설정에 있다. `/games/` 의 CSP 는 **Report-Only** | `Doro/gateway/nginx.conf` 600~680행, 106행 |
| F8 | 기대 라우팅 파일에 games 는 login/callback/logout/session/scores/`_bff_auth_games`(404) 줄이 있다. 배포 후 smoke 는 `/games/` 200 과 로그인 시작 302 를 본다. `enable-deleted-sync.sh` 의 서비스 목록은 `(party games)`. 쓰기 속도 제한 zone 은 blog 것만 있다 | `scripts/gateway-routing/expect-current.txt`, `post-deploy-smoke.sh`, `enable-deleted-sync.sh` |
| F9 | 쿠키로 상태를 바꾸는 요청(POST/PUT/PATCH/DELETE)은 서비스별 CSRF 헤더(games: `X-Games-Csrf: 1`)가 없으면 **게이트웨이 단계에서 403**(JSON `AUTH-403-03`). 쿠키가 있는데 BFF 에 닿지 못하면 JSON 503(`AUTH-503-02`) | `docs/BFF.md`, `GATEWAY_ROUTING_RULES.md` §2.4, `doro-games/web/src/api/csrf.ts` |
| F10 | 허브(`/`)의 서비스 워커는 **허용 목록**(`/`, `/login`, `/signup`, `/account`, `/logs`, `/portal`)만 앱 셸로 대신 응답한다. `/interview/` 는 허브 워커가 가로채지 않는다. 허브 카드는 `web/src/utils/serviceCatalog.ts` | `Doro/web/src/pwa/navigateAllowlist.ts`, `vite.config.ts` |
| F11 | games 웹: `vite-plugin-pwa` `registerType:'autoUpdate'`, `navigateFallback` + **거부 목록** `/games/api/`, `runtimeCaching: []`, 웹 nginx 가 `sw.js·registerSW.js·workbox-*.js·manifest` 를 `no-cache` 로 서빙. `scripts/check-sw-precache.sh`(+시험)는 Doro·doro-menu 에 있고 games 에는 없다 | `doro-games/web/vite.config.ts`, `web/nginx.conf`, `Doro/scripts/check-sw-precache.sh` |
| F12 | 우리 현재 상태: JDBC 만 쓰고 SDK 없음. **`Dockerfile` 이 `COPY settings.gradle build.gradle src content` 뿐이라 `includeBuild('../Doro')` 를 넣는 순간 이미지 빌드가 깨진다**. `ci.yml` 의 4 잡 어디도 Doro 를 체크아웃하지 않는다. 게이트웨이 조각은 `/interview/api/` 에 `limit_except GET HEAD { deny all; }`(읽기 전용), CSP 에 `worker-src 'self'; manifest-src 'self'` 가 이미 있다. 웹에는 PWA 없음. ETag 는 `ShallowEtagHeaderFilter`(**본문 해시**). 카탈로그 뷰는 질문 UUID 를 노출하지 않고 slug 만 쓴다 | `Dockerfile`, `.github/workflows/ci.yml`, `deploy/gateway-interview.conf`, `ApiCacheConfig`, `CatalogViews` |
| F13 | 서비스 워커 사고 전례: ① 옛 화면 잔류(새 SW 는 활성화돼도 열린 화면은 옛 JS, 등록이 `load` 때 한 번뿐이라 확인도 안 함, `injectRegister:false` 가 `skipWaiting/clientsClaim` 을 빼먹어 대기만 함) ② SW 가 HTML 을 **응답 헤더째** 저장해 옛 CSP 가 계속 나감 ③ 허브 빈 화면(precache 의 `/index.html` 이 블로그로 리다이렉트된 채 저장됨) | `interview-prep/stories/pwa-update-stale-clients.md`, `service-worker-stale-csp.md`, 기억된 2026-10-09 사고 |
| F14 | Doro `e2e/` 의 진짜 IAM 통합 시험은 서비스로 **doro-blog 만** 올린다(`../doro-blog`) | `Doro/e2e/README.md` |

### 가정 (아직 확인하지 않음 — 확인할 단계)
| # | 가정 | 확인 |
|---|---|---|
| A1 | 진짜 IAM·진짜 BFF 와의 연동(PKCE·`cid`·redirect_uri 정확 일치)은 이 환경에서 시험할 수 없다. 가짜 IAM·BFF 스텁은 **우리가 읽은 규격대로 흉내** 낸 것이라 규격을 잘못 읽었으면 스텁도 같이 틀린다 | 사용자의 실제 로그인 1회(★ §8), 선택: Doro e2e 에 우리 서비스 추가(§11 Q10) |
| A2 | SDK 의 `DoroExceptionHandlerAdvice`(자동 구성)가 우리 `GlobalExceptionHandler` 와 응답 모양·우선순위에서 충돌하지 않는다(games 는 둘 다 쓰지만 우리 오류 규격 시험이 이를 덮는지는 모른다) | S1: 기존 `GlobalExceptionHandlerTest`·`CatalogApiTest` 를 SDK 를 붙인 채 돌려 확인 |
| A3 | 이미지 빌드에서 Doro 의 필요한 부분만 `COPY` 하고 나머지 서브프로젝트는 **빈 디렉터리**만 만들어 두면 Gradle 9 가 `includeBuild` 를 설정한다(존재하지 않는 프로젝트 디렉터리는 Gradle 9 에서 오류) | S1: 실제 `docker build` |
| A4 | SDK 의 `SessionRevocationChecker`·`iss` 검증의 운영 기본값과 games 가 쓰는 값(`revocation-check: ENFORCE`, issuer 검증은 기본 설정)이 같다. issuer 검증이 약한 기본이면 기동 시 WARN 이 나온다 | S1: 기동 로그의 WARN 목록을 읽고 §11 Q 로 올릴지 정한다 |
| A5 | `@EnableScheduling` + 내부 토큰이 비었을 때 SDK 동기화가 어떻게 실패·로그를 남기는지(조용히 실패하면 안 된다) | S7: 시험으로 확인 |
| A6 | 게이트웨이 `limit_except` 가 만든 403 이 `error_page 403 = @bff_forbidden` 에 걸려 "CSRF 403 JSON" 으로 보일 수 있다 | S8: 리허설 시험으로 확인(허용되지 않은 메서드 응답을 기록) |
| A7 | `enable-bff.sh`·`set-bff-mode.sh` 가 서비스 목록을 하드코딩하는지(우리는 gateway 모드 고정이라 필요 없을 수 있다) | Doro PR 작성 때 확인 |

## 3. 결정

| # | 결정 | 이유 | DESIGN 영향 |
|---|---|---|---|
| D1 | **게이트웨이 모드 고정**, 서비스에는 `*.auth.mode` 스위치도 `embedded` 코드도 없다. 서비스가 하는 일은 Bearer 검증 + 세션 조회 + 사용자 JIT 뿐 | DESIGN §10·결정 10. games 의 `ConditionalOnEmbeddedBff` 같은 이중 구조는 우리가 안 만드는 만큼 단순하다 | 없음 |
| D2 | **SDK 는 games 와 같은 `includeBuild('../Doro')`**. CI 는 Doro `main` 을 형제 디렉터리로 체크아웃(games 와 같음). 이미지 빌드는 **BuildKit 이름 있는 컨텍스트**(`--build-context doro=<Doro 경로>`, compose 는 `additional_contexts`)로 SDK 만 가져온다 | SDK 를 별도 아티팩트로 게시하는 인프라는 아직 없다. Doro `main` 을 따라가면 SDK 변경이 우리 빌드를 깨는 것을 일찍 알 수 있다(SDK_BFF.md 의 권고). 반대로 SDK 변경 때문에 우리 CI 가 갑자기 빨개질 수 있다는 비용이 있다 | §11 에 기록 |
| D3 | **Guard 는 M2 에서 붙이지 않는다**(`doro.guard.enabled=false`, 스키마·서비스 토큰·`@DoroGuard` 없음). 편집자 권한이 처음 생기는 M4 에서 `interview_question` 스키마와 함께 붙인다 | M2 의 권한은 "본인 것만"이고 이는 `user_id` 를 토큰에서만 얻는 구조로 보장한다. 쓰이지 않는 스키마·토큰은 죽은 설정이고 Guard 장애 면적만 늘린다. 단 Doro `AGENTS.md` 5장의 신규 서비스 5단계 중 2·3단계 일부를 의도적으로 미루는 것이라 기록해 둔다 | §12 M4 에 Guard 이동 |
| D4 | **`account` 는 SDK 를 아는 유일한 모듈.** 다른 모듈·`api` 는 `account.CurrentUser`(인터페이스)만 쓰고 `com.hunnit_beasts..` 를 import 하지 않는다. ArchUnit 규칙으로 고정(S1) | SDK 가 바뀌어도 한 곳만 고치고, `quiz` 가 자라도 경계가 유지된다 | §6.0 에 규칙 추가 |
| D5 | **서비스 계층은 사용자 id 를 인자로 받는다**(`ProgressService.set(UUID userId, String slug, boolean learned)`). 현재 사용자 해석은 `api` 컨트롤러만(`CurrentUser`). 요청 안에서 임의의 id 로 남의 데이터를 읽을 길이 서비스 시그니처에 드러난다 | 시험하기 쉽고(ThreadLocal 없이), "사용자 id 를 받는 엔드포인트 없음" 을 ArchUnit·라우트 목록 시험으로 강제할 수 있다 | §6.0 의 "progress→account(CurrentUser)" 는 허용만 되고 쓰이지 않는다 |
| D6 | **`interview_user(user_id UUID PK, created_at, deleted_at)`** — 닉네임 칸은 만들지 않는다. 이메일·이름 저장 없음 | `DoroUser` 에 닉네임이 없고 이 서비스는 다른 사람에게 이름을 보여 주지 않는다. 개인정보를 안 가지면 탈퇴 동기화가 단순해진다. 행은 ① 첫 방문 기록 ② 탈퇴 **무덤 표식**(§4 S7) ③ M3 의 `user_pref` 앵커 | §6.0·§6 의 `nickname` 삭제 — **사용자 확인 필요(Q4)** |
| D7 | **진도·노트의 질문 키는 `question_slug`**(예 `tx-07`), UUID 가 아니다. 전용 테이블에 외래키 없음 | 카탈로그 뷰가 UUID 를 노출하지 않고, DESIGN §5.2 가 slug 를 "학습 기록이 끊기지 않게 파일에 고정한 값" 으로 정의했다. 존재·가시성 검증은 서비스 계층(`CatalogReader`) | §6 `user_progress`·`my_note` 컬럼명 정정 — **Q5** |
| D8 | **`learned` 는 로그인 사용자의 응답에만 합친다.** 비로그인 응답은 M1 과 바이트 동일(`learned` 키 없음, `@JsonInclude(NON_NULL)`). ETag 가 본문 해시이므로(F12) 합쳐진 본문이 곧 사용자별 ETag 다 | 공개 응답의 캐시 정책을 건드리지 않으면서 사용자 상태는 stale 304 위험 없이 합쳐진다. 위험은 "ETag 를 카탈로그 해시로 바꾸는 미래의 최적화" 이므로 시험으로 고정(S4 ◆) | §9 문구 정정 |
| D9 | **API(앱 안 경로 `/api/v1/…`)**: `PUT /progress/{slug}` `{learned}`, `PUT /progress` `{topic, learned, expectedCount}`(주제 일괄, 개수가 달라졌으면 409), `GET /progress/summary`, `GET/PUT /notes/{slug}`. 쓰기는 모두 인증 필요(없으면 401), 보이지 않는 질문·주제는 **M1 과 같은 404 본문** | 멱등 PUT(DESIGN §6 규칙). `expectedCount` 는 확인창에 보여 준 개수와 실제가 어긋나는 경쟁(콘텐츠 재배포 중)에서 의도하지 않은 개수가 체크되는 것을 막는다 | §9 정정 |
| D10 | **`quiz` 가 읽는 창구는 `progress.read` 패키지**(`ProgressReader` + 반환 타입). `quiz → progress` 규칙은 "이름이 Reader 로 끝나는 클래스" 에서 "`progress.read..` 패키지만" 으로 강화한다(§5) | 반환 DTO(record)가 생기는 순간 이름 규칙은 거짓 위반을 내거나 구멍이 된다. 패키지 규칙이 더 정확하다 | §6.0 규칙 문구 |
| D11 | **탈퇴 처리는 `account` 가 SDK 핸들러를 소유하고 `AccountDeleted` 이벤트를 발행**한다. `progress`(M2)와 `quiz`(M3)가 이벤트를 듣고 자기 데이터를 지운다. 같은 트랜잭션 안의 동기 리스너 | 의존 방향(둘 다 account 에 의존)을 지키고, M3 가 account·progress 를 고치지 않고 확장된다. 한 리스너가 실패하면 전체가 롤백되어 다음 주기에 재시도(SDK 규칙 F5) | §10 문구 보강 |
| D12 | **개발 중 로그인은 코드 우회 없이 한다**: 가짜 Doro 스텁(JWKS + 토큰 발급 + `auth_request` 응답)과 게이트웨이를 띄우고, Vite 개발 프록시가 스텁이 준 Bearer 를 붙인다(`VITE_DEV_BEARER`). 서버 코드에 "개발이면 인증 건너뜀" 스위치를 두지 않는다 | 공개 저장소다. 인증 우회 플래그는 운영에서 켜질 위험이 있고 M1 의 노출 스위치(D4)처럼 가드를 또 만들어야 한다. 스텁은 어차피 리허설에도 필요하다 | 신규 |
| D13 | **서비스 워커 정책은 §6** (등록·업데이트·내비게이션·precache·시험) | M1 D9 의 미룬 이유(F13)를 그대로 설계 입력으로 삼는다 | §8 PWA 문구 |
| D14 | **내 노트는 M2 에 넣는다**(DESIGN 은 M4). 일반 텍스트, 길이 상한 **2,000자**, 비면 삭제, NUL 문자 거부. 노트 모아보기 화면은 만들지 않는다(질문 상세에서만) | 요청 범위(②). 모아보기·검색은 노트가 쌓인 뒤 필요가 확인되면 | §12 M2/M4 행 조정 |

## 4. 작업 순서

각 단계는 **시험이 초록인 상태로 로컬 커밋**한다. ◆ = 일부러 망가뜨려 시험이 실패하는지 확인하는 변이 검증. 모든 백엔드 시험은 실제 Postgres(격리 스키마).

### S1. SDK 연동과 빌드 기반 (로그인 기능은 아직 없음)
- `settings.gradle` 에 `includeBuild('../Doro') { substitute module('com.hunnit-beasts:doro-sdk') using project(':sdk') }`, `build.gradle` 에 SDK 의존성. 설정(`application.yaml`): `doro.iam.jwks-uri`, `doro.iam.oauth-client-ids=${INTERVIEW_OAUTH_CLIENT_ID:doro-interview}`, `revocation-check`(games 와 같은 값), `doro.iam.internal-url/-token`, `doro.guard.enabled=false`(D3). 환경변수 이름은 games 를 따른다(`IAM_HOST`·`IAM_PORT`·`DORO_IAM_INTERNAL_TOKEN`).
- **빌드 경로 전부 갱신**: ① `Dockerfile` 빌드 단계에 `COPY --from=doro` 로 Doro 의 `settings.gradle`·`gradle/`·`sdk/` 를 `/work/Doro` 로, 나머지 서브프로젝트(`auth guard bff`)는 빈 디렉터리(가정 A3), 작업 디렉터리를 `/work/doro-interview` 로 ② `docker-compose.prod.yml`·`docker-compose.rehearse.yml` 에 `additional_contexts: doro: ${DORO_DIR:-../Doro}` ③ `scripts/deploy-on-server.sh`·리허설·`ci-test.sh` 가 Doro 경로(`DORO_DIR`, 기본 `../Doro`)를 받고 없으면 친절한 오류 ④ `ci.yml` 의 backend·e2e·rehearse 잡이 `path: doro-interview` + Doro 체크아웃(games 와 같은 모양, **web 잡은 불필요**) ⑤ `scripts/test-deploy-on-server.sh` 시나리오에 Doro 경로 인자 반영.
- ArchUnit: 규칙 R1 "`com.hunnit_beasts.doro.sdk..` 는 `account`·`config` 에서만"(D4). `ModuleRulesSelfTest` 에 위반 fixture(예: `api` 가 SDK import) 추가.
- 검증: 기동(DB·SDK), **기존 228 JUnit 전부 통과**(특히 A2: 오류 규격·404 본문 동일성), 기동 로그의 WARN 목록 기록(A4), 실제 `docker build`(가능한 환경에서, A3), 게이트웨이 없이 `/api/v1/categories` 가 M1 과 같은 본문. ◆ R1 위반 fixture 가 실패.
- 만들지 않는 것: 로그인·세션 엔드포인트(S2).

### S2. `account` — 사용자 사본·`CurrentUser`·세션 조회
- **V4**: `interview_user(user_id UUID PK, created_at TIMESTAMPTZ NOT NULL DEFAULT now(), deleted_at TIMESTAMPTZ NULL)`.
- `account`: `CurrentUser`(`Optional<UUID> id()`, `UUID require()`: 없으면 401 `InterviewException`), SDK 구현(`DoroUserContext` 읽기, `account` 내부), `AccountService.ensureActive(UUID)` = `INSERT … ON CONFLICT DO NOTHING` 후 `deleted_at` 이 있으면 **거부**(탈퇴한 사용자는 만들어지지도 되살려지지도 않음).
- `api.SessionController`: `GET /api/v1/bff/session` → `{authenticated, user?: {userId, admin}}`. 비로그인·잘못된 토큰도 200 `authenticated:false`, `Cache-Control: no-store`. 로그인이면 `ensureActive` 호출. 응답에 이메일·세션 id 를 **싣지 않는다**(화면에 필요 없다). 역할도 문자열로는 싣지 않고 관리자 전용 링크용 `admin` 불리언만 싣는다(ADMIN·SUPER_ADMIN 이면 true, `CurrentUser.isAdmin()`).
- 시험 지원: `support/FakeDoro`(games `FakeIam` 에서 JWKS·RS256 발급만 가져오고 토큰 엔드포인트는 뺀다; 클레임은 SDK `DoroTokenVerifier` 가 읽는 것에 맞춘다), `revocation-check=OFF`.
- 검증: 비로그인 200/false, 유효 토큰 → true + 행 1개, **같은 사용자 동시 10 요청 → 행 1개**, 만료·변조·다른 `cid`·서명 키가 다른 토큰 → 익명(F3), `deleted_at` 이 있는 사용자의 유효 토큰 → `authenticated:false`·쓰기 거부, 응답에 PII 없음(필드 목록 고정), 쿠키만 보내면 익명(games 시험과 같은 보장). ◆ `ensureActive` 의 삭제 검사 제거 시 실패, ◆ `cid` 허용 목록 비움 시 실패.

### S3. `progress` 저장소·서비스 (HTTP 없음)
- **V5**: `user_progress(user_id UUID, question_slug VARCHAR(60), learned_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id, question_slug))`, `(question_slug)` 보조 색인은 만들지 않는다(M3 의 풀 구성은 `user_id` 로 읽는다). 모듈 간 외래키 없음.
- `ProgressService`: `setLearned(userId, slug, learned)` — 체크는 `INSERT … ON CONFLICT DO NOTHING`(**`learned_at` 은 처음 체크한 시각 유지**), 해제는 `DELETE`. `setTopic(userId, topicSlug, learned, expectedCount)`. `summary(userId)`. 질문·주제 가시성은 `CatalogReader` 에서 얻는다 — **`catalog` 에 좁은 조회 추가**: `boolean isVisibleQuestion(slug)`, `Optional<List<String>> visibleQuestionSlugs(topicSlug)`(가시성 조건은 기존 `CatalogVisibility` 한 곳, M1 D3).
- `progress.read.ProgressReader`(D10): `Set<String> learnedAmong(UUID, Collection<String>)`, `Set<String> learnedSlugs(UUID)`. JDK 타입만 반환한다. 구현은 `progress` 내부.
- 검증: 체크 2번 = 행 1개·`learned_at` 불변, 해제 2번 = 오류 없음, **병렬 20 스레드 체크 → 행 1개**, 보이지 않는(비공개·닫힘·없는) slug → 404 와 같은 예외, 사용자 A 의 행이 B 의 `learnedAmong` 에 없음, 주제 일괄(체크/해제, 개수 불일치 → 409 예외, 비공개 주제 → 404), 요약 수치(공개 2주제·닫힌 질문 1개·부분 체크 데이터에서 분모 분자가 손계산과 일치), 닫힌 질문에 남은 옛 행은 분모·분자에서 빠짐. ◆ 가시성 조건 제거(비공개 질문 체크가 성공), ◆ `ON CONFLICT` 를 `DO UPDATE learned_at` 로 바꾸면 `learned_at` 불변 시험 실패.

### S4. 진도 API와 `learned` 합성
- `api.ProgressController`: D9 의 `PUT /progress/{slug}`, `PUT /progress`, `GET /progress/summary`. 응답 규격은 기존 `ApiResponse`. 쓰기 응답에 `timestamp` 를 쓰는 기존 `ApiResponse.ok/success` 를 그대로 쓴다(캐시 대상이 아님). `learned` 값은 JSON boolean 만 받는다(문자열 "false" 가 truthy 로 해석되는 일 없음).
- 합성: `CatalogController` 가 로그인 사용자에 한해 `learned` 를 합친다 — 주제의 질문 목록, 질문 상세, 검색 결과, 개념 상세. 비로그인은 M1 과 같은 클래스·본문(D8). `api` 의 응답 DTO 에 `learned`(NON_NULL) 추가.
- 구조적 보장 시험: `RequestMappingHandlerMapping` 을 열거해 **경로 변수·쿼리 파라미터에 `userId`·`user_id` 가 있는 핸들러가 0개**, `api` 컨트롤러의 쓰기 핸들러가 전부 `CurrentUser.require()` 를 거침(리플렉션이 아니라 인증 없이 호출 시 401 을 전 엔드포인트에 시험).
- 검증: 비로그인 응답이 M1 골든(고정 본문)과 같음, 로그인 응답의 `learned` 합성(목록·상세·검색·개념), **ETag**: 같은 URL 에서 체크 전후 ETag 가 다르고 이전 ETag 로 조건부 요청 시 **304 가 아니라 200**, 사용자 A·B 가 같은 URL 에 다른 본문, PUT 의 잘못된 입력(본문 없음·`learned` 가 boolean 아님·알 수 없는 필드)은 400, 인증 없음 401, 보이지 않는 slug 404 본문이 M1 과 바이트 동일. ◆ ETag 를 카탈로그 해시로 바꾸면 stale 304 시험 실패, ◆ `learned` 합성을 비로그인에도 켜면 M1 골든 실패.

### S5. 내 노트
- **V6**: `my_note(user_id UUID, question_slug VARCHAR(60), body TEXT NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT now(), PRIMARY KEY(user_id, question_slug))`, `CHECK (char_length(body) BETWEEN 1 AND 2000)`.
- `GET /api/v1/notes/{slug}`(없으면 200 + `body:null`, 질문이 안 보이면 404), `PUT /api/v1/notes/{slug}` `{body}`(공백뿐·빈 문자열 → 행 삭제, 상한 초과·NUL(`\u0000`) 포함 → 400. **PostgreSQL TEXT 는 NUL 을 못 담아 검사 없이는 500 이 난다**). 개행은 `\n` 으로 정규화, 앞뒤 공백 유지. HTML 은 가공하지 않고 그대로 저장한다(렌더링은 텍스트 노드). 응답은 `no-store`.
- 검증: 저장·조회·덮어쓰기·삭제, 2,000자 경계(2,000 OK·2,001 400, 이모지 등 서로게이트 쌍은 코드포인트 기준), NUL 400, `<script>` 가 그대로 돌아옴, 사용자 격리, 비로그인 401, 안 보이는 질문 404, 요청 본문 크기 상한(스프링 기본이 아닌 명시 상한을 테스트). ◆ 길이 `CHECK` 와 서비스 검사 중 하나를 빼도 다른 쪽이 막는지(둘 다 시험).

### S6. 웹 — 세션·체크·진도·노트
- **세션**: `SessionProvider` 가 첫 렌더 뒤 `GET /api/v1/bff/session` 호출(상태 `loading/anonymous/authenticated`), 헤더에 "로그인"/"로그아웃". 로그인은 **전체 페이지 이동**(`/interview/api/v1/bff/login?return=<현재 라우터 경로>`; 복귀 경로는 웹 기준 경로 상대 — games·party 와 같은 규칙), 로그아웃은 `POST …/bff/logout` + `X-Interview-Csrf: 1`. 세션 조회가 실패(네트워크·5xx)하면 로그인 상태를 **추측하지 않고** 읽기 전용 화면 + 재시도 안내.
- **쓰기 클라이언트**(`apiPut`): CSRF 헤더 자동, 401 → "로그인이 필요합니다"(세션을 anonymous 로 되돌림, 쓰기 재시도 없음), 게이트웨이 JSON 403(`AUTH-403-03`)·503(`AUTH-503-02`) 구분 메시지, 취소 가능한 요청.
- **체크 UI**: 질문 상세와 주제 목록의 `<input type="checkbox">` + 보이는 레이블 "완전히 학습함"(스크린 리더용 이름에 질문 제목 포함), **낙관적 갱신 후 실패하면 되돌리고 `role="status"` 로 알림**, 같은 질문 요청이 진행 중이면 새 요청을 직렬화(더블 클릭 시 마지막 의도가 이김). 비로그인에는 죽은 체크박스 대신 "로그인하고 학습 체크하기" 링크.
- **주제 일괄**: 주제 화면의 "모두 체크/해제" → `<dialog>` 확인창("N개 질문을 학습 완료로 표시합니다", 취소가 기본 포커스, Esc 닫기, 닫으면 호출한 버튼으로 포커스 복귀), 확인 시 `expectedCount` 를 함께 보낸다. 409 면 "질문 수가 바뀌었습니다. 다시 확인해 주세요" 후 새 개수로 확인창 재개방.
- **진도 표시**: 홈 카테고리·주제 카드에 `n/m` + 막대(`role="progressbar"` + 값·텍스트, 색에만 의존하지 않음), 질문 목록에 "내 체크 상태" 필터(전체/학습함/미학습), 비로그인 홈에는 소개만(오류처럼 보이지 않게).
- **내 노트**: 질문 상세 하단 `<textarea>`(글자 수 카운터, 저장 버튼·저장 상태 `role="status"`, 16px 이상 글꼴), 저장 전 변경 중임을 **초안 레지스트리**에 알림(§6 업데이트가 사용). 노트는 텍스트 노드·`white-space: pre-wrap` 으로만 그린다. 린트(`dangerouslySetInnerHTML` 금지)는 그대로.
- 검증: 컴포넌트·훅 시험(세션 3상태, 낙관 갱신·롤백, 직렬화, 401/403/503/409 분기, 확인창 포커스 동작, 노트 저장·상한·초안 표시), **jsdom axe 구조 검사에 새 화면 추가**, **실제 Chromium 모바일 감사(`mobileAudit`)에 새 상태 추가**: 로그인된 주제 목록(체크박스), 확인창, 노트 편집기, 로그인 안 된 안내 — 폭 4종 × 라이트·다크, 넘침·잘림·터치 영역(≥44px)·**색 대비(axe)**. ◆ 확인창 건너뛰기(바로 호출) 변이, ◆ 낙관 갱신 롤백 제거, ◆ 진행 막대 대비를 일부러 낮춰 모바일 감사가 실패하는지. 번들 예산(첫 화면 150KB / 지연 조각 120KB) 유지.

### S7. 탈퇴 동기화
- **V7**: `iam_sync_state(name VARCHAR(50) PK, cursor_at TIMESTAMPTZ NOT NULL, updated_at …)`(games V6 복제). `account` 가 `SyncCursorStore`(앞으로만 움직임), `DeletedUsersProperties`(`interview.deleted-sync.*`: enabled, interval PT1H, …), `DeletedUserHandler` 빈과 `@EnableScheduling` 을 가진다.
- 핸들러(`@Transactional`): `interview_user` 를 **upsert 로 `deleted_at` 설정**(방문한 적 없는 사용자도 무덤 표식을 남긴다 — 탈퇴 직후 아직 유효한 토큰의 첫 요청이 행을 새로 만드는 경주를 막는다), `AccountDeleted(userId)` 이벤트 발행 → `progress` 리스너가 `user_progress`·`my_note` 삭제(D11). 이미 처리됐으면 `false`.
- 정책(DESIGN §10): 노트·진도 행 삭제, `interview_user` 는 PII 가 없으므로 행만 남는다(무덤).
- 검증: 핸들러 멱등(두 번째 `false`), 무덤이 `ensureActive` 를 막음, 방문한 적 없는 사용자도 표식, **다른 사용자 데이터 불변**, 리스너 예외 시 전체 롤백(표식도 안 남음 → 다음 주기 재시도), 커서가 앞으로만, 내부 토큰이 비었을 때의 동작 확인과 명확한 오류 로그(A5), SDK 가 모의 IAM 의 `GET /internal/v1/deleted-users` 를 호출해 실제로 위 핸들러까지 가는 통합 시험(스텁이 목록 제공). ◆ 리스너 등록 제거 시 "행이 남음" 실패, ◆ 무덤 upsert 를 "있을 때만 갱신" 으로 바꾸면 경주 시험 실패.

### S8. 게이트웨이·가짜 Doro·통합 e2e
- **가짜 Doro 스텁**(`scripts/rehearse/fake-doro.mjs`, Node 내장 `crypto` 만): JWKS(`/.well-known/jwks.json`), `GET /dev/token?user=<uuid>`(RS256 발급), BFF 모양 엔드포인트 `/bff/interview/login|callback|logout`(쿠키 `doro_interview_session` 설정·삭제, 복귀 경로), `/internal/auth`(쿠키 → `204` + `X-Doro-Access-Token`, 쿠키 없음 → 204 토큰 없음, **쿠키 있는 POST/PUT 에 CSRF 헤더 없으면 403**: BFF 규격 F9), 내부 탈퇴 목록 `/internal/v1/deleted-users`. 클레임은 S2 에서 확정한 목록.
- **게이트웨이 조각**(`deploy/gateway-interview.conf` + `scripts/gateway_insert.py`·`apply-gateway-interview.sh`·그 시험): F7 의 games 구성을 따라 ① `= /interview/api/v1/bff/login|callback|logout` → `bff_upstream/bff/interview/…`(헤더 4개) ② `= /_bff_auth_interview`(internal, `$cookie_doro_interview_session = ""` 이면 204, `X-Doro-Service interview`) ③ `/interview/api/` 에 `auth_request`·`auth_request_set`·`error_page`·`Authorization $bff_authorization`, 그리고 **`limit_except GET HEAD PUT { deny all; }`**(쓰기는 M2 에서 PUT 만; 로그아웃은 별도 location 이라 영향 없음). 이 조각은 게이트웨이 기본 설정의 `$bff_authorization` 맵·`@bff_forbidden`·`@bff_unavailable`·`bff_upstream` 에 의존한다(F7) — 없으면 `nginx -t` 가 반영 전에 막는다. 리허설의 가짜 기본 설정에 같은 정의를 복사해 둔다.
- 라우팅 기대 파일 줄(Doro PR 용, 우리 쪽에도 사본): login/callback/logout/session, `/_bff_auth_interview` 404, 진도 PUT 경로.
- **통합 e2e**(`integration.e2e`): 격리 Postgres + jar + 스텁 + 게이트웨이(CSP 강제) + 실제 Chromium. 시나리오: 비로그인 읽기(M1 그대로) → 로그인 버튼 → 스텁 경유 복귀 → `authenticated` → 체크 → **새로고침 유지** → 두 번째 브라우저 컨텍스트(다른 사용자)는 체크 0 → 일괄 체크 확인창 → 노트 저장·유지 → 로그아웃 후 체크 UI 사라짐 → **CSRF 헤더 없는 PUT 직접 호출 403**(게이트웨이) → **쿠키 없이 `Authorization: Bearer 위조`는 통과 규칙**(F7: 쿠키 없을 때 클라이언트 값 통과 — 서비스가 JWKS 서명으로 막는지) → 스텁을 멈추면 쿠키 있는 요청 503·쿠키 없는 읽기는 정상.
- 검증 메모: 허용되지 않은 메서드(DELETE) 응답이 `@bff_forbidden` 의 CSRF 문구 JSON 으로 나오는지 기록한다(A6, 안전하지만 메시지가 틀릴 수 있음). ◆ 조각에서 `auth_request` 제거 → "로그인 상태" 시나리오 실패, ◆ `Authorization` 덮어쓰기 제거 → 위조 시나리오 실패, ◆ `limit_except` 완화 → 메서드 시험 실패.

### S9. 서비스 워커 — §6 에 따라 구현·시험

### S10. 배포 준비물과 CD
- `docker-compose.prod.yml`·`setup-interview-server.sh`: 환경변수 `IAM_HOST`·`IAM_PORT`·`DORO_IAM_INTERNAL_TOKEN`·`INTERVIEW_OAUTH_CLIENT_ID`, 설정 스크립트는 **`DORO_IAM_INTERNAL_TOKEN` 이 `.env` 에 있는지만 점검**(값은 Doro 쪽 `enable-deleted-sync.sh` 가 만든다 — 한 곳에서만 발급)하고 비밀을 출력하지 않는다. 리허설의 가짜 기본 설정·스텁·compose 갱신.
- `docs/DEPLOY.md` 를 M2 용으로 개정(순서는 §7).
- **CD**(§11 Q6 권장): `deploy.yml` 을 games 패턴으로 — `workflow_run`(CI 성공, push 만)·`workflow_dispatch`, `vars.CD_ENABLED == 'true'`, `runs-on: self-hosted`, **`pull_request` 에는 절대 반응하지 않음**(공개 저장소), 동시성 그룹 하나, Doro 를 형제로 체크아웃해 `deploy-on-server.sh` 에 경로 전달. 러너 등록과 `CD_ENABLED` 는 ★. 수동 배포 스크립트는 그대로 남긴다(CD 가 안 될 때의 경로).
- 검증: `scripts/test-deploy-on-server.sh` 시나리오(가짜 docker)에 Doro 경로 누락·SDK 빌드 실패 분기 추가, 워크플로 YAML 문법과 `pull_request` 비반응 확인(트리거 목록 시험), 리허설 전체 모드(레지스트리 되는 환경, ★).

### S11. 결과 기록
- 이 문서 끝에 "결과" 절 추가(M1-PLAN §11 형식: 충족 기준, 시험 수, 시험이 찾은 결함, 계획과 달라진 점, **확인하지 못한 것**), `DESIGN.md` 정정(§12).

## 5. M3 를 위한 인터페이스 (지금 정해 두는 것)

- `progress.read.ProgressReader` 는 JDK 타입만 반환하고(D10) `quiz` 는 이 패키지만 import 한다. M3 의 풀 구성은 `catalog` 의 보이는 질문 목록 ∩ `learnedSlugs(userId)` 이며, **`quiz` 가 `progress` 의 쓰기 클래스를 쓰는 순간 ArchUnit 이 빌드를 깨뜨린다**(변이 검증 ◆: `quiz` 패키지 fixture 가 `ProgressService` 를 import 하면 `ModuleRulesSelfTest` 실패).
- 틀린 질문을 체크 해제하는 일은 **사용자가 사전에서 직접**(DESIGN 결정 3): 해제는 기존 `PUT /progress/{slug}` 를 재사용하므로 M3 에 쓰기 경로가 새로 생기지 않는다.
- 탈퇴: `AccountDeleted` 를 `quiz` 가 듣고 자기 표(`quiz_*`)를 지운다(D11) — `account`·`progress` 변경 없음.
- `user_pref` 는 M3 소유로 둔다(M2 에 만들지 않는다).
- "다시 공부 후보" 합성은 `api`(`ProgressReader` + 미래의 `QuizStatsReader`)가 한다.

## 6. 서비스 워커(PWA)

### 왜 M1 에서 미뤘고 무엇이 달라졌나
M1 D9: **옛 화면 잔류와 CSP**(F13)를 게이트웨이·실제 브라우저로 검증할 수 있을 때 넣기로 했다. 이제 게이트웨이 리허설(CSP 강제, 실제 Chromium)이 있고(M1), 로그인 때문에 **API 는 절대 캐시하면 안 되고 로그인 이동은 앱 셸이 가로채면 안 된다**는 새 요구가 생겼다. 우리 앱은 M1 에서 마크다운 렌더러를 **지연 조각**으로 쪼갰기 때문에 한 가지 위험이 더 있다: 새 배포가 옛 해시 파일을 지우면 **열려 있던 옛 화면이 지연 조각을 받으려다 404** 가 난다(빈 화면). 서비스 워커 유무와 무관하지만 서비스 워커가 있으면 더 오래 열려 있다.

### 설계 (D13, 결정 필요한 갈림길은 §11 Q1·Q2)
1. **도구**: `vite-plugin-pwa`(games·허브와 같음) `generateSW`. 범위 `/interview/`, 파일은 `/interview/sw.js`.
2. **precache**: 빌드 산출물(js·css·html·아이콘·매니페스트)만. 런타임 캐시는 **API 에 대해 없음**(`/interview/api/` 는 서비스 워커를 통과 — 로그인·진도·노트가 캐시에 남지 않는다).
3. **내비게이션**: 허브처럼 **허용 목록**(거부 목록 아님). 허용 = 앱 라우트(`/`, `/t/*`, `/q/*`, `/c/*`, `/concepts`, `/search`, …). 허용 목록은 `routes.ts` 에서 만들어 **라우트가 추가됐는데 허용 목록에 없으면 실패하는 시험**을 둔다. `/interview/api/…`(**로그인·콜백 이동 포함**)와 `/interview/assets/…`(없는 해시 파일은 404 로 남아야 함)는 앱 셸로 대신 응답하지 않는다. 권장: 내비게이션은 **네트워크 우선(짧은 제한 시간) → 실패하면 precache 된 앱 셸**(Q2). 근거: 온라인이면 항상 새 `index.html`(그래서 새 해시 자산과 **현재 게이트웨이의 헤더·CSP**)을 받는다 — 옛 CSP 고착(F13 ②)과 옛 화면 잔류(①)를 구조적으로 줄인다. 오프라인 읽기는 목표가 아니고 앱 셸만 열린다.
4. **업데이트**: `registerType: 'prompt'` 로 새 SW 를 설치만 하고, 확인은 **자주**(탭 복귀 `visibilitychange`·15분 간격, 항상 `registration.update()`), 적용(`skipWaiting` + 새로고침)은 **안전한 순간에만**: 화면이 숨었다 돌아왔고 **노트 초안(S6 레지스트리)이 없을 때**. 초안이 있으면 미룬다. 배너는 두지 않는다(작은 앱, 전례의 결론). F13 ① 의 교훈: `skipWaiting`/`clientsClaim` 이 실제로 동작하는지는 **설정이 아니라 시나리오로** 확인한다.
5. **지연 조각 실패 처리**: `vite:preloadError` 를 잡아 "새 버전이 나왔습니다. 새로고침해 주세요"(사용자 동작; 입력 중인 글을 날리지 않음) 화면/알림. 이것이 SW 이전·무관한 첫 방문자도 지켜 준다.
6. **파일 서빙**: 웹 nginx 가 `sw.js`·`workbox-*.js`·`registerSW.js`(쓴다면)·`manifest.webmanifest` 를 `no-cache` 로(games 규칙 F11 복사). 해시 자산은 immutable 그대로. 서버 수준 CSP 는 게이트웨이 몫이며 이미 `worker-src 'self'; manifest-src 'self'` 가 있다(F12) — **games 는 Report-Only 라 SW 와 CSP 강제의 조합이 운영에서 검증된 적이 없다**: 우리 리허설(강제)이 처음 확인한다.
7. **아이콘·매니페스트**: 이름 "도로 면접", `start_url`·`scope` `/interview/`. 아이콘 192/512·apple-touch·favicon 은 캐릭터가 정해지기 전까지 **글자 기반 임시 아이콘**(Q9).
8. **precache 점검 스크립트**: Doro 의 `scripts/check-sw-precache.sh`(+시험 `test-check-sw-precache.sh`)를 **복사**한다(doro-menu 가 같은 방식으로 복사해 씀, 원본에 "고치면 양쪽을 함께" 주석). `deploy-on-server.sh` 가 이미지 안의 `dist` 에 대해 `pre`(배포 전: 새 해시는 200 또는 404 허용, 3xx·5xx 실패), 배포 후 `post`(전부 200, 정적 파일이 `text/html` 이면 실패)를 돌린다. 실패하면 롤백(M1 의 롤백 경로 재사용).

### 시험 계획 (실제 Chromium, 게이트웨이 경유, CSP 강제) — `web/e2e/pwa.integration.e2e.ts`
리허설에 **두 버전의 `dist`(`VITE_BUILD_MARK=v1|v2` 로 화면에 버전 표식)** 를 만들고, 웹 컨테이너가 바인드 마운트한 디렉터리를 바꿔치는 방식으로 배포를 흉내 낸다(**옛 해시 파일은 삭제**: 실제 이미지 교체와 같다).
1. **설치**: 첫 방문 → SW 활성화 → precache 목록(수)과 `check-sw-precache.sh post` 가 게이트웨이 경유 **전부 200·3xx 0·정적 파일이 HTML 로 오는 것 0**. `securitypolicyviolation` 0건.
2. **업데이트 감지**: v1 화면을 연 채 v2 를 배포 → `registration.update()` → **대기 중인 새 SW 존재, 화면은 아직 v1**(옛 화면이 갑자기 바뀌지 않음).
3. **안전한 순간 적용**: 탭을 숨겼다 복귀 → v2 표식. **노트 초안이 있으면 적용 안 됨**, 저장 후 적용(입력 중 글 보존).
4. **지연 조각**: v1 화면을 연 채(SW 미갱신 상태 포함) v2 배포 후 질문 화면으로 이동 → 빈 화면이 아니라 "새 버전" 안내, 새로고침하면 v2 에서 정상 렌더.
5. **내비게이션 허용 목록**: 로그인 이동(`/interview/api/v1/bff/login`)은 앱 셸이 아니라 BFF 스텁의 302, 없는 `/interview/assets/x.js` 는 404, 앱 라우트 딥링크는 셸. **앱 라우트 목록 ↔ 허용 목록 일치 단위 시험**(라우트 추가 시 실패).
6. **API 비캐시**: `caches` 의 모든 키에 `/api/` 가 없고, 로그아웃·사용자 전환 뒤 세션·진도 응답이 새 사용자의 것(옛 사용자의 응답이 SW 에서 나오지 않음).
7. **옛 CSP 고착 재현**: 게이트웨이의 CSP 를 Report-Only → 강제로 바꾼 뒤 재방문했을 때 **새 헤더가 적용**된다(내비게이션이 네트워크 우선이라서). 설계를 precache 폴백 방식(Q2 대안)으로 바꾸면 이 시나리오가 실패해야 한다(◆).
8. ◆ 변이: `skipWaiting` 계열 옵션 제거(→ 3 실패), 허용 목록을 `/interview/` 전체로 넓힘(→ 5 실패), precache 에 리다이렉트되는 주소를 넣음(→ 1 의 점검 스크립트 실패), `vite:preloadError` 처리 제거(→ 4 실패), 런타임 캐시에 `/api/` 추가(→ 6 실패).
- jsdom 단위: 등록·확인 주기·안전한 순간 판정(숨김/초안/모달) 순수 함수, 허용 목록 정규식 표.
- **정직한 한계(미리 적어 둔다)**: 이미 열려 있던 옛 화면(M1 은 SW 가 없다)에는 업데이트 확인 코드가 없어 **첫 SW 배포 후 한 번은 사용자의 새로고침이 필요**하다(전례와 같음). iOS 홈 화면 앱의 SW 수명주기는 이 환경에서 시험하지 못한다(데스크톱 Chromium 만).

## 7. 새 서비스를 BFF 에 붙이는 순서 — 우리 쪽 / Doro 레포 쪽 / ★ 서버

`Doro/docs/BFF.md` 4단계에 대응한다. **Doro `main` 머지는 운영에 자동 배포**되므로(기억된 운영 규칙) 각 PR 이 서비스가 없어도 안전한 순서로 나눈다.

| 단계 | 하는 일 | 어디서 | 누가 |
|---|---|---|---|
| ① OAuth 클라이언트 | `doro-interview` 등록(`first_party=true`, 콜백 `https://<공개 주소>/interview/api/v1/bff/callback`) | IAM 관리자 API(Doro 의 BFF 전환 런북을 따른다) | ★ 사용자 |
| ② BFF 설정 | `doro.bff.services.interview`(client-id `doro-interview`, 쿠키 `doro_interview_session`·`doro_interview_login`, csrf-header `X-Interview-Csrf`, cookie-path·web-base-path `/interview`, `return-path-relative-to-web-base: true`, redirect-uri), `oauth-client-ids` 기본값에 추가, `.env.example`·compose 환경변수, **BFF 시험(서비스 레지스트리·겹침 검사)에 케이스 추가** | Doro 레포 PR-1 | 사용자(푸시) |
| ③ 게이트웨이 | upstream 두 개, login/callback/logout 정확 일치, `/_bff_auth_interview`, `/interview/api/`(`auth_request`…·`limit_except … PUT`)·`/interview/`·`= /interview`; `gateway/nginx.conf` 참고 사본 + `scripts/gateway-routing/expect-current.txt` 줄 + `GATEWAY_ROUTING_RULES.md` §2.4 문구. 서버 반영은 **스크립트(우리 레포)로 ★**. CI 는 게이트웨이를 배포하지 않는다 | Doro 레포 PR-2(사본·기대 파일) + 우리 `apply-gateway-interview.sh` | 사용자 |
| ④ 서비스 | Bearer 검증 + `GET /api/v1/bff/session`, 탈퇴 동기화 | **우리 레포**(S1·S2·S7) | 이 계획 |

Doro 레포의 나머지 변경(모두 PR-1/PR-2 에 묶거나 따로):
- `scripts/enable-deleted-sync.sh` 의 `SERVICES` 에 `interview`(IAM `DORO_IAM_INTERNAL_TOKENS` 에 `interview:<토큰>` 발급, 서비스 `.env` 에 `DORO_IAM_INTERNAL_TOKEN`) → **auth 컨테이너 재시작 필요**.
- `scripts/split-db-accounts.sh` 에 `interview`(역할 `interview_app`; 항목은 DEPLOY.md §4 에 이미 적어 둠).
- `scripts/post-deploy-smoke.sh` 에 `/interview/` 200, 로그인 시작 302, 컨테이너 목록에 `doro-interview-api`.
- 허브 카드(`serviceCatalog.ts`·`HubPage` 아이콘·시험). 허브 SW 허용 목록은 **바꾸지 않는다**(F10: `/interview/` 는 이미 가로채지 않음).
- (A7) `enable-bff.sh`·`set-bff-mode.sh` 가 서비스 목록을 하드코딩하면 점검.

### 반영 순서와 롤백
(M1 선배포가 이미 서버에 있는지에 따라 갈린다 — §11 Q12.)
1. Doro PR-1 머지(운영 자동 배포; BFF 는 `interview` 를 알게 되지만 쿠키가 없으니 아무 영향 없음) → ★ OAuth 클라이언트 등록 → ★ `enable-deleted-sync.sh --apply --restart-auth`(interview 토큰).
2. ★ `setup-interview-server.sh --apply`(없는 `.env` 값 점검 포함).
3. **M1 이 이미 배포돼 있다면**: 게이트웨이를 **먼저** `apply-gateway-interview.sh --apply --refresh`(새 조각은 옛 읽기 전용 앱과도 호환 — GET 은 그대로, 로그인 경로는 BFF 로 간다). 배포돼 있지 않다면 앱 → 게이트웨이 순서.
4. 우리 앱 배포(수동 `deploy-on-server.sh --apply` 또는 CD). 이 순서면 "로그인 버튼은 보이는데 경로가 없는" 창이 없다. 배포 스크립트는 SW precache `pre/post` 점검을 포함한다.
5. Doro PR-2(게이트웨이 사본·기대 파일·허브 카드) → ★ **실제 도로 계정으로 로그인해 체크·노트·로그아웃 확인**(A1).
- 롤백: 앱은 롤백 태그(M1 스크립트), 게이트웨이는 `nginx.conf.bak-interview-<시각>`, BFF 설정은 Doro PR 되돌리기. 로그인만 문제라면 게이트웨이 조각을 이전 읽기 전용 조각으로 되돌리면 공개 읽기는 즉시 복구된다.

## 8. ★ 사용자가 해야 하는 일 (이 세션이 대신할 수 없는 것)

1. **결정**(§11): 특히 Q1~Q5, Q12(M1 선배포 여부), Q6(CD).
2. **Doro 레포 PR 2~3개 머지·푸시**(§7). 이 세션은 Doro 레포를 고치지 않는다(원하면 변경안을 준비해 줄 수 있다: §11 Q13).
3. **IAM**: OAuth 클라이언트 등록, 내부 토큰 발급(`enable-deleted-sync.sh`), auth 재시작.
4. **서버**: `setup-interview-server.sh`, 게이트웨이 반영, (CD 쓰면) 러너 등록(`setup-github-runner.sh yu-teacher/doro-interview <토큰>`)과 저장소 변수 `CD_ENABLED=true`, 첫 배포.
5. **진짜 로그인 확인**: 실제 도로 계정으로 로그인 → 체크 → 새로고침 유지 → 로그아웃(우리가 못 보는 유일한 구간, A1).
6. **영구 탈퇴 동기화 실제 확인**은 테스트 계정을 실제로 영구 탈퇴시켜야 하고 유예 기간이 있다(Doro 정책) — 일정은 사용자 판단.
7. 레지스트리 되는 환경에서 `scripts/rehearse-deploy.sh` 전체 모드(M1 에서 미확인이던 것 + 이번 Doro 컨텍스트 이미지 빌드).
8. 푸시(레포 첫 푸시 전이라면 CI 5잡 확인).

## 9. 위험과 완화

| 위험 | 영향 | 완화 |
|---|---|---|
| 스텁이 규격을 잘못 흉내(A1) | 시험은 초록인데 진짜 로그인이 실패 | 클레임·헤더를 SDK 소스와 Doro 게이트웨이 설정에서 직접 옮김, ★ 실제 로그인 1회, 선택: Doro e2e 확장(Q10) |
| Doro `main` 의 SDK 변경이 우리 CI 를 깨뜨림 | CI 빨강 | 의도된 결합(D2). 깨지면 Doro 쪽 변경을 먼저 읽는다. 필요하면 `ref` 고정 |
| 이미지 빌드에서 Doro 컨텍스트 가정 실패(A3) | 배포 불가 | S1 에서 실제 빌드로 확인, 실패 시 대안: games 방식(호스트에서 jar 빌드, 형제 마운트) |
| 비로그인 응답이 M1 과 달라짐 | 캐시·시험 회귀 | M1 골든(고정 본문) + `NON_NULL`, ◆ 변이 |
| ETag 가 사용자 상태를 못 반영 | 체크했는데 목록에 안 보임(stale 304) | 본문 해시 유지(D8), 시험·◆ |
| 일괄 체크 실수·경쟁 | 진도 부풀음 | 확인창 + `expectedCount` 409, 개별 해제 쉬움 |
| 노트 XSS·NUL·크기 | 계정 탈취/500 | 텍스트 노드만, CSP, NUL 400, 상한 이중 검사 |
| 탈퇴 직후 경주(무덤 없음) | 탈퇴한 사용자 데이터 부활 | 무덤 upsert(D11), 시험 |
| 서비스 워커가 옛 화면·옛 CSP 고착, 지연 조각 404 | 빈 화면 | §6: 네트워크 우선 내비게이션, 안전한 순간 적용, `vite:preloadError`, 시나리오 시험 8개 |
| 로그인 이동을 앱 셸이 가로챔 | 로그인 불가 | 허용 목록 + 시나리오 5 + 단위 시험 |
| 게이트웨이 조각 반영 순서 실수 | 로그인 버튼 불통 | §7 순서, `nginx -t` 사전 검증, 백업 |
| `limit_except` 403 이 CSRF 문구로 보임(A6) | 혼란 | 리허설에서 확인하고 문서화 |
| 쓰기 속도 제한 없음 | 진도 PUT 남용 | PUT 은 싸고 인증·멱등. 필요하면 게이트웨이 zone 추가(Doro PR) — 지금은 하지 않는다(F8: blog 전용 zone 뿐) |
| 공유 체크아웃에서 다른 세션과 충돌 | 서로의 DB·파일 덮어쓰기 | §10 규칙 |

## 10. 작업 방식 (M1 교훈)

- **공유 체크아웃**: 검수 세션이 `content/` 를 수정한다. `content/` 는 건드리지 않는다. `git add` 는 항상 **자기 파일 경로만**(`-A` 금지), 커밋 전 `git status` 로 남의 변경이 섞이지 않았는지 본다. CI 를 돌릴 때는 `CI_PROJECT=interview-ci-<세션> CI_DB_PORT=<다른 포트>`. 다른 세션의 미커밋 콘텐츠와 섞이지 않은 검증이 필요하면 HEAD 임시 worktree 에 내 파일만 덮어 돌린다. S7·S8·S9 처럼 파일이 겹치지 않는 단계는 **별도 세션으로 병렬** 가능하지만 같은 파일(`ci.yml`, `Dockerfile`, `ModuleRules`, `mobileAudit`)을 건드리는 단계는 한 번에 하나만.
- **핵심 보장은 일부러 망가뜨려 확인**한다(각 단계의 ◆). 시험이 초록이라는 사실만으로 믿지 않는다. 변이로도 못 잡히는 "동등 변이"는 이유를 적고 넘어간다.
- **실제 브라우저·게이트웨이 경유**: 로그인·서비스 워커는 jsdom·curl 로 끝내지 않는다. 통합 e2e 와 PWA 시나리오는 게이트웨이(CSP 강제)를 거친다. Playwright 는 내장 Chromium 헤드리스만(`PW_CHANNEL=chrome` 금지).
- **접근성은 두 겹**: jsdom(axe 구조) + 실제 브라우저(axe 색 대비·터치 영역·넘침). 새 화면(체크박스·확인창·노트·진도 막대·로그인 안 된 상태)을 **두 곳 모두**에 추가한다 — M1 에서 jsdom 만 봤다면 놓쳤을 결함(`h1` 누락)을 실제 브라우저가 찾았다.
- **측정 도구도 시험한다**: 모바일 넘침 측정이 한 번 허점이 있었다(M1). 새 감사 항목은 일부러 깨뜨려 잡히는지 본다.
- 정직한 보고: 환경에서 못 돌린 것(진짜 IAM, 이미지 빌드, iOS)은 "확인하지 못한 것" 에 그대로 적는다.

### 완료 후 기록할 것(S11)
M1-PLAN §11 과 같은 틀의 "결과" 절을 이 문서 끝에 추가한다: 충족 기준 표, 시험 수(백엔드·웹·모바일·e2e·PWA·리허설), 시험이 찾은 결함, 계획과 달라진 점, 확인하지 못한 것.

## 11. 사용자 결정 (2026-10-20: 아래 권장안 전부 확정)

| # | 질문 | 권장 | 이유 / 대안 |
|---|---|---|---|
| Q1 | 서비스 워커 **업데이트 방식** | **조용히 확인 + 안전한 순간 적용**(숨었다 복귀 + 노트 초안 없음) + `vite:preloadError` 안내 | 대안 ① games 식 `autoUpdate`(코드 최소, 열린 화면은 옛 JS 로 남고 지연 조각이 깨질 수 있음) ② 새 버전 배너(작은 앱에 어색하다는 전례) |
| Q2 | **내비게이션 캐시 전략** | **네트워크 우선 + 앱 셸 폴백**(허용 목록) | 대안: 허브·games 식 precache 폴백(구현 쉬움, 오프라인 셸 즉시 표시, 단 옛 CSP·옛 셸 고착 위험). 오프라인은 목표가 아니다 |
| Q3 | **Guard 를 M4 로 미룸**(D3) | 미룬다 | M2 에는 쓸 곳이 없다. 지금 붙이면 죽은 스키마·토큰. 단 Doro AGENTS.md 신규 서비스 절차의 일부를 미루는 것 |
| Q4 | `interview_user` 에서 **닉네임 삭제**(D6) | 삭제 | DoroUser 에 없고 UI 에 안 쓴다. 개인정보 최소화 |
| Q5 | 진도·노트 키를 **slug**(D7) | slug | 카탈로그가 UUID 를 노출하지 않고 slug 가 "고정 ID" 로 설계됨. 대안: UUID(DESIGN 원안, 카탈로그에 id 노출 필요) |
| Q6 | **CD 도입 시점** | 첫 수동 배포가 성공한 **뒤** M2 말미(S10)에 켠다 | 이유: 첫 배포는 사람 눈으로 보는 게 안전(서버 `.env`·게이트웨이 순서). 대안: 첫 배포부터 CD(빠르지만 첫 실패가 자동 롤백에만 의존), 또는 CD 미도입(수동 유지; 배포 빈도가 낮으면 합리적). 러너 등록·`CD_ENABLED` 는 ★ |
| Q7 | SDK 소비 방식(D2) | `includeBuild` + CI 는 Doro `main` | 대안: CI 에서 Doro `ref` 고정(재현성↑, SDK 변경 알림↓) |
| Q8 | 노트 상한 **2,000자**, 모아보기 화면 없음(D14) | 그대로 | 대안: 상한 상향(4,000), 모아보기는 M4 이후 |
| Q9 | 아이콘·캐릭터(M1 D-3 미결) | **임시 글자 아이콘**, 캐릭터는 정해지면 교체 | PWA 설치 아이콘은 지금 필요하다 |
| Q10 | **진짜 IAM 통합 시험**(A1) | CI 는 스텁, 로그인 1회는 ★ 수동 | 선택: Doro `e2e/` 에 우리 서비스를 둘째 서비스로 추가(Doro PR; 진짜 IAM·BFF·게이트웨이 템플릿으로 자동화). 비용이 크므로 M2 이후 필요가 확인되면 |
| Q11 | 일괄 체크의 `expectedCount`·409(D9) | 포함 | 비용 작고 경쟁을 막는다. 대안: 확인창만(단순) |
| Q12 | **M1 읽기 전용 선배포가 이미 서버에 있나?** | (사실 확인 필요) | 있으면 §7 은 "게이트웨이 refresh → 앱 배포", 없으면 "앱 → 게이트웨이". 이 계획은 둘 다 적었다 |
| Q13 | **Doro 레포 변경안을 이 세션이 미리 만들어 둘까?**(브랜치·diff 만, 푸시 없음) | 만들어 준다 | §7 의 PR-1/PR-2 를 실제 변경으로 준비하면 사용자는 검토·푸시만 하면 된다. 단 Doro 체크아웃은 다른 작업과 공유되므로 별도 worktree 에서 |

## 12. DESIGN.md 정정 목록

즉시 반영(이 계획 커밋에 포함): §12 의 **M2 행**(범위·완료 기준 확장: 노트·서비스 워커·탈퇴 동기화 포함)과 **M4 행**(노트·탈퇴 동기화가 M2 로 이동, M4 = 편집자 화면 + Guard).

사용자가 Q3~Q5 를 확정했으므로 구현하며 함께 반영했다(S11 에서 DESIGN.md 에 반영 완료): §6.0·§6 의 `interview_user.nickname` 삭제, `user_progress`·`my_note` 의 `question_id` → `question_slug`, §6.0 의 의존 규칙 문구(SDK 는 `account` 만, `quiz → progress.read` 만), §9 의 경로 표기(`/api/v1/…`, `PUT /progress` 의 `expectedCount`), §10 의 Guard 시점(M4)·탈퇴 이벤트 구조, §11 의 PWA 항목(§6 참조).

## 13. 결과 (2026-10-20)

로컬 커밋 S1~S10(`git log` 의 `feat(M2 S…)`), 푸시·서버 반영 전. 검증은 다른 세션의 미커밋 콘텐츠가 섞이지 않도록 HEAD 기준 깨끗한 체크아웃에 내 파일만 덮어서 돌렸다.

### 완료 기준: 충족 (진짜 IAM 연동 제외)
| 기준 | 확인 |
|---|---|
| 로그인 상태 조회 | `SessionApiTest`: 비로그인·위조·만료·다른 클라이언트·탈퇴 사용자는 200 `authenticated:false`, 유효 토큰은 true + 행 하나(동시 10 요청에도), PII 없음, `no-store` |
| 체크·해제 멱등, 병렬 안전 | `ProgressServiceTest`(20 스레드 체크 → 행 1, `learned_at` 불변), `ProgressApiTest` |
| 주제 일괄 + 경쟁 방지 | `expectedCount` 불일치 409(서비스·API·웹 확인창 재개방) |
| **사용자 id 를 입력으로 받는 엔드포인트 없음** | `ApiSurfaceTest`: 핸들러를 열거해 경로·쿼리·본문 어디에도 `userId` 가 없고, 공개 목록 밖의 모든 엔드포인트는 비로그인 401(새 엔드포인트는 자동으로 대상) |
| 진도 수치가 손계산과 일치 | `ProgressServiceTest`(공개 2주제·닫힌 질문·부분 체크, 닫힌 질문의 옛 기록은 분모·분자에서 제외) |
| `learned` 합성은 로그인 응답에만 | `LearnedMergeTest`: 비로그인 본문은 읽기 모델 직렬화와 바이트 동일, 로그인 응답에서 `learned` 만 빼면 비로그인과 같음, **체크 전후 ETag 가 다르고 옛 ETag 는 304 가 아니라 200**, 사용자별 ETag |
| 내 노트 | 2,000자(코드포인트), NUL 400(PostgreSQL TEXT 는 NUL 을 못 담는다), 공백은 삭제, `<script>` 그대로, 본문 크기 상한 413, DB `CHECK` 와 서비스 검사 이중 |
| 탈퇴 동기화 | SDK 가 가짜 IAM 내부 API 를 실제로 호출해 우리 핸들러까지 간다. 멱등, 방문한 적 없는 사용자도 무덤 표식, 리스너 실패 시 전체 롤백, 진행 위치는 앞으로만, 토큰 틀림은 예외로 드러남 |
| 서비스 워커 | 실제 Chromium·게이트웨이(CSP 강제)·웹 nginx: 설치(미리 캐시 전부 200)·업데이트 감지·**안전한 순간 적용(노트 초안이 있으면 미룸)**·지연 조각 실패 안내·내비게이션 허용 목록(오프라인 포함)·API 비캐시·CSP 전환 |
| 모바일 감사 | 실제 Chromium 264개(M1 168 + 로그인 상태 화면 6종 × 폭 4 × 라이트·다크 + 비텍스트 대비 검사) |

| 시험 | 수 | 위치 |
|---|---|---|
| 백엔드 JUnit(실제 Postgres, 깨끗한 체크아웃) | 346 (M1 228 → +118) | `scripts/ci-test.sh backend` |
| 파이썬(변환기·게이트웨이 삽입·워크플로 정책) | 62 | 〃 |
| 가짜 Doro 스텁 규격(node --test) | 13 | 〃 |
| 서비스 워커 미리 캐시 점검 스크립트 | 14 | 〃 |
| 배포 스크립트 시나리오(가짜 docker·curl) | 58 | 〃 |
| 웹 단위(vitest, jsdom, axe 구조) | 247 중 246 통과 — 1건은 아래 "다른 세션의 콘텐츠" | `scripts/ci-test.sh web` |
| 모바일 레이아웃·접근성(실제 Chromium) | 264 | `scripts/ci-test.sh mobile` |
| 통합 e2e(실제 jar·DB·가짜 Doro·게이트웨이·Chromium) | 44 통과(+24 건너뜀: 휴대폰 프로젝트·empty 단계) — BFF 9 + 서비스 워커 8 + M1 읽기 흐름 | `scripts/ci-test.sh e2e` |
| 배포 리허설 프리빌트(게이트웨이·CSP 강제·실제 브라우저) | 통과 | `REHEARSE_MODE=prebuilt scripts/rehearse-deploy.sh` |
| 워크플로 문법 | `actionlint` 통과 | |

번들: 첫 화면 JS gzip 93.5KB(예산 150), 마크다운 지연 조각 93.5KB(예산 120). 미리 캐시 15개 637.9KiB.

**테스트가 실제로 잡는지 확인했다**: 핵심 보장마다 일부러 망가뜨려(변이 ◆) 약 30건. 가시성 조건, 무덤 검사, `cid` 허용 목록(비우면 전부 거부·다른 클라이언트 추가하면 통과해 버림), `ON CONFLICT DO NOTHING` → `DO UPDATE`, 노트 길이·NUL 검사(서비스·DB 각각), 비로그인에도 `learned` 합성, 질문 상세의 `learned` 누락(ETag 가 안 바뀜), 확인창 건너뛰기, 낙관 갱신 롤백·직렬화, 진도 막대 대비(실제 브라우저 비텍스트 대비 1.48:1 → 감사 실패), 리스너 제거, 무덤 upsert → "있을 때만 갱신", 게이트웨이 `auth_request`·`Authorization` 덮어쓰기·`limit_except` 완화, 서비스 워커 6종(skipWaiting 메시지 처리, 허용 목록 확대, 이동 주소 미리 캐시, `vite:preloadError`, API 런타임 캐시, 내비게이션 캐시 우선), `pull_request` 트리거 추가까지.

### 시험이 찾아낸 결함 (고쳤다)
- **체크박스의 접근 가능한 이름**: 라벨 뒤에 숨은 글자를 붙이니 jsdom 은 "학습함: 제목" 인데 **실제 Chromium 은 "학습함 : 제목"** 이었다(브라우저마다 공백이 다르다) → `aria-label` 로 못 박음. 단위 시험만 봤다면 놓쳤다.
- **320px 헤더**: 세션 오류 안내가 붙으면 "개념" 링크가 20px 로 눌렸다(실제 브라우저 레이아웃 감사가 발견) → 메뉴 줄바꿈 허용·`shrink-0`.
- **서비스 워커가 `/interview/` 를 캐시 우선으로 응답**: workbox 기본 `precacheAndRoute` 는 `directoryIndex` 로 `/interview/` 를 미리 캐시된 `index.html` 에 맞춘다 → 앱의 첫 주소가 옛 셸(옛 CSP 헤더 포함)에 고착된다(M1 F13 의 바로 그 위험). 시나리오 "옛 CSP 고착" 이 잡았고, 내비게이션을 미리 캐시 라우트에서 빼고 자산만 캐시 우선으로 바꿨다.
- **JSON 본문 검증**: Jackson 의 `@JsonIgnoreProperties(ignoreUnknown=false)` 는 "미지정" 이라 모르는 필드를 거부하지 않았다(`{"learned":true,"userId":…}` 가 통과) → 본문을 맵으로 받아 필드 집합을 정확히 검사. 또 읽을 수 없는 본문이 **500** 이 되던 것을 400·415 로 바로잡았다.
- **게이트웨이 BFF 공용 정의 누락**: 리허설용 기준 설정에는 `$bff_token` 을 만드는 `auth_request_set` 이 없어 nginx 가 뜨지 않았다(실제 게이트웨이는 다른 서비스가 정의). 기준 설정을 고치고, 실제 삽입 스크립트가 **공용 정의가 없으면 반영 전에 거부**하게 했다(없는 채 열리면 인증이 빠질 수 있다).
- **통합 e2e 도구의 함정 세 가지**: ① nginx 의 ETag 는 수정 시각(초)+크기라서, 해시 길이가 같은 두 빌드를 같은 초에 연달아 바꿔치면 내용이 달라도 검증값이 같아 브라우저가 304 로 옛 `sw.js` 를 썼다(실제 배포는 분 단위라 해당 없음, 시험 쪽에서 수정 시각을 달리함) ② 바인드 마운트 변경이 컨테이너에 보이기까지 시간이 걸려 **내용 전체**가 보일 때까지 기다림 ③ 게이트웨이 설정 파일 덮어쓰기도 전파 대기.
- `check-sw-precache.sh`(Doro 에서 복사)가 **injectManifest 출력(JSON 모양 목록)을 읽지 못했고** 번들된 workbox 를 별도 파일로 착각했다 → 복사본을 보강하고 "목록을 못 읽으면 실패" 로 바꿨다. **Doro 원본에도 같은 한계**(generateSW 만 가정)가 있어 알려 둔다.

### 관찰한 것 (결함은 아님, 기록)
- **A6**: 허용하지 않는 메서드(`DELETE`)는 게이트웨이 `limit_except` 가 만든 403 이 `error_page` 로 **CSRF 문구 JSON**(`AUTH-403-03`)이 된다. 안전하지만 메시지가 부정확하다.
- 브라우저 HTTP 캐시는 304 응답을 합칠 때 옛 응답에만 있던 헤더를 남긴다: 게이트웨이를 Report-Only → 강제로 바꾸면 한동안 두 헤더가 같이 보일 수 있다(강제 정책은 적용된다). **강제 → Report-Only 방향이면 옛 강제 헤더가 남을 수 있다.** 서비스 워커와 무관한 브라우저 동작이다.
- A5: `DORO_IAM_INTERNAL_TOKEN` 이 비면 SDK 클라이언트가 기동 때 경고하고, 동기화는 401 로 실패하며 주기 실행은 경고만 남기고 이어간다(조용히 실패하지 않는다). 시험으로 확인.
- A2·A3(SDK 와 오류 규격 충돌 없음·이미지 빌드의 Doro 부분 복사)는 S1 에서 확인했다.

### 계획과 달라진 점
- **서비스 워커 도구**: `generateSW` 대신 **`injectManifest`**(`sw/sw.ts`). generateSW 는 `NavigationRoute`(미리 캐시 폴백)를 런타임 캐시보다 먼저 등록해서 "네트워크 우선 → 앱 셸 폴백"(Q2 확정안)을 만들 수 없다. 허용 목록은 `routes.ts` 의 `APP_ROUTE_PATHS` 한 곳에서 만들고 `App.tsx` 의 라우트도 같은 목록에서 만든다(새 화면이 목록에서 빠질 수 없다).
- `GET /progress/summary` 는 로그인 필수(401), 로그인 응답의 사전 GET 은 `Cache-Control: private, no-cache`(계획에 없던 보강).
- 오류 코드 409·413·415 추가, 본문 크기 상한 필터(32KiB) 추가.
- 통합 e2e 의 웹은 `vite preview` 가 아니라 **운영과 같은 `web/nginx.conf` 의 nginx 컨테이너**(dist 바인드 마운트)로 바꿨다(`sw.js` 헤더 규칙·두 빌드 바꿔치기를 실제로 시험하려고). 가짜 Doro 에는 장애 흉내(`/dev/outage`)를 더했다(프로세스를 죽이지 않고 복구 가능).
- 화면의 빌드 표식(`VITE_BUILD_MARK`, 운영 빌드에는 없음)을 추가했다.
- 아이콘은 **임시**(말풍선+체크, 순수 파이썬으로 생성). 캐릭터가 정해지면 교체(Q9).

### 이 환경에서 **확인하지 못한 것** (정직하게)
1. **진짜 IAM·BFF 와의 로그인**(PKCE·`redirect_uri` 정확 일치·`cid`·IAM 화면): 가짜 Doro 는 **우리가 읽은 규격대로 흉내 낸 것**이라 규격을 잘못 읽었으면 스텁도 같이 틀린다. DEPLOY.md "마지막 확인" 1회가 필요하다(A1).
2. **리허설 전체 모드·실제 이미지 롤백**: `docker pull` 이 이 환경에서 멈춰 프리빌트까지만 돌렸다(M1 과 같다). 이번에 늘어난 **이미지 안 dist 의 `check-sw-precache.sh` 호출(`image:` 경로)** 도 가짜 docker 로만 시험했다.
3. **GitHub Actions**: `ci.yml`(backend 에 node·pyyaml 추가, e2e 에 `E2E_BIND_HOST=0.0.0.0`)·`deploy.yml` 은 한 번도 실행되지 않았다(`actionlint`·정책 시험만). 특히 **리눅스 러너에서 게이트웨이 컨테이너가 호스트의 jar·스텁에 닿는 경로(`host-gateway`)** 는 이 환경(Docker Desktop)에서 확인하지 못했다.
4. 서버 작업(★)·Doro 레포 변경(PR-1 BFF 설정, PR-2 게이트웨이 사본·기대 파일, `enable-deleted-sync.sh`, `split-db-accounts.sh`, 스모크, 허브 카드, A7 의 `enable-bff.sh`·`set-bff-mode.sh` 하드코딩 점검)은 하지 않았다.
5. **iOS 홈 화면 앱의 서비스 워커 수명주기**, 설치 가능성(Chrome 설치 프롬프트)은 확인하지 못했다(데스크톱 Chromium 의 등록·업데이트만).
6. CD: 러너 등록과 `CD_ENABLED` 는 ★.

### 다른 세션의 콘텐츠에서 발견한 것 (내 변경 아님)
- 웹 코퍼스 시험 `본문의 글(단어)이 하나도 사라지지 않는다` 가 새 콘텐츠 `dbp-13` 의 **"`count()가`"** 에서 실패한다(렌더링된 본문에 그 글자가 없다). M1 의 코퍼스 골든이 새 질문에서 마크다운 렌더링 결함(또는 원문 표기 문제)을 잡은 것으로 보인다. 검수 세션이 확인해야 한다.
- 한때 `content/database/` 가 `_topic.yml` 없이 커밋 전 상태라 jar 의 콘텐츠 로더가 기동을 거부했다(fail-fast 가 의도대로 동작). 통합 e2e 를 HEAD 기준 체크아웃으로 돌린 이유다.

### 사용자가 할 일 (★)
1. ~~A4 결정~~: SDK 기동 경고 1건은 **2026-10-20 사용자가 "그대로 둔다"로 결정**했다(doro-games 와 같은 기본값, 바꾼다면 서비스 전체를 한 번에). 자세한 내용은 비공개 메모에 있다.
2. 푸시(저장소 첫 푸시라면 CI 5잡 확인) — 특히 e2e·rehearse 잡이 리눅스에서 도는지.
3. Doro 레포 PR 둘(BFF 설정 / 게이트웨이 사본·기대 파일) + `enable-deleted-sync.sh`·`split-db-accounts.sh` 에 `interview` 추가 — 내용은 DEPLOY.md 에 있다.
4. 서버: DEPLOY.md 1→2→3 순서, IAM 에 OAuth 클라이언트 등록, 게이트웨이 반영, 진짜 로그인 1회 확인.
5. (선택) 러너 등록·`CD_ENABLED=true`. 레지스트리가 되는 곳에서 `scripts/rehearse-deploy.sh`(전체 모드).

