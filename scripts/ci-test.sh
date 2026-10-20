#!/usr/bin/env bash
# CI 와 같은 검증을 로컬에서도 그대로 돌린다: 격리된 Postgres 를 올리고 테스트를 실행한 뒤 내린다. 개발·운영 DB 는 건드리지 않는다.
#
#   scripts/ci-test.sh            # 전체
#   scripts/ci-test.sh backend    # 백엔드(+ 변환기 단위 테스트)
#   scripts/ci-test.sh web        # 프런트만 (스택 불필요)
#   CI_PROJECT=interview-ci-b CI_DB_PORT=25434 scripts/ci-test.sh backend   # 다른 실행과 겹치지 않게
#
# 필요: Docker, Java 25, Node 24, Python 3. 포트는 CI_DB_PORT 로 바꿀 수 있다.
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
TARGET="${1:-all}"
export CI_DB_PASSWORD="${CI_DB_PASSWORD:-ci-only-password}"
export CI_DB_PORT="${CI_DB_PORT:-25433}"
STACK_TIMEOUT_SEC="${CI_STACK_TIMEOUT_SEC:-120}"
# 같은 체크아웃에서 CI 스크립트를 동시에 돌릴 때(세션 둘 등)는 CI_PROJECT 와 CI_DB_PORT 를 서로 다르게 준다(안 그러면 한쪽이 상대의 DB 를 내린다).
CI_PROJECT="${CI_PROJECT:-interview-ci}"
COMPOSE=(docker compose -p "$CI_PROJECT" -f docker-compose.ci.yml)

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

run_web() {
  if [ ! -d web ]; then log "web/ 가 아직 없다 — 건너뜀"; return 0; fi
  log "== 프런트: 린트 · 타입 · 테스트 =="
  (cd web && npm ci --no-audit --no-fund && npm run lint && npx tsc -b && npm test && npm run build && npm run check:size)
}

run_backend() {
  log "== 변환기 단위 테스트 =="
  if ls scripts/test_*.py >/dev/null 2>&1; then python3 -I -m unittest discover -s scripts -p 'test_*.py'; else log "변환기 테스트 없음 — 건너뜀"; fi
  log "== 백엔드: 격리 Postgres(포트 $CI_DB_PORT) =="
  "${COMPOSE[@]}" up -d --wait --wait-timeout "$STACK_TIMEOUT_SEC" || die "Postgres 가 준비되지 않았다"
  trap '"${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true' EXIT
  DB_PASSWORD="$CI_DB_PASSWORD" DB_PORT="$CI_DB_PORT" ./gradlew test --no-daemon
}

case "$TARGET" in
  backend) run_backend ;;
  web) run_web ;;
  all) run_backend; run_web ;;
  *) die "알 수 없는 대상: $TARGET (backend|web|all)" ;;
esac
log "OK"
