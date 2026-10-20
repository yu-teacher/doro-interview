#!/usr/bin/env bash
# CI 와 같은 검증을 로컬에서도 그대로 돌린다: 격리된 Postgres 를 올리고 테스트를 실행한 뒤 내린다. 개발·운영 DB 는 건드리지 않는다.
#
#   scripts/ci-test.sh            # 전체
#   scripts/ci-test.sh backend    # 백엔드(+ 변환기 단위 테스트)
#   scripts/ci-test.sh web        # 프런트만 (스택 불필요): 린트·타입·단위·빌드·번들 예산
#   scripts/ci-test.sh mobile     # 모바일 레이아웃·접근성(실제 Chromium 헤드리스, 서버 불필요)
#   scripts/ci-test.sh e2e        # 통합 e2e(격리 DB + 백엔드 jar + 웹 + 실제 Chromium) — scripts/e2e-test.sh
#   scripts/ci-test.sh rehearse   # 배포 리허설(실제 이미지 빌드·배포 스크립트·게이트웨이·롤백) — scripts/rehearse-deploy.sh (도커 레지스트리 필요)
#   CI_PROJECT=interview-ci-b CI_DB_PORT=25434 scripts/ci-test.sh backend   # 다른 실행과 겹치지 않게
#
# 필요: Docker, Java 25, Node 24, Python 3, Playwright 내장 Chromium(없으면 web/ 에서 npx playwright install chromium).
# 시스템 Chrome 은 쓰지 않는다(PW_CHANNEL=chrome 금지: 테스트마다 Dock 아이콘이 깜빡인다). 포트는 CI_DB_PORT 로 바꿀 수 있다.
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
TARGET="${1:-all}"
export CI_DB_PASSWORD="${CI_DB_PASSWORD:-ci-only-password}"
export CI_DB_PORT="${CI_DB_PORT:-25433}"
STACK_TIMEOUT_SEC="${CI_STACK_TIMEOUT_SEC:-120}"
# 같은 체크아웃에서 CI 스크립트를 동시에 돌릴 때(세션 둘 등)는 CI_PROJECT 와 CI_DB_PORT 를 서로 다르게 준다(안 그러면 한쪽이 상대의 DB 를 내린다).
CI_PROJECT="${CI_PROJECT:-interview-ci}"
COMPOSE=(docker compose -p "$CI_PROJECT" -f docker-compose.ci.yml)

# 백엔드 빌드는 형제 디렉터리 ../Doro 의 SDK 를 쓴다(settings.gradle 의 includeBuild). 없으면 친절하게 알린다.
need_doro() { [ -d "${DORO_DIR:-../Doro}/sdk" ] || { echo "Doro 체크아웃(../Doro/sdk)이 없다. 형제 디렉터리에 Doro 레포를 두거나 DORO_DIR 을 지정한다" >&2; exit 2; }; }

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

run_web() {
  if [ ! -d web ]; then log "web/ 가 아직 없다 — 건너뜀"; return 0; fi
  log "== 프런트: 린트 · 타입 · 테스트 =="
  (cd web && npm ci --no-audit --no-fund && npm run lint && npx tsc -b && npm test && npm run build && npm run check:size)
}

run_mobile() {
  if [ ! -d web ]; then log "web/ 가 아직 없다 — 건너뜀"; return 0; fi
  log "== 모바일 레이아웃·접근성(내장 Chromium 헤드리스) =="
  (cd web && npm ci --no-audit --no-fund && npm run test:mobile)
}

run_e2e() {
  log "== 통합 e2e =="
  scripts/e2e-test.sh
}

run_rehearse() {
  log "== 배포 리허설 =="
  REHEARSE_MODE="${REHEARSE_MODE:-full}" scripts/rehearse-deploy.sh
}

run_backend() {
  need_doro
  log "== 스크립트 단위 테스트(변환기·게이트웨이 삽입) =="
  if ls scripts/test_*.py >/dev/null 2>&1; then python3 -I -m unittest discover -s scripts -p 'test_*.py'; else log "파이썬 테스트 없음 — 건너뜀"; fi
  log "== 배포 스크립트 시나리오 시험(가짜 docker·curl) =="
  scripts/test-deploy-on-server.sh
  log "== 백엔드: 격리 Postgres(포트 $CI_DB_PORT) =="
  "${COMPOSE[@]}" up -d --wait --wait-timeout "$STACK_TIMEOUT_SEC" || die "Postgres 가 준비되지 않았다"
  trap '"${COMPOSE[@]}" down -v --remove-orphans >/dev/null 2>&1 || true' EXIT
  DB_PASSWORD="$CI_DB_PASSWORD" DB_PORT="$CI_DB_PORT" ./gradlew test --no-daemon
}

case "$TARGET" in
  backend) run_backend ;;
  web) run_web ;;
  mobile) run_mobile ;;
  e2e) run_e2e ;;
  rehearse) run_rehearse ;;
  all) run_backend; run_web; run_mobile; run_e2e; run_rehearse ;;
  *) die "알 수 없는 대상: $TARGET (backend|web|mobile|e2e|rehearse|all)" ;;
esac
log "OK"
