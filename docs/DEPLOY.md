# 배포 (M2: 읽기 + 로그인·학습 체크·내 노트 + 서비스 워커)

Doro 서브 서비스 표준 절차(Doro `AGENTS.md` 5장)를 따른다. 로그인은 **서비스 밖의 BFF(`doro-bff`)** 가 맡고, 이 서비스는 게이트웨이가 붙여 준 Bearer 를 JWKS 로 검증하고 `GET /api/v1/bff/session` 으로 로그인 상태를 알려 준다. Guard(권한 판정)는 편집자 권한이 생기는 M4 에서 붙인다(`docs/M2-PLAN.md` D3).

| 구성 | 이름 | 포트(서버 `127.0.0.1` 바인딩) |
|---|---|---|
| API | `doro-interview-api` | 8088 |
| 웹(SPA + 서비스 워커) | `doro-interview-web` | 3007 |
| DB | `service_interview` | (Postgres 컨테이너 안) |
| 게이트웨이 경로 | `/interview/`, `/interview/api/`(+ BFF 로그인·콜백·로그아웃) | — |

이미지는 **이미지 안에서 빌드**한다(멀티스테이지). 서버에 Java 25·Node 가 없어도 된다. 백엔드는 Doro SDK 소스를 쓰므로 **Doro 체크아웃이 형제 디렉터리(`../Doro`)** 또는 `DORO_DIR` 로 필요하다(compose 의 `additional_contexts`).

## 0. 먼저 로컬에서 (서버를 건드리지 않는다)

```bash
scripts/ci-test.sh all          # 백엔드·웹·모바일·통합 e2e(리허설은 도커 레지스트리가 되는 환경에서)
scripts/ci-test.sh e2e          # 통합 e2e 만
scripts/rehearse-deploy.sh      # 배포 리허설(REHEARSE_MODE=prebuilt 로 이미지 빌드 없이 게이트웨이·라우팅·CSP 만)
```

**통합 e2e**(`scripts/e2e-test.sh`)는 격리 Postgres + 백엔드 jar + **가짜 Doro**(IAM JWKS·BFF·내부 API 스텁) + 실제 웹 nginx(`web/nginx.conf`) + **실제 게이트웨이 설정 조각(CSP 강제)** + 실제 Chromium 으로 확인한다:
로그인(쿠키 → `auth_request` → `Authorization`)·체크·새로고침 유지·사용자 격리·주제 일괄·내 노트·로그아웃·CSRF 403·위조 헤더·BFF 장애 503, 그리고 서비스 워커(설치·두 빌드를 바꿔치는 업데이트·안전한 순간 적용·지연 조각 실패 안내·내비게이션 허용 목록·API 비캐시·CSP 전환).
**가짜 Doro 는 우리가 읽은 BFF 규격을 흉내 낸 것**이라, 진짜 로그인(PKCE·IAM 화면·`redirect_uri` 정확 일치)은 여기서 확인되지 않는다 — 아래 "로그인 연결"의 마지막 단계에서 사람이 한 번 확인한다.

**배포 리허설**(`scripts/rehearse-deploy.sh`)은 서버에서 쓸 스크립트와 이미지를 격리 환경에서 그대로 돌린다:
1. `setup-interview-server.sh`: dry-run 무변화, apply 는 DB·`.env`(권한 600) 생성·비밀 비출력, 두 번째 apply 무변화.
2. 첫 배포(운영 설정: `prod` 프로파일, 비공개 노출 꺼짐), 비루트, healthy.
3. 게이트웨이 반영: dry-run → `--report-only` → 멱등 → `--refresh` 로 CSP 강제. 다른 서비스는 그대로.
4. 라우팅: `/interview` 301, SPA 경로는 앱 셸, 없는 해시 자산 404, 쓰기 메서드 차단(403), ETag 304.
5. 실제 브라우저(CSP 강제), 두 번째 배포(롤백 태그·reload·경유 확인), 롤백(깨진 콘텐츠 이미지 → 이전 이미지 자동 복구).

## 1. 서버 준비 (★ 사용자, 최초 1회)

```bash
# 저장소를 서버의 ~/doro-interview 로 가져온다(git clone 또는 rsync). 이후 명령은 그 디렉터리에서 실행한다.
scripts/setup-interview-server.sh --dry-run      # 바꿀 것만 출력
scripts/setup-interview-server.sh --apply        # DB service_interview 와 ~/doro-interview/.env 생성
```

`.env` 에는 DB 접속 계정·비밀번호가 있다(`~/doro/.env` 의 슈퍼유저 값을 복사, 값은 출력되지 않는다). 서비스 전용 계정으로 바꾸는 것은 5단계다.
`DORO_IAM_INTERNAL_TOKEN`(탈퇴 동기화용)은 **Doro 쪽 `enable-deleted-sync.sh` 가 발급해 `.env` 에 넣는다**(발급은 한 곳). 스크립트는 그 값이 있는지만 알려 주고 값은 읽어 출력하지 않는다. 없어도 서비스는 뜨고, 탈퇴 동기화 호출이 거절되며 경고가 남는다.

## 2. 컨테이너 기동 (게이트웨이 반영 전)

```bash
scripts/deploy-on-server.sh --dry-run                # 계획과 compose 설정 검증
scripts/deploy-on-server.sh --apply --no-gateway     # 빌드 → 기동 → healthy → 컨테이너 안에서 직접 확인
```

첫 빌드는 gradle·npm 의존성을 받느라 몇 분 걸린다. 실패하면 이전 이미지로 되돌리고(첫 배포면 새 컨테이너를 멈춘다) 비정상 종료한다.

## 3. 로그인 연결 (★ 사용자 + Doro 레포 PR) — 이 순서로

`Doro/docs/BFF.md` 의 "새 서비스를 붙이는 순서"에 대응한다. **Doro `main` 머지는 운영에 자동 배포**되므로 각 단계가 서비스가 없어도 안전한 순서다. 푸시와 PR 은 사용자가 한다.

| 단계 | 하는 일 | 어디서 |
|---|---|---|
| ① OAuth 클라이언트 | `doro-interview` 등록(`first_party=true`, 콜백 `https://<공개 주소>/interview/api/v1/bff/callback`) | IAM 관리자 API(Doro 의 BFF 전환 런북) ★ |
| ② BFF 설정 | 아래 설정 항목 추가, `doro.iam.oauth-client-ids` 기본값에 `doro-interview`, `.env.example`·compose 환경변수, **BFF 시험(서비스 레지스트리·겹침 검사)에 케이스 추가** | Doro 레포 PR-1 |
| ③ 게이트웨이 | 이 저장소 `scripts/apply-gateway-interview.sh` 로 서버 반영 ★. Doro 레포에는 `gateway/nginx.conf` 참고 사본·`scripts/gateway-routing/expect-current.txt` 줄·`GATEWAY_ROUTING_RULES.md` 문구 | 우리 스크립트 + Doro 레포 PR-2 |
| ④ 탈퇴 동기화 | `scripts/enable-deleted-sync.sh` 의 `SERVICES` 에 `interview`(IAM 의 `DORO_IAM_INTERNAL_TOKENS` 에 `interview:<토큰>`, 서비스 `.env` 에 같은 토큰) — **auth 컨테이너 재시작 필요** ★ | Doro 레포 PR + 서버 |
| ⑤ 서비스 | Bearer 검증 + `GET /api/v1/bff/session` + 탈퇴 동기화 | 이 저장소(완료) |

②의 BFF 설정(`doro.bff.services.interview`):

```yaml
interview:
  client-id: ${INTERVIEW_OAUTH_CLIENT_ID:doro-interview}
  cookie-name: doro_interview_session
  login-cookie-name: doro_interview_login
  csrf-header: X-Interview-Csrf
  cookie-path: /interview
  web-base-path: /interview
  return-path-relative-to-web-base: true
  redirect-uri: ${INTERVIEW_OAUTH_REDIRECT_URI:http://localhost:3007/interview/api/v1/bff/callback}
```

③ 게이트웨이 반영(서버):

```bash
scripts/apply-gateway-interview.sh --dry-run                # 새 설정을 컨테이너 안에서 nginx -t 로 검증하고 diff 만 본다
scripts/apply-gateway-interview.sh --apply --report-only    # CSP 를 Report-Only 로 시험 반영(권장: 처음)
scripts/apply-gateway-interview.sh --apply --refresh        # 한동안 /csp-report 에 위반이 없으면 CSP 강제로 다시 쓴다
```

이 조각은 게이트웨이 기본 설정의 BFF 공용 정의(`bff_upstream`·`$bff_authorization`·`@bff_forbidden`·`@bff_unavailable`)에 기댄다. 없으면 스크립트가 **반영 전에 거부**한다(인증이 조용히 빠진 채 열리지 않게). 반영 전 백업(`nginx.conf.bak-interview-<시각>`), 같은 inode 로 덮어쓰기, `nginx -t` + reload, 공개 주소 확인, 하나라도 틀리면 백업으로 되돌린다. 쓰기는 `PUT` 만 통과한다(체크·노트는 멱등 PUT). 허용되지 않은 메서드(예: `DELETE`)는 게이트웨이가 **403 + "요청을 확인할 수 없습니다" 문구**로 끝낸다(안전하지만 CSRF 문구라 설명이 부정확하다).

Doro 레포 PR-2 의 `expect-current.txt` 에 더할 줄:

```
GET /interview/api/v1/bff/login?return=%2Fq%2Ftx-01      200 doro-bff-api         /bff/interview/login?return=%2Fq%2Ftx-01
GET /interview/api/v1/bff/callback?code=x&state=y        200 doro-bff-api         /bff/interview/callback?code=x&state=y
POST /interview/api/v1/bff/logout                        200 doro-bff-api         /bff/interview/logout
GET /interview/api/v1/bff/session                        200 doro-interview-api   /api/v1/bff/session
GET /interview/api/v1/progress/summary                   200 doro-interview-api   /api/v1/progress/summary
PUT /interview/api/v1/progress/tx-01                     200 doro-interview-api   /api/v1/progress/tx-01
GET /_bff_auth_interview                                 404 none
```

Doro 레포에서 같이 할 일: `scripts/split-db-accounts.sh`(5단계), `scripts/post-deploy-smoke.sh`(`/interview/` 200, 로그인 시작 302, 컨테이너 목록), 허브 카드(허브 서비스 워커 허용 목록은 **바꾸지 않는다**: `/interview/` 는 이미 가로채지 않는다). `enable-bff.sh`·`set-bff-mode.sh` 가 서비스 목록을 하드코딩하는지 점검한다.

**마지막 확인(사람, 1회)**: 공개 주소에서 로그인 → 보던 화면으로 복귀 → 질문 체크 → 새로고침 후 유지 → 로그아웃. 이 한 번이 가짜 Doro 가 흉내 낸 규격을 진짜와 맞대어 보는 유일한 시험이다.

## 4. 이후 서비스 설정 메모

- 환경변수(compose): `IAM_HOST`·`IAM_PORT`(JWKS·내부 API 주소), `INTERVIEW_OAUTH_CLIENT_ID`(허용하는 토큰의 클라이언트), `DORO_IAM_INTERNAL_TOKEN`. 모두 서버의 `.env`/compose 가 기준이다.
- 서비스 워커·`manifest.webmanifest` 는 웹 nginx 가 `no-cache` 로 내보낸다(`web/nginx.conf`). 새 배포 직후 `scripts/check-sw-precache.sh` 가 **배포 전·후**에 이미지 안의 dist 기준으로 미리 캐시 목록 전체를 게이트웨이 경유로 점검하고(이동 0·정적 파일이 HTML 로 오는 것 0), 실패하면 롤백한다.

## 5. 서비스 전용 DB 계정 (★ 사용자, 권장)

서버의 모든 서비스는 슈퍼유저가 아니라 **전용 DB 소유 계정**을 쓴다(2026-10-19 계정 분리). Doro 레포의 `scripts/split-db-accounts.sh` 의 `cfg()` 와 서비스 목록에 다음을 더한 뒤(Doro 레포 PR) 서버에서 실행한다:

```
interview) DB=service_interview; ROLE=interview_app; KIND=sibling; DIR="$HOME/doro-interview"; SERVICE=interview-api; CONTAINER=doro-interview-api; USERVAR=DB_USER; PASSVAR=DB_PASSWORD ;;
```

```bash
ssh mini 'bash -s -- --check'              < scripts/split-db-accounts.sh   # 읽기 전용 확인
ssh mini 'bash -s -- --apply interview'    < scripts/split-db-accounts.sh   # .env 를 전용 계정으로 바꾸고 컨테이너를 다시 만든다
```

이 스크립트는 healthy 가 되지 않으면 `.env` 를 되돌린다. 전용 계정은 마이그레이션(V1~V7)을 직접 실행할 수 있는 DB 소유자여야 한다.

## 6. 공개 (검수 뒤)

배포만으로는 **아무것도 보이지 않는다**: 시드 콘텐츠는 `DRAFT` 이거나 주제가 비공개(`published: false`)다. 검수가 끝난 주제의 `_topic.yml` 에서 `published: true`(그 주제의 모든 질문이 `REVIEWED` 여야 로더가 받아 준다)로 바꿔 커밋하고 다시 배포하면 그 주제만 열린다([REVIEW-TRACK.md](REVIEW-TRACK.md)). 운영(`prod`)에서는 개발용 노출 스위치(`interview.catalog.expose-unpublished`)를 켜면 **기동이 거부**된다.

## 이후 배포

```bash
scripts/deploy-on-server.sh --apply
```

현재 이미지에 롤백 태그를 붙이고(이미지 **이름으로**) → 빌드 → **서비스 워커 미리 캐시 점검(배포 전)** → 재생성 → healthy 대기 → 게이트웨이 `nginx -t` + reload → 게이트웨이 경유 확인(짧게 재시도) → **미리 캐시 점검(배포 후)**. 어느 단계든 실패하면 롤백 태그를 되살려 다시 만들고 reload 한다. 서버의 compose 파일은 배포가 덮어쓰지 않는 기준 사본이다(저장소의 `docker-compose.prod.yml` 은 참고본).

성공한 배포는 끝에 롤백 태그를 이미지마다 최근 3개(`INTERVIEW_KEEP_ROLLBACKS`)만 남기고 지운다. 실패해 롤백한 배포는 아무것도 지우지 않는다.

수동 롤백: `docker tag doro-interview-api:rollback-<시각> doro-interview-api:latest` (웹도 같게) 후
`docker compose -p interview -f docker-compose.prod.yml up -d --no-build --no-deps --force-recreate interview-api interview-web`, 이어서 `docker exec doro-gateway nginx -s reload`.

### AI 피드백(M6, 선택 — 기본 꺼짐)
코드는 배포돼 있지만 **서버에서 두 환경변수를 넣기 전까지는 아무 일도 일어나지 않는다**(화면에 버튼도 없다). 켜려면 `~/doro-interview/.env` 에 `INTERVIEW_AI_ENABLED=true` 와 `GEMINI_API_KEY=<키>`(기본 공급자 Gemini; Anthropic 은 `INTERVIEW_AI_PROVIDER=anthropic` 과 `ANTHROPIC_API_KEY`) 를 넣고, 서버 쪽 `docker-compose.prod.yml` 의 `interview-api` 환경에 두 변수를 전달하는 줄을 더한 뒤 api 컨테이너만 다시 만든다. 선택 변수: `INTERVIEW_AI_MODEL`(공급자가 정한 모델 이름 그대로, 기본 `gemini-2.5-flash`), `INTERVIEW_AI_PER_USER_PER_DAY`(10), `INTERVIEW_AI_GLOBAL_PER_DAY`(100), `INTERVIEW_AI_TIMEOUT`(PT20S), `INTERVIEW_AI_MAX_OUTPUT_TOKENS`(500). 키는 읽거나 출력하지 않는다. 끄려면 `INTERVIEW_AI_ENABLED` 를 지우거나 false 로 하고 컨테이너를 다시 만든다(저장된 피드백은 남는다). 자세한 설계·한도는 [M6-PLAN.md](M6-PLAN.md).

### 자동 배포(CD, 선택)

`.github/workflows/deploy.yml`: CI 가 **main 에서 push 로** 통과한 커밋만, 서버의 셀프호스티드 러너가 `scripts/deploy-on-server.sh --apply` 를 실행한다(`INTERVIEW_ENV_FILE=$HOME/doro-interview/.env`, `DORO_DIR` = 러너가 받은 Doro 체크아웃). `pull_request` 에는 절대 반응하지 않는다(공개 저장소: 외부 기여자의 코드가 서버 러너에서 돌면 안 된다 — `scripts/test_workflows.py` 가 고정한다). 저장소 변수 `CD_ENABLED=true` 가 아니면 건너뛴다.
★ 사용자: 서버에 러너 등록(저장소 Settings → Actions → Runners), `CD_ENABLED=true` 설정. 첫 배포·게이트웨이 반영·로그인 연결은 CD 가 아니라 사람이 위 순서대로 한다. CD 가 안 될 때는 위 수동 스크립트가 그대로 쓰인다.

## 확인 목록 (공개 주소로 실제 호출)

```bash
curl -sI https://<공개 주소>/interview/ | head -1                              # 200
curl -s  https://<공개 주소>/interview/api/v1/categories                       # {"success":true,"data":[...]}
curl -s  https://<공개 주소>/interview/api/v1/bff/session                      # {"success":true,"data":{"authenticated":false}} (비로그인)
curl -sI https://<공개 주소>/interview | head -1                                # 301
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<공개 주소>/interview/api/v1/progress/tx-01   # 403(쓰기 메서드는 PUT 만)
curl -sI https://<공개 주소>/interview/sw.js | grep -i cache-control            # no-cache
curl -sI https://<공개 주소>/interview/ | grep -i content-security-policy       # 강제 모드면 Content-Security-Policy, 처음엔 …-Report-Only
```

## 아직 확인하지 못한 것

- **진짜 Doro 와의 로그인**(PKCE·`redirect_uri`·IAM 화면): 가짜 Doro 스텁으로만 시험했다. 위 "마지막 확인" 1회가 필요하다.
- **리허설 전체 모드**(실제 Dockerfile 이미지 빌드·`deploy-on-server.sh` 의 배포 부분·실제 롤백): 이 환경에서는 도커 레지스트리 접근이 막혀 `prebuilt` 모드까지만 돌렸다. 레지스트리가 되는 환경(또는 CI `rehearse` 잡)에서 확인한다.
- **GitHub Actions**: `ci.yml`·`deploy.yml` 은 로컬에서 `actionlint` 와 정책 시험(`scripts/test_workflows.py`)으로만 확인했고, 실제로 돌려 본 적이 없다.
- **iOS 홈 화면 앱의 서비스 워커 수명주기**: 데스크톱 Chromium 으로만 시험했다.
- 백업: 새 DB 는 앱이 한 번 기동해 마이그레이션을 마친 뒤부터 의미 있는 덤프가 된다(`~/ops/backup.sh` 는 테이블이 0개인 DB 의 데이터 검사를 건너뛴다).
