#!/usr/bin/env bash
# 통합 e2e: 격리 Postgres + 빌드한 백엔드 jar(개발용 비공개 노출 스위치 켬) + 빌드한 웹(vite preview) + 실제 Chromium(헤드리스, 내장).
# 끝나면 모두 정리한다. 개발·운영 DB 는 건드리지 않는다.
#
#   scripts/e2e-test.sh                       # 전체
#   scripts/e2e-test.sh -g "API 계약"         # Playwright 인자는 그대로 넘어간다(일부만 실행)
#
# 필요: Docker, Java 25, Node 24, web/ 의 npm 의존성(npm ci)과 Playwright 의 내장 Chromium(없으면 web/ 에서 npx playwright install chromium).
# 다른 실행과 겹치지 않게 E2E_PROJECT, E2E_DB_PORT, E2E_API_PORT, E2E_WEB_PORT 를 바꿀 수 있다.
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
PROJECT="${E2E_PROJECT:-interview-e2e}"
DB_PORT="${E2E_DB_PORT:-25440}"
API_PORT="${E2E_API_PORT:-18088}"
WEB_PORT="${E2E_WEB_PORT:-4175}"
export CI_PROJECT="$PROJECT" CI_DB_PORT="$DB_PORT" CI_DB_PASSWORD="${CI_DB_PASSWORD:-ci-only-password}"
COMPOSE=(docker compose -p "$PROJECT" -f docker-compose.ci.yml)
LOG_DIR="$(mktemp -d)"
JAR_PID=""; WEB_PID=""

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

cleanup() {
  local rc=$?
  [ -n "$WEB_PID" ] && kill "$WEB_PID" 2>/dev/null || true
  [ -n "$JAR_PID" ] && kill "$JAR_PID" 2>/dev/null || true
  "${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true
  if [ "$rc" -ne 0 ]; then
    log "실패(exit $rc). 서버 로그 끝부분:"
    tail -n 25 "$LOG_DIR/api.log" 2>/dev/null || true
    tail -n 10 "$LOG_DIR/web.log" 2>/dev/null || true
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

log "== 백엔드 jar 빌드·기동(포트 $API_PORT, 비공개 주제 노출 켬: 개발·시험 전용) =="
./gradlew bootJar --no-daemon -q
DB_PASSWORD="$CI_DB_PASSWORD" DB_PORT="$DB_PORT" SERVER_PORT="$API_PORT" INTERVIEW_CATALOG_EXPOSE_UNPUBLISHED=true \
  java -jar build/libs/doro-interview-0.0.1-SNAPSHOT.jar >"$LOG_DIR/api.log" 2>&1 &
JAR_PID=$!
wait_http "http://127.0.0.1:$API_PORT/actuator/health" "백엔드"
curl -fs "http://127.0.0.1:$API_PORT/actuator/health" | grep -q '"status":"UP"' || die "백엔드 health 가 UP 이 아니다"

log "== 웹 빌드·미리보기(포트 $WEB_PORT, /interview/api → 백엔드) =="
(cd web && npm run build >/dev/null)
(cd web && VITE_DEV_API_TARGET="http://127.0.0.1:$API_PORT" npx vite preview --port "$WEB_PORT" --strictPort --host 127.0.0.1 >"$LOG_DIR/web.log" 2>&1) &
WEB_PID=$!
wait_http "http://127.0.0.1:$WEB_PORT/interview/" "웹"

log "== Playwright(내장 Chromium 헤드리스) =="
(cd web && E2E_BASE_URL="http://127.0.0.1:$WEB_PORT" npx playwright test -c playwright.integration.config.ts "$@")
log "OK"
