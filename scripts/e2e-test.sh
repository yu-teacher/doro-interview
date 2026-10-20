#!/usr/bin/env bash
# 통합 e2e: 격리 Postgres + 빌드한 백엔드 jar(개발용 비공개 노출 스위치 켬) + **실제 웹 nginx(web/nginx.conf, 빌드한 dist 를 바인드 마운트)** +
# 가짜 Doro(IAM·BFF 스텁) + **실제 게이트웨이 설정 조각(deploy/gateway-interview.conf, CSP 강제)을 얹은 nginx** + 실제 Chromium(헤드리스, 내장).
# 웹은 서로 다른 두 빌드(v1·v2: 화면에 빌드 표식)를 만들어 두고 서비스 워커 시험이 마운트한 디렉터리를 바꿔치며 "새 배포"를 흉내 낸다(옛 해시 파일은 지운다).
# 브라우저는 게이트웨이를 거쳐 들어가서 로그인(BFF 쿠키 → auth_request → Authorization)·CSRF·장애 시나리오까지 실제 경로로 확인한다.
# 끝나면 모두 정리한다. 개발·운영 DB 는 건드리지 않는다. 진짜 Doro 와의 연동은 시험하지 않는다(docs/M2-PLAN.md A1).
#
#   scripts/e2e-test.sh                       # 전체
#   scripts/e2e-test.sh -g "API 계약"         # Playwright 인자는 그대로 넘어간다(일부만 실행)
#
# 필요: Docker, Java 25, Node 24, web/ 의 npm 의존성(npm ci)과 Playwright 의 내장 Chromium(없으면 web/ 에서 npx playwright install chromium).
# 다른 실행과 겹치지 않게 E2E_PROJECT, E2E_DB_PORT, E2E_API_PORT, E2E_DORO_PORT, E2E_GW_PORT 를 바꿀 수 있다.
# 게이트웨이(nginx 컨테이너)가 호스트의 서버들에 닿아야 한다: 기본은 127.0.0.1 바인딩(Docker Desktop)이고, 리눅스 러너는 E2E_BIND_HOST=0.0.0.0 으로 준다.
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO_ROOT="$PWD"
PROJECT="${E2E_PROJECT:-interview-e2e}"
DB_PORT="${E2E_DB_PORT:-25440}"
API_PORT="${E2E_API_PORT:-18088}"
DORO_PORT="${E2E_DORO_PORT:-18085}"
GW_PORT="${E2E_GW_PORT:-18490}"
BIND_HOST="${E2E_BIND_HOST:-127.0.0.1}"
GW="$PROJECT-gw"; WEB="$PROJECT-web"; NET="$PROJECT-net"
DORO_PID=""
export CI_PROJECT="$PROJECT" CI_DB_PORT="$DB_PORT" CI_DB_PASSWORD="${CI_DB_PASSWORD:-ci-only-password}"
COMPOSE=(docker compose -p "$PROJECT" -f docker-compose.ci.yml)
LOG_DIR="$(mktemp -d)"
JAR_PID=""

[ -d "${DORO_DIR:-../Doro}/sdk" ] || { echo "Doro 체크아웃(../Doro/sdk)이 없다. 형제 디렉터리에 Doro 레포를 두거나 DORO_DIR 을 지정한다" >&2; exit 2; }

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

cleanup() {
  local rc=$?
  docker rm -f "$GW" "$WEB" >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  [ -n "$DORO_PID" ] && kill "$DORO_PID" 2>/dev/null || true
  [ -n "$JAR_PID" ] && kill "$JAR_PID" 2>/dev/null || true
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  if [ "$rc" -ne 0 ]; then
    log "실패(exit $rc). 서버 로그 끝부분:"
    grep -E -A6 'Application run failed' "$LOG_DIR/api.log" 2>/dev/null | head -n 14 || true; grep -E 'Caused by' "$LOG_DIR/api.log" 2>/dev/null | head -n 4 || true
    tail -n 25 "$LOG_DIR/api.log" 2>/dev/null || true
    tail -n 10 "$LOG_DIR/doro.log" 2>/dev/null || true
    docker logs --tail 10 "$WEB" 2>&1 || true
    docker logs --tail 10 "$GW" 2>&1 || true
  fi
  rm -rf "$LOG_DIR"
  exit "$rc"
}
trap cleanup EXIT

wait_http() { # url name
  for _ in $(seq 1 90); do
    curl -fs "$1" >/dev/null 2>&1 && return 0
    sleep 1
  done
  die "$2 가 뜨지 않았다: $1"
}

log "== Postgres(포트 $DB_PORT) =="
"${COMPOSE[@]}" up -d --wait --wait-timeout 120 || die "Postgres 가 준비되지 않았다"

log "== 가짜 Doro(IAM JWKS·BFF·내부 API 스텁, 포트 $DORO_PORT) =="
FAKE_DORO_HOST="$BIND_HOST" FAKE_DORO_ALLOW_SHUTDOWN=1 node scripts/rehearse/fake-doro.mjs "$DORO_PORT" >"$LOG_DIR/doro.log" 2>&1 &
DORO_PID=$!
wait_http "http://127.0.0.1:$DORO_PORT/health" "가짜 Doro"

log "== 백엔드 jar 빌드·기동(포트 $API_PORT, 비공개 주제 노출 켬: 개발·시험 전용, 토큰은 가짜 Doro 의 JWKS 로 검증) =="
./gradlew bootJar --no-daemon -q
# DORO_IAM_REVOCATION_CHECK=OFF: 세션 폐기 확인은 진짜 IAM 이 필요하다. 탈퇴 동기화는 켜 둔다(2초 주기, 가짜 Doro 의 /dev/deleted 로 시험: web/e2e/quiz.integration.e2e.ts).
DB_PASSWORD="$CI_DB_PASSWORD" DB_PORT="$DB_PORT" SERVER_PORT="$API_PORT" SERVER_ADDRESS="$BIND_HOST" INTERVIEW_CATALOG_EXPOSE_UNPUBLISHED=true \
  IAM_HOST=127.0.0.1 IAM_PORT="$DORO_PORT" DORO_IAM_REVOCATION_CHECK=OFF INTERVIEW_DELETED_SYNC_ENABLED=true INTERVIEW_DELETED_SYNC_INTERVAL=PT2S INTERVIEW_DELETED_SYNC_INITIAL_DELAY=PT1S \
  INTERVIEW_AI_ENABLED=true ANTHROPIC_API_KEY=fake-ai-key-for-e2e INTERVIEW_AI_BASE_URL="http://127.0.0.1:$DORO_PORT" INTERVIEW_AI_PER_USER_PER_DAY=3 DORO_IAM_INTERNAL_TOKEN=fake-internal-token \
  java -jar build/libs/doro-interview-0.0.1-SNAPSHOT.jar >"$LOG_DIR/api.log" 2>&1 &
JAR_PID=$!
wait_http "http://127.0.0.1:$API_PORT/actuator/health" "백엔드"
curl -fs "http://127.0.0.1:$API_PORT/actuator/health" | grep -q '"status":"UP"' || die "백엔드 health 가 UP 이 아니다"

log "== 웹 빌드(두 가지: v1·v2) + 웹 nginx(web/nginx.conf, 바인드 마운트) + 게이트웨이(nginx, 포트 $GW_PORT): 실제 조각 + BFF 공용 정의, CSP 강제 =="
# v1·v2 는 화면의 빌드 표식만 다르다. 첫 번째는 타입 검사까지 하는 정식 빌드 명령(npm run build)이다.
(cd web && VITE_BUILD_MARK=v1 npm run build -- --outDir "$LOG_DIR/dist-v1" --emptyOutDir >/dev/null)
(cd web && VITE_BUILD_MARK=v2 npx vite build --outDir "$LOG_DIR/dist-v2" --emptyOutDir >/dev/null)
mkdir -p "$LOG_DIR/dist-live" && cp -R "$LOG_DIR/dist-v1/." "$LOG_DIR/dist-live/"

docker image inspect nginx:1.27-alpine >/dev/null 2>&1 || docker pull -q nginx:1.27-alpine >/dev/null || die "nginx 이미지를 받지 못했다"
docker rm -f "$GW" "$WEB" >/dev/null 2>&1 || true
docker network rm "$NET" >/dev/null 2>&1 || true
docker network create "$NET" >/dev/null
# 웹 컨테이너: 운영 이미지와 같은 nginx 설정, dist 는 바인드 마운트(시험이 내용을 바꿔치기한다). 이름은 운영과 같은 별칭(doro-interview-web)이다.
docker run -d --name "$WEB" --network "$NET" --network-alias doro-interview-web \
  -v "$PWD/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro" -v "$LOG_DIR/dist-live:/usr/share/nginx/html/interview:ro" nginx:1.27-alpine >/dev/null

HOSTADDR="host.docker.internal"
# 리허설용 기준 설정에서 가짜 메뉴·BFF 자리의 주소만 바꾸고, 실제 삽입 스크립트와 조각 파일을 그대로 쓴다(운영과 같은 경로)
sed -e "s#server 127.0.0.1:1;#server $HOSTADDR:$DORO_PORT;#" -e "s#server doro-menu:80;#server 127.0.0.1:1;#" scripts/rehearse/gateway-base.conf >"$LOG_DIR/base.conf"
python3 scripts/gateway_insert.py "$LOG_DIR/base.conf" deploy/gateway-interview.conf "$LOG_DIR/inserted.conf" >/dev/null || die "게이트웨이 조각 반영 실패"
python3 scripts/gateway_insert.py "$LOG_DIR/base.conf" deploy/gateway-interview.conf "$LOG_DIR/inserted-report.conf" --report-only >/dev/null || die "게이트웨이 조각 반영 실패(Report-Only)"
# 웹은 같은 도커 네트워크의 별칭(doro-interview-web:80)을 그대로 쓰고, 호스트에서 도는 백엔드만 host.docker.internal 로 바꾼다
sed -e "s#doro-interview-api:8088#$HOSTADDR:$API_PORT#" "$LOG_DIR/inserted.conf" >"$LOG_DIR/gw-enforced.conf"
sed -e "s#doro-interview-api:8088#$HOSTADDR:$API_PORT#" "$LOG_DIR/inserted-report.conf" >"$LOG_DIR/gw-report.conf"
cp "$LOG_DIR/gw-enforced.conf" "$LOG_DIR/nginx.conf"   # 컨테이너가 마운트하는 파일(시험이 같은 inode 로 덮어쓰고 reload 한다)
docker run -d --name "$GW" --network "$NET" --add-host "$HOSTADDR:host-gateway" -p "127.0.0.1:$GW_PORT:80" -v "$LOG_DIR/nginx.conf:/etc/nginx/nginx.conf:ro" nginx:1.27-alpine >/dev/null
wait_http "http://127.0.0.1:$GW_PORT/nginx-health" "게이트웨이"
wait_http "http://127.0.0.1:$GW_PORT/interview/" "웹(게이트웨이 경유)"
curl -fs -o /dev/null "http://127.0.0.1:$GW_PORT/interview/api/v1/categories" || die "게이트웨이 경유 API 가 응답하지 않는다"

if [ "${E2E_HOLD:-}" = 1 ]; then
  # 수동 확인용: 시험은 돌리지 않고 스택을 띄운 채로 둔다. 끝내려면 `rm /tmp/e2e-hold`(그러면 평소처럼 정리하고 끝난다).
  touch /tmp/e2e-hold
  log "스택을 유지한다: http://127.0.0.1:$GW_PORT/interview/  (가짜 Doro 로그인, 끝내려면 rm /tmp/e2e-hold)"
  while [ -e /tmp/e2e-hold ]; do sleep 2; done
  exit 0
fi
log "== Playwright(내장 Chromium 헤드리스, 게이트웨이 경유) =="
E2E_PG_CONTAINER="$("${COMPOSE[@]}" ps -q postgres)"; export E2E_PG_CONTAINER
(cd web && E2E_BFF=1 E2E_PWA=1 E2E_DORO_URL="http://127.0.0.1:$DORO_PORT" E2E_BASE_URL="http://127.0.0.1:$GW_PORT" \
  E2E_DIST_LIVE="$LOG_DIR/dist-live" E2E_DIST_V1="$LOG_DIR/dist-v1" E2E_DIST_V2="$LOG_DIR/dist-v2" \
  E2E_GW_CONTAINER="$GW" E2E_GW_CONF="$LOG_DIR/nginx.conf" E2E_GW_CONF_ENFORCED="$LOG_DIR/gw-enforced.conf" E2E_GW_CONF_REPORT="$LOG_DIR/gw-report.conf" \
  E2E_PRECACHE_CHECK="$REPO_ROOT/scripts/check-sw-precache.sh" \
  npx playwright test -c playwright.integration.config.ts "$@")
log "OK"
