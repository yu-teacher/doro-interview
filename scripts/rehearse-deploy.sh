#!/usr/bin/env bash
# 배포 리허설: 서버에서 실제로 실행할 스크립트와 이미지를 **버릴 환경**에서 그대로 돌려 본다. 서버·운영 DB·실제 게이트웨이를 건드리지 않는다.
#
#   scripts/rehearse-deploy.sh
#
# 격리 도커 네트워크에 Postgres, 가짜 메뉴 서비스, 게이트웨이(nginx, 가짜 기준 설정 + 실제 삽입 스크립트)를 띄우고 다음을 순서대로 확인한다.
#   0) setup-interview-server.sh   — dry-run 은 아무것도 안 바꾸고, apply 는 DB·.env 를 만들고 비밀을 출력하지 않으며, 두 번째는 변화 없음
#   1) deploy-on-server.sh         — 운영 설정(prod 프로파일, 비공개 노출 꺼짐)으로 실제 이미지를 빌드·기동 → 게이트웨이 반영(Report-Only → 강제)
#                                    → "검수 중"(공개 주제 없음) 화면과 숨은 것의 404 를 실제 브라우저로 확인
#   2) 두 번째 배포                 — 롤백 태그·게이트웨이 reload·경유 확인 경로. 개발용 노출을 켜고 통합 e2e 를 게이트웨이(CSP 강제) 경유로 실행
#   3) 롤백                         — 일부러 깨진 콘텐츠로 빌드한 이미지는 기동하지 못하고, 이전 이미지로 자동 복구되는지 확인
# 모드(REHEARSE_MODE)
#   full(기본)   위 0~3 전부. 실제 Dockerfile 로 이미지를 빌드하고 deploy-on-server.sh 를 쓴다. 첫 실행은 이미지 빌드 때문에 몇 분 걸린다.
#                기본 이미지(eclipse-temurin, node, nginx, postgres)를 받을 수 있어야 한다.
#   prebuilt     0, 1·2 의 게이트웨이·라우팅·CSP·실제 브라우저 부분만. 이미지를 빌드하지 않고, 이미 로컬에 있는 이미지(nginx, JDK, postgres)에
#                로컬 빌드 결과물(build/libs 의 jar, web/dist)을 올려서 돌린다. 도커 레지스트리에 접근하지 못하는 환경용이다.
#                Dockerfile 빌드·deploy-on-server.sh·롤백(1 의 배포 부분, 3)은 확인하지 않는다.
# 필요: Docker, Playwright 내장 Chromium(없으면 web/ 에서 npx playwright install chromium), web/ 의 npm 의존성.
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO="$PWD"
NET="interview-rehearse-net"; PG="interview-rehearse-pg"; MENU="interview-rehearse-menu"; GW="interview-rehearse-gw"
PROJECT="interview-rehearse"
MODE="${REHEARSE_MODE:-full}"
JAVA_IMAGE="${REHEARSE_JAVA_IMAGE:-gradle:9.5.1-jdk25}"
[ "$MODE" = full ] || [ "$MODE" = prebuilt ] || { echo "REHEARSE_MODE 는 full 또는 prebuilt" >&2; exit 2; }
GW_PORT="${REHEARSE_GW_PORT:-18480}"
WORK="$(mktemp -d)"
PG_USER="doro_admin"; PG_PASS="rehearse-only-$RANDOM$RANDOM"
export REHEARSE_NETWORK="$NET"

log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "FAIL: $*"; exit 1; }
assert_eq() { [ "$1" = "$2" ] || die "$3 (기대 '$2', 실제 '$1')"; log "  ✓ $3"; }
assert_contains() { case "$1" in *"$2"*) log "  ✓ $3" ;; *) die "$3 ('$2' 가 없다)";; esac; }
assert_not_contains() { case "$1" in *"$2"*) die "$3 ('$2' 가 있다)" ;; *) log "  ✓ $3" ;; esac; }
code() { curl -s -o /dev/null -w '%{http_code}' "$@" || echo 000; }

cleanup() {
  local rc=$?
  docker rm -f "$GW" "$MENU" "$PG" doro-interview-api doro-interview-web >/dev/null 2>&1 || true
  docker compose -p "$PROJECT" -f "$REPO/docker-compose.prod.yml" -f "$REPO/docker-compose.rehearse.yml" --env-file "$WORK/compose.env" down -v --remove-orphans >/dev/null 2>&1 || true
  docker network rm "$NET" >/dev/null 2>&1 || true
  docker rmi -f doro-interview-api:latest doro-interview-web:latest >/dev/null 2>&1 || true
  docker images --format '{{.Repository}}:{{.Tag}}' | grep -E '^doro-interview-(api|web):rollback-' | xargs -r docker rmi -f >/dev/null 2>&1 || true
  rm -rf "$WORK"
  [ "$rc" -eq 0 ] && log "리허설 통과" || log "리허설 실패(exit $rc)"
  exit "$rc"
}
trap cleanup EXIT

# 리허설이 건드릴 이름이 이미 있으면 멈춘다(내 로컬 환경의 다른 것을 지우지 않기 위해)
[ -d "${DORO_DIR:-$REPO/../Doro}/sdk" ] || die "Doro 체크아웃(../Doro/sdk)이 없다. 형제 디렉터리에 두거나 DORO_DIR 을 지정한다"
export DORO_DIR="${DORO_DIR:-$REPO/../Doro}"
for n in "$GW" "$MENU" "$PG" doro-interview-api doro-interview-web; do docker inspect "$n" >/dev/null 2>&1 && die "컨테이너 $n 가 이미 있다. 지우고 다시 실행한다"; done
docker network inspect "$NET" >/dev/null 2>&1 && die "네트워크 $NET 가 이미 있다. 지우고 다시 실행한다"
if [ "$MODE" = full ]; then
  for img in doro-interview-api:latest doro-interview-web:latest; do
    docker image inspect "$img" >/dev/null 2>&1 && die "이미지 $img 가 이미 있다(실제 배포용 이름). 리허설이 지우므로 먼저 태그를 바꾸거나 지운다"
  done
else
  # 프리빌트 모드: 로컬 빌드 결과물을 만들고(없을 때만 jar 는 새로 빌드) 이미 로컬에 있는 이미지를 쓴다
  (cd web && npm run build >/dev/null)
  ./gradlew bootJar --no-daemon -q
  JAR="$(ls "$REPO"/build/libs/doro-interview-*.jar | head -1)"; [ -f "$JAR" ] || die "jar 를 찾지 못했다"
  for img in "$JAVA_IMAGE" nginx:1.27-alpine postgres:16-alpine; do docker image inspect "$img" >/dev/null 2>&1 || die "이미지 $img 가 로컬에 없다(프리빌트 모드는 받지 않는다)"; done
fi

log "== 준비: 네트워크·Postgres·가짜 메뉴·게이트웨이 =="
docker network create "$NET" >/dev/null
docker run -d --name "$PG" --network "$NET" --network-alias postgres \
  -e POSTGRES_USER="$PG_USER" -e POSTGRES_PASSWORD="$PG_PASS" -e POSTGRES_DB=postgres postgres:16-alpine >/dev/null
docker run -d --name "$MENU" --network "$NET" --network-alias doro-menu nginx:1.27-alpine >/dev/null
for _ in $(seq 1 40); do docker exec "$PG" pg_isready -h 127.0.0.1 -U "$PG_USER" >/dev/null 2>&1 && break; sleep 1; done
# 이미지의 임시 init 서버가 아니라 TCP 로 실제 서버가 뜬 것을 확인한다(init 서버가 내려갔다 다시 뜨는 시점을 지나야 한다)
sleep 3
for _ in $(seq 1 40); do docker exec "$PG" psql -h 127.0.0.1 -U "$PG_USER" -d postgres -tAc 'select 1' >/dev/null 2>&1 && break; sleep 1; done

GWCONF="$WORK/nginx.conf"
cp scripts/rehearse/gateway-base.conf "$GWCONF"
cp "$GWCONF" "$WORK/nginx.conf.original"
docker run -d --name "$GW" --network "$NET" -p "127.0.0.1:$GW_PORT:80" -v "$GWCONF:/etc/nginx/nginx.conf" nginx:1.27-alpine >/dev/null
for _ in $(seq 1 30); do [ "$(code "http://127.0.0.1:$GW_PORT/nginx-health")" = 200 ] && break; sleep 1; done
assert_eq "$(code "http://127.0.0.1:$GW_PORT/nginx-health")" 200 "가짜 게이트웨이가 떴다"

# ---------------------------------------------------------------- 0) setup 스크립트
log "== 0) setup-interview-server.sh =="
FAKE_DORO_ENV="$WORK/doro.env"
printf 'POSTGRES_USER=%s\nPOSTGRES_PASSWORD=%s\n' "$PG_USER" "$PG_PASS" > "$FAKE_DORO_ENV"
SETUP_DIR="$WORK/doro-interview"
setup() { POSTGRES_CONTAINER="$PG" DORO_ENV="$FAKE_DORO_ENV" INTERVIEW_DIR="$SETUP_DIR" scripts/setup-interview-server.sh "$@" 2>&1; }
out="$(setup --dry-run)"
assert_contains "$out" "DB service_interview 생성=true" "dry-run 은 DB 생성이 필요하다고 알린다"
assert_eq "$(docker exec "$PG" psql -U "$PG_USER" -d postgres -tAc "select count(*) from pg_database where datname='service_interview'")" 0 "dry-run 은 DB 를 만들지 않는다"
[ ! -e "$SETUP_DIR/.env" ] || die "dry-run 이 .env 를 만들었다"
out="$(setup --apply)"
assert_eq "$(docker exec "$PG" psql -U "$PG_USER" -d postgres -tAc "select count(*) from pg_database where datname='service_interview'")" 1 "apply 가 DB 를 만들었다"
assert_not_contains "$out" "$PG_PASS" "apply 출력에 비밀번호가 없다"
# GNU stat(-c)를 먼저 쓴다: 리눅스에서 `stat -f` 는 파일시스템 정보를 여러 줄 출력하고도 성공으로 끝나서 맥용 형식을 먼저 두면 값이 틀어진다
assert_eq "$(stat -c '%a' "$SETUP_DIR/.env" 2>/dev/null || stat -f '%Lp' "$SETUP_DIR/.env")" 600 ".env 권한은 600 이다"
grep -q "^DB_USER=$PG_USER$" "$SETUP_DIR/.env" || die ".env 에 DB_USER 가 없다"
grep -q "^DB_PASSWORD=$PG_PASS$" "$SETUP_DIR/.env" || die ".env 에 DB_PASSWORD 가 없다"
before="$(shasum "$SETUP_DIR/.env" | cut -d' ' -f1)"
out="$(setup --apply)"
assert_contains "$out" "DB service_interview 생성=false" "두 번째 apply 는 DB 를 다시 만들지 않는다"
assert_eq "$(shasum "$SETUP_DIR/.env" | cut -d' ' -f1)" "$before" "두 번째 apply 는 .env 를 바꾸지 않는다"
cp "$SETUP_DIR/.env" "$WORK/compose.env"

# 프리빌트 모드에서 앱 컨테이너를 띄운다(이름·네트워크·별칭은 운영 compose 와 같다)
run_api() { # 프로파일 노출여부 [콘텐츠: unpublished(검수 전 모형)|기본은 jar 안의 실제 콘텐츠]
  docker rm -f doro-interview-api >/dev/null 2>&1 || true
  local content=(); [ "${3:-}" = unpublished ] && content=(-e INTERVIEW_CONTENT_LOCATION=file:/rehearse-content/ -v "$REPO/scripts/rehearse/content-unpublished:/rehearse-content:ro")
  docker run -d --name doro-interview-api --network "$NET" ${content[@]+"${content[@]}"} \
    -e SPRING_PROFILES_ACTIVE="$1" -e INTERVIEW_CATALOG_EXPOSE_UNPUBLISHED="$2" \
    -e DB_HOST=postgres -e DB_PORT=5432 -e DB_NAME=service_interview -e DB_USER="$PG_USER" -e DB_PASSWORD="$PG_PASS" \
    -v "$JAR:/app/app.jar:ro" "$JAVA_IMAGE" java -jar /app/app.jar >/dev/null
  for _ in $(seq 1 90); do
    docker exec doro-interview-api curl -fs http://localhost:8088/actuator/health 2>/dev/null | grep -q '"status":"UP"' && return 0
    sleep 1
  done
  docker logs --tail 20 doro-interview-api 2>&1 | sed 's/^/    /'; die "api 가 뜨지 않았다"
}
run_web() {
  docker rm -f doro-interview-web >/dev/null 2>&1 || true
  docker run -d --name doro-interview-web --network "$NET" \
    -v "$REPO/web/nginx.conf:/etc/nginx/conf.d/default.conf:ro" -v "$REPO/web/dist:/usr/share/nginx/html/interview:ro" nginx:1.27-alpine >/dev/null
  sleep 2
}

deploy() { INTERVIEW_PROJECT="$PROJECT" INTERVIEW_COMPOSE_FILES="docker-compose.prod.yml docker-compose.rehearse.yml" INTERVIEW_ENV_FILE="$WORK/compose.env" \
  GATEWAY_CONTAINER="$GW" CHECK_BASE="http://127.0.0.1:$GW_PORT" CHECK_CURL_ARGS="-s" INTERVIEW_HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-300}" "${DEPLOY_SCRIPT:-scripts/deploy-on-server.sh}" "$@" 2>&1; }
apply_gw() { GATEWAY_CONF="$GWCONF" GATEWAY_CONTAINER="$GW" CHECK_BASE="http://127.0.0.1:$GW_PORT" CHECK_CURL_ARGS="-s" OTHER_CHECKS="/=200 /menu/=404" scripts/apply-gateway-interview.sh "$@" 2>&1; }
hdr() { curl -sI "http://127.0.0.1:$GW_PORT$1" | tr -d '\r'; }

# ---------------------------------------------------------------- 1) 운영 설정으로 첫 배포
log "== 1) 첫 배포(운영 설정: prod 프로파일, 비공개 노출 꺼짐, 콘텐츠는 검수 전 모형) =="
# 실제 콘텐츠는 이미 공개돼 있어서 "공개된 것이 없을 때" 를 보려면 검수 전 모형(scripts/rehearse/content-unpublished)을 준다
export REHEARSE_CONTENT_LOCATION=file:/rehearse-content/
if [ "$MODE" = full ]; then
  out="$(deploy --dry-run)"
  assert_contains "$out" "--dry-run: 여기서 종료" "deploy dry-run 은 계획만 보여 준다"
  [ -z "$(docker ps -q --filter name=doro-interview)" ] || die "dry-run 이 컨테이너를 만들었다"
  log "  (이미지 빌드: 처음에는 몇 분 걸린다)"
  out="$(deploy --apply --no-gateway)" || { echo "$out" | tail -30; die "첫 배포 실패"; }
  echo "$out" | tail -5 | sed 's/^/    /'
  assert_contains "$out" "직접 확인 통과" "게이트웨이 반영 전 직접 확인 통과"
  assert_eq "$(docker inspect --format '{{.State.Health.Status}}' doro-interview-api)" healthy "api healthy"
  assert_eq "$(docker inspect --format '{{.State.Health.Status}}' doro-interview-web)" healthy "web healthy"
  assert_eq "$(docker inspect --format '{{.Config.Env}}' doro-interview-api | grep -c 'SPRING_PROFILES_ACTIVE=prod')" 1 "api 는 prod 프로파일이다"
  user="$(docker exec doro-interview-api sh -c 'id -un')"; assert_eq "$user" doro "api 는 비루트 사용자(doro)로 돈다"
  assert_eq "$(docker exec doro-interview-api wget -qO- http://localhost:8088/api/v1/categories | grep -c '"data":\[\]')" 1 "공개 주제가 없으면 빈 목록이다"


else
  log "  (프리빌트 모드: Dockerfile 빌드·deploy-on-server.sh 는 확인하지 않는다)"
  run_api prod false unpublished; run_web
  assert_eq "$(docker exec doro-interview-api curl -fs http://localhost:8088/api/v1/categories | grep -c '"data":\[\]')" 1 "공개 주제가 없으면 빈 목록이다(prod 프로파일)"
fi

log "-- 게이트웨이 반영(Report-Only → 변화 없음 확인 → 강제)"
before="$(shasum "$GWCONF" | cut -d' ' -f1)"
out="$(apply_gw --dry-run)"; assert_contains "$out" "--dry-run: 여기서 종료" "gateway dry-run"
assert_eq "$(shasum "$GWCONF" | cut -d' ' -f1)" "$before" "dry-run 은 게이트웨이 설정을 바꾸지 않는다"
assert_not_contains "$(hdr /interview/)" "HTTP/1.1 200" "반영 전에는 /interview/ 가 열리지 않는다"
out="$(apply_gw --apply --report-only)" || { echo "$out" | tail -20; die "게이트웨이 반영 실패"; }
assert_contains "$out" "완료." "Report-Only 로 반영했다"
h="$(hdr /interview/)"
assert_contains "$h" "Content-Security-Policy-Report-Only:" "Report-Only 헤더가 나간다"
assert_not_contains "$(echo "$h" | grep -i '^content-security-policy:' || true)" "script-src" "강제 CSP 는 아직 없다"
before="$(shasum "$GWCONF" | cut -d' ' -f1)"
out="$(apply_gw --apply)"; assert_contains "$out" "이미 반영돼 있다" "두 번째 apply 는 변화 없음"
assert_eq "$(shasum "$GWCONF" | cut -d' ' -f1)" "$before" "두 번째 apply 는 설정을 바꾸지 않는다"
out="$(apply_gw --apply --refresh)" || { echo "$out" | tail -20; die "refresh 실패"; }
h="$(hdr /interview/)"
assert_contains "$h" "Content-Security-Policy: default-src 'self'; script-src 'self'" "refresh 뒤 CSP 가 강제 모드다"
assert_not_contains "$h" "Report-Only" "Report-Only 가 사라졌다"
assert_contains "$h" "Strict-Transport-Security" "공통 보안 헤더를 다시 적었다"
assert_eq "$(ls "$WORK"/nginx.conf.bak-interview-* 2>/dev/null | wc -l | tr -d ' ')" 2 "반영마다 백업이 남는다(Report-Only, refresh)"

log "-- 게이트웨이 라우팅"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview")" 301 "/interview 는 /interview/ 로 301"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/")" 200 "웹 200"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/api/v1/categories")" 200 "API 200"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/t/transaction")" 200 "SPA 경로는 앱 셸(200)을 준다"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/assets/nope.js")" 404 "없는 해시 자산은 404(앱 셸로 폴백하지 않는다)"
assert_eq "$(code -X POST "http://127.0.0.1:$GW_PORT/interview/api/v1/categories")" 403 "게이트웨이는 API 의 쓰기 메서드를 막는다"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/api/v1/questions/no-such")" 404 "없는 질문은 404"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/")" 200 "다른 서비스(포털 /)는 그대로"
assert_eq "$(code "http://127.0.0.1:$GW_PORT/menu/")" 404 "다른 서비스(/menu/)는 그대로(가짜 메뉴 응답)"
# ETag 는 본문 해시로 만들어지므로 HEAD 가 아니라 GET 으로 헤더를 받는다
etag="$(curl -s -o /dev/null -D - "http://127.0.0.1:$GW_PORT/interview/api/v1/categories" | tr -d '\r' | awk -F': ' 'tolower($1)=="etag"{print $2}')"
[ -n "$etag" ] || die "게이트웨이를 거쳐도 ETag 가 와야 한다"
assert_eq "$(code -H "If-None-Match: $etag" "http://127.0.0.1:$GW_PORT/interview/api/v1/categories")" 304 "게이트웨이 경유 ETag 재검증 304"
assert_contains "$(hdr /interview/assets/ | head -1)" "404" "자산 디렉터리 자체는 목록을 보여 주지 않는다"

log "-- 실제 브라우저: 공개 주제가 없을 때의 화면(게이트웨이 경유, CSP 강제)"
(cd web && E2E_PHASE=empty E2E_BASE_URL="http://127.0.0.1:$GW_PORT" npx playwright test -c playwright.integration.config.ts --project=desktop 2>&1 | tail -8) || die "empty 단계 e2e 실패"

# ---------------------------------------------------------------- 2) 두 번째 배포 + 통합 e2e
log "== 2) 두 번째 배포 + 통합 e2e =="
export REHEARSE_PROFILE=rehearse REHEARSE_EXPOSE=true REHEARSE_CONTENT_LOCATION=classpath:content/   # 검수 전이라 공개 주제가 없어서, 화면을 시험하려면 개발용 노출이 필요하다
if [ "$MODE" = full ]; then
  out="$(deploy --apply)" || { echo "$out" | tail -30; die "두 번째 배포 실패"; }
  echo "$out" | tail -6 | sed 's/^/    /'
  assert_contains "$out" "롤백 태그: api=true web=true" "이전 이미지에 롤백 태그가 붙었다"
  assert_contains "$out" "확인: /interview/=200" "게이트웨이 경유 확인 통과"
else
  run_api rehearse true
  # 컨테이너가 새로 만들어지면 nginx 가 옛 IP 를 쥐고 있다: reload 전에는 502 일 수 있고, reload 뒤에는 정상이어야 한다
  docker exec "$GW" nginx -s reload; sleep 1
  assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/api/v1/categories")" 200 "api 컨테이너를 다시 만든 뒤 reload 하면 게이트웨이 경유가 정상이다"
fi
(cd web && E2E_BASE_URL="http://127.0.0.1:$GW_PORT" npx playwright test -c playwright.integration.config.ts 2>&1 | tail -12) || die "통합 e2e 실패"

if [ "$MODE" = full ]; then
  # ---------------------------------------------------------------- 3) 롤백
  log "== 3) 롤백: 일부러 깨진 콘텐츠로 만든 이미지는 기동하지 못하고 이전 이미지로 복구된다 =="
  BROKEN="$WORK/broken-repo"
  mkdir -p "$BROKEN"
  tar -C "$REPO" --exclude=./web/node_modules --exclude=./build --exclude=./.git --exclude=./web/dist --exclude=./web/test-results -cf - . | tar -C "$BROKEN" -xf -
  mkdir -p "$BROKEN/content/spring/transaction"
  printf '%s\n' '---' 'slug: [깨진' '---' '본문' > "$BROKEN/content/spring/transaction/zz-broken.md"
  good_api="$(docker image inspect doro-interview-api:latest --format '{{.Id}}')"
  HEALTH_TIMEOUT=45 DEPLOY_SCRIPT="$BROKEN/scripts/deploy-on-server.sh" out="$(deploy --apply)" && die "깨진 배포가 성공으로 끝났다"
  echo "$out" | tail -8 | sed 's/^/    /'
  assert_contains "$out" "롤백한다" "실패를 감지하고 롤백했다"
  assert_contains "$out" "이전 이미지로 복구, healthy" "이전 이미지로 복구되어 healthy"
  assert_eq "$(docker image inspect doro-interview-api:latest --format '{{.Id}}')" "$good_api" "api 이미지가 이전 것으로 되돌아왔다"
  assert_eq "$(code "http://127.0.0.1:$GW_PORT/interview/api/v1/categories")" 200 "롤백 뒤에도 게이트웨이 경유로 서비스된다"
else
  log "== 3) 롤백: 프리빌트 모드에서는 건너뛴다(REHEARSE_MODE=full 로 확인) =="
fi
