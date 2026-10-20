# 배포 (M1: 읽기 전용 선배포)

Doro 서브 서비스 표준 절차(Doro `AGENTS.md` 5장)를 따르되, M1 은 **읽기 전용**이라 로그인(BFF)·Guard·IAM 이 없다. 그래서 필요한 것은 컨테이너 둘(API, 웹)과 게이트웨이 location 하나다. 로그인과 서비스 워커는 M2 에서 같이 붙인다.

| 구성 | 이름 | 포트(서버 `127.0.0.1` 바인딩) |
|---|---|---|
| API | `doro-interview-api` | 8088 |
| 웹(SPA) | `doro-interview-web` | 3007 |
| DB | `service_interview` | (Postgres 컨테이너 안) |
| 게이트웨이 경로 | `/interview/`, `/interview/api/` | — |

이미지는 **이미지 안에서 빌드**한다(멀티스테이지). 서버에 Java 25·Node 가 없어도 된다.

## 0. 먼저 리허설 (로컬, 서버를 건드리지 않는다)

```bash
scripts/rehearse-deploy.sh
```

서버에서 실제로 돌릴 스크립트와 이미지를 **버릴 환경**(격리 도커 네트워크, 가짜 게이트웨이)에서 그대로 실행해 본다. 확인하는 것:

1. `setup-interview-server.sh`: dry-run 은 아무것도 안 바꾼다. apply 는 DB 와 `.env`(권한 600)를 만들고 **비밀번호를 출력하지 않는다**. 두 번째 apply 는 변화가 없다.
2. 첫 배포(운영 설정: `prod` 프로파일, 비공개 노출 꺼짐): 이미지 빌드·기동, 비루트 사용자, healthy.
3. 게이트웨이 반영: dry-run 무변화 → `--report-only` → 두 번째 실행 무변화(멱등) → `--refresh` 로 CSP 강제. 다른 서비스는 그대로. 백업이 남는다.
4. 라우팅: `/interview` 301, SPA 경로는 앱 셸, 없는 해시 자산 404, API 쓰기 메서드 차단(403), ETag 304, 없는 질문 404.
5. 실제 브라우저(CSP 강제): 공개 주제가 없을 때 "검수 중" 안내와 숨은 것의 404, 이어서 통합 e2e 전체.
6. 두 번째 배포: 롤백 태그, 게이트웨이 reload, 경유 확인.
7. 롤백: 일부러 깨진 콘텐츠로 만든 이미지가 기동하지 못하면 이전 이미지로 자동 복구된다.

## 1. 서버 준비 (★ 사용자, 최초 1회)

```bash
# 저장소를 서버의 ~/doro-interview 로 가져온다(git clone 또는 rsync). 이후 명령은 그 디렉터리에서 실행한다.
scripts/setup-interview-server.sh --dry-run      # 바꿀 것만 출력
scripts/setup-interview-server.sh --apply        # DB service_interview 와 ~/doro-interview/.env 생성
```

`.env` 에는 DB 접속 계정·비밀번호만 있다(`~/doro/.env` 의 슈퍼유저 값을 복사). 값은 화면에 출력되지 않는다. 서비스 전용 계정으로 바꾸는 것은 4단계다.

## 2. 컨테이너 기동 (게이트웨이 반영 전)

```bash
scripts/deploy-on-server.sh --dry-run                # 계획과 compose 설정 검증
scripts/deploy-on-server.sh --apply --no-gateway     # 빌드 → 기동 → healthy → 컨테이너 안에서 직접 확인
```

첫 빌드는 gradle·npm 의존성을 받느라 몇 분 걸린다. 실패하면 이전 이미지로 되돌리고(첫 배포면 새 컨테이너를 멈춘다) 비정상 종료한다.

## 3. 게이트웨이 반영 (★ 사용자)

```bash
scripts/apply-gateway-interview.sh --dry-run                # 새 설정을 컨테이너 안에서 nginx -t 로 검증하고 diff 만 본다
scripts/apply-gateway-interview.sh --apply --report-only    # CSP 를 Report-Only 로 시험 반영(권장: 처음)
```

반영 전 백업(`nginx.conf.bak-interview-<시각>`), 같은 inode 로 덮어쓰기, `nginx -t` + reload, 공개 주소 확인(`/interview/` 200, API 200, `/interview` 301, 없는 질문 404, 다른 서비스 그대로)을 하고 하나라도 틀리면 백업으로 되돌린다.

Report-Only 로 한동안 보고 `/csp-report` 에 위반이 없으면 강제 모드로 바꾼다:

```bash
scripts/apply-gateway-interview.sh --apply --refresh        # 조각 파일 내용(CSP 강제)으로 다시 쓴다
```

게이트웨이는 CI 로 배포되지 않는다. 반영 뒤에는 **Doro 레포의 `gateway/nginx.conf` 참고 사본**도 서버와 같게 맞추고 `scripts/gateway-routing/expect-current.txt` 에 다음 줄을 더한 뒤 `scripts/test-gateway-routing.sh` 로 확인한다(Doro 레포 PR, 푸시는 사용자):

```
GET /interview                          301 redirect:/interview/
GET /interview/                         200 doro-interview-web  /interview/
GET /interview/t/transaction            200 doro-interview-web  /interview/t/transaction
GET /interview/api/v1/categories        200 doro-interview-api  /api/v1/categories
```

## 4. 서비스 전용 DB 계정 (★ 사용자, 권장)

서버의 모든 서비스는 슈퍼유저가 아니라 **전용 DB 소유 계정**을 쓴다(2026-10-19 계정 분리). Doro 레포의 `scripts/split-db-accounts.sh` 의 `cfg()` 와 서비스 목록에 다음을 더한 뒤(Doro 레포 PR) 서버에서 실행한다:

```
interview) DB=service_interview; ROLE=interview_app; KIND=sibling; DIR="$HOME/doro-interview"; SERVICE=interview-api; CONTAINER=doro-interview-api; USERVAR=DB_USER; PASSVAR=DB_PASSWORD ;;
```

```bash
ssh mini 'bash -s -- --check'              < scripts/split-db-accounts.sh   # 읽기 전용 확인
ssh mini 'bash -s -- --apply interview'    < scripts/split-db-accounts.sh   # .env 를 전용 계정으로 바꾸고 컨테이너를 다시 만든다
```

이 스크립트는 healthy 가 되지 않으면 `.env` 를 되돌린다.

## 5. 공개 (검수 뒤)

배포만으로는 **아무것도 보이지 않는다**: 시드 콘텐츠는 전부 `DRAFT` 이고 주제는 비공개(`published: false`)라서 홈에 "검수 중인 주제입니다" 안내가 나온다. 검수가 끝난 주제의 `_topic.yml` 에서 `published: true`(그 주제의 모든 질문이 `REVIEWED` 여야 로더가 받아 준다)로 바꿔 커밋하고 다시 배포하면 그 주제만 열린다([REVIEW-TRACK.md](REVIEW-TRACK.md)).

운영(`prod` 프로파일)에서는 개발용 노출 스위치(`interview.catalog.expose-unpublished`)를 켜면 **기동이 거부**된다. 켜려고 하지 않는다.

## 이후 배포

```bash
scripts/deploy-on-server.sh --apply
```

현재 이미지에 롤백 태그를 붙이고(이미지 **이름으로**: 빌드 뒤에는 옛 이미지 ID 를 찾을 수 없다) → 빌드 → 재생성 → healthy 대기 → 게이트웨이 `nginx -t` + reload(컨테이너가 새로 만들어지면 nginx 가 옛 IP 를 쥐고 502 를 낼 수 있다) → 게이트웨이 경유 확인(재생성 직후 잠깐 연결이 거부될 수 있어 짧게 재시도). 어느 단계든 실패하면 롤백 태그를 되살려 다시 만들고 reload 한다. 서버의 compose 파일은 배포가 덮어쓰지 않는 기준 사본이다(저장소의 `docker-compose.prod.yml` 은 참고본).

수동 롤백: `docker tag doro-interview-api:rollback-<시각> doro-interview-api:latest` (웹도 같게) 후
`docker compose -p interview -f docker-compose.prod.yml up -d --no-build --no-deps --force-recreate interview-api interview-web`, 이어서 `docker exec doro-gateway nginx -s reload`.

## 확인 목록 (공개 주소로 실제 호출)

```bash
curl -sI https://<공개 주소>/interview/ | head -1                              # 200
curl -s  https://<공개 주소>/interview/api/v1/categories                       # {"success":true,"data":[...]}
curl -sI https://<공개 주소>/interview | head -1                                # 301
curl -s -o /dev/null -w '%{http_code}\n' -X POST https://<공개 주소>/interview/api/v1/categories   # 403(게이트웨이가 쓰기 차단)
curl -sI https://<공개 주소>/interview/ | grep -i content-security-policy       # 강제 모드면 Content-Security-Policy, 처음엔 …-Report-Only
```

## 아직 없는 것 (M2 이후)

- 로그인: BFF 클라이언트 등록·게이트웨이 `auth_request`·Guard 스키마(Doro `docs/BFF.md` 4단계).
- 자동 배포(CD): 셀프호스티드 러너와 `deploy.yml`. 지금은 위 스크립트를 서버에서 직접 실행한다.
- 서비스 워커(PWA): 게이트웨이를 거친 실제 브라우저 검증과 함께 도입한다(precache 목록의 모든 URL 이 리다이렉트 없이 200 이어야 한다).
- 백업: 새 DB 는 앱이 한 번 기동해 마이그레이션을 마친 뒤부터 의미 있는 덤프가 된다(`~/ops/backup.sh` 는 테이블이 0개인 DB 의 데이터 검사를 건너뛴다).
