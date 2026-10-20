#!/usr/bin/env bash
# 서버(mini)의 저장소 체크아웃에서 실행한다: deploy/gateway-interview.conf 의 upstream·location 을 게이트웨이 nginx.conf 에 넣는다. 멱등.
# 게이트웨이는 compose 밖에 있고 nginx.conf 를 파일 하나로 마운트하므로 같은 inode 로 덮어쓴다. 반영 전에 컨테이너 안에서 새 설정을 먼저 검증하고(nginx -t),
# 실패하면 아무것도 바꾸지 않는다. reload 뒤 확인이 실패하면 백업으로 되돌린다. 삽입 로직은 scripts/gateway_insert.py(단위 테스트 있음).
#
#   scripts/apply-gateway-interview.sh --dry-run               # 만들어질 설정을 검증만 하고 diff 를 보여 준다
#   scripts/apply-gateway-interview.sh --apply --report-only   # CSP 를 Report-Only 로 시험 반영(권장: 처음)
#   scripts/apply-gateway-interview.sh --apply --refresh       # 이미 반영된 블록을 조각 파일 내용(CSP 강제 모드 등)으로 다시 쓴다
#
# 환경변수(리허설·점검용, 기본값은 운영): GATEWAY_CONF, GATEWAY_CONTAINER, INTERVIEW_PIECE, CHECK_BASE, CHECK_CURL_ARGS, OTHER_CHECKS("경로=기대코드 …")
set -Eeuo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONF="${GATEWAY_CONF:-$HOME/doro/gateway/nginx.conf}"
PIECE="${INTERVIEW_PIECE:-$HERE/../deploy/gateway-interview.conf}"
CONTAINER="${GATEWAY_CONTAINER:-doro-gateway}"
CHECK_BASE="${CHECK_BASE:-https://localhost}"
CHECK_CURL_ARGS="${CHECK_CURL_ARGS:--sk --resolve localhost:443:127.0.0.1}"
# 다른 서비스가 그대로인지 같이 본다(운영 기본값: 포털 /, 블로그 API)
OTHER_CHECKS="${OTHER_CHECKS:-/=200 /api/v1/posts?page=0&size=1=200}"
APPLY=false; REPORT_ONLY=false; REFRESH=false
for a in "$@"; do
  case "$a" in
    --apply) APPLY=true ;;
    --dry-run) APPLY=false ;;
    --report-only) REPORT_ONLY=true ;;
    --refresh) REFRESH=true ;;
    *) echo "알 수 없는 옵션: $a" >&2; exit 2 ;;
  esac
done
log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }
[ -f "$CONF" ] || die "$CONF 가 없다"
[ -f "$PIECE" ] || die "$PIECE 가 없다"
docker inspect "$CONTAINER" >/dev/null 2>&1 || die "$CONTAINER 컨테이너가 없다"

TS="$(date +%Y%m%d-%H%M%S)"
NEW="$(mktemp)"; trap 'rm -f "$NEW"' EXIT
FLAGS=()
[ "$REPORT_ONLY" = true ] && FLAGS+=(--report-only)
[ "$REFRESH" = true ] && FLAGS+=(--refresh)
STATE="$(python3 "$HERE/gateway_insert.py" "$CONF" "$PIECE" "$NEW" ${FLAGS[@]+"${FLAGS[@]}"})" || die "설정 생성 실패(위 메시지 확인). 아무것도 바꾸지 않았다"
[ "$STATE" = already ] && { log "이미 반영돼 있다(interview_web_upstream 존재). 변경 없음 (다시 쓰려면 --refresh)"; exit 0; }
log "새 설정 생성됨 (CSP: $([ "$REPORT_ONLY" = true ] && echo Report-Only || echo 강제))"

# 컨테이너 안에서 검증: 실제 인증서 경로·upstream 이름 해석까지 같은 환경에서 확인한다
docker cp "$NEW" "$CONTAINER:/tmp/nginx-interview-test.conf"
if docker exec "$CONTAINER" nginx -t -c /tmp/nginx-interview-test.conf; then log "새 설정 검증 통과(nginx -t)"; else docker exec "$CONTAINER" rm -f /tmp/nginx-interview-test.conf; die "새 설정 검증 실패. 아무것도 바꾸지 않았다"; fi
docker exec "$CONTAINER" rm -f /tmp/nginx-interview-test.conf
log "변경 내용(diff, 추가·삭제 줄만):"; diff -u "$CONF" "$NEW" | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' | cut -c1-110 | head -80 || true
[ "$APPLY" = true ] || { log "--dry-run: 여기서 종료 (--apply 로 반영)"; exit 0; }

cp -p "$CONF" "$CONF.bak-interview-$TS"
cat "$NEW" > "$CONF"   # 같은 inode 로 덮어쓴다(컨테이너가 이 파일을 바로 마운트한다)
rollback() {
  cat "$CONF.bak-interview-$TS" > "$CONF"
  docker exec "$CONTAINER" nginx -t && docker exec "$CONTAINER" nginx -s reload && log "복구 완료" || log "ERROR: 복구 후에도 이상. 수동 확인 필요: $CONF.bak-interview-$TS"
}
if docker exec "$CONTAINER" nginx -t && docker exec "$CONTAINER" nginx -s reload; then
  sleep 1
  # shellcheck disable=SC2086
  code() { curl $CHECK_CURL_ARGS -o /dev/null -w '%{http_code}' "$CHECK_BASE$1" || echo 000; }
  web="$(code /interview/)"; api="$(code /interview/api/v1/categories)"; redirect="$(code /interview)"; missing="$(code /interview/api/v1/questions/no-such-question)"
  log "확인: /interview/=$web (200 기대), /interview/api/v1/categories=$api (200 기대), /interview=$redirect (301 기대), 없는 질문=$missing (404 기대)"
  ok=true
  [ "$web" = 200 ] && [ "$api" = 200 ] && [ "$redirect" = 301 ] && [ "$missing" = 404 ] || ok=false
  for check in $OTHER_CHECKS; do
    path="${check%=*}"; want="${check##*=}"
    got="$(code "$path")"
    log "확인: 다른 서비스 $path=$got ($want 기대)"
    [ "$got" = "$want" ] || ok=false
  done
  if [ "$ok" = true ]; then log "완료. 백업: $CONF.bak-interview-$TS"; exit 0; fi
  log "ERROR: 확인 실패. 백업으로 되돌린다"
else
  log "ERROR: 반영 중 nginx 검증/reload 실패. 백업으로 되돌린다"
fi
rollback
exit 1
