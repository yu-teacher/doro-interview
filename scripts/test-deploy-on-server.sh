#!/usr/bin/env bash
# deploy-on-server.sh 의 흐름(계획만 보기, 사전 점검, 성공, 헬스 실패 롤백, 게이트웨이 확인 실패 롤백, 첫 배포 실패)을
# 가짜 docker·curl(shim)로 시험한다. 도커 이미지를 받거나 빌드하지 않는다(레지스트리에 접근할 수 없는 환경에서도 돈다).
# 실제 이미지·게이트웨이로 돌리는 것은 scripts/rehearse-deploy.sh(REHEARSE_MODE=full).
#
#   scripts/test-deploy-on-server.sh
set -Eeuo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."
REPO="$PWD"
WORK="$(mktemp -d)"; trap 'rm -rf "$WORK"' EXIT
BIN="$WORK/bin"; mkdir -p "$BIN"
LOG="$WORK/calls.log"
PASS=0; FAIL=0

# ---- 가짜 docker: 호출을 기록하고 FAKE_* 환경변수대로 응답한다
cat > "$BIN/docker" <<'SHIM'
#!/usr/bin/env bash
echo "docker $*" >> "$FAKE_LOG"
case "$1" in
  info) exit 0 ;;
  image)   # docker image inspect <name>
    [ "${FAKE_IMAGES_EXIST:-1}" = 1 ] && exit 0 || exit 1 ;;
  tag) exit 0 ;;
  images) printf '%s\n' ${FAKE_TAGS:-latest} ;;
  compose)
    case " $* " in
      *" config "*) exit 0 ;;
      *" build"*) [ "${FAKE_BUILD_FAIL:-0}" = 1 ] && exit 1 || exit 0 ;;
      *) exit 0 ;;
    esac ;;
  inspect) echo "${FAKE_HEALTH:-healthy}" ;;
  logs) echo "(가짜 로그)" ;;
  exec)
    case "$*" in
      *"nginx -t"*) [ "${FAKE_NGINX_T_FAIL:-0}" = 1 ] && exit 1 || exit 0 ;;
      *"nginx -s reload"*) exit 0 ;;
      *"wget -qO- http://localhost:8088/api/v1/categories"*) echo "${FAKE_API_BODY:-{\"success\":true,\"data\":[]\}}" ;;
      *"wget -qO- http://127.0.0.1/interview/"*) echo "${FAKE_WEB_BODY:-<div id=\"root\"></div>}" ;;
      *) exit 0 ;;
    esac ;;
  *) exit 0 ;;
esac
SHIM
# ---- 가짜 curl: 게이트웨이 경유 확인의 응답 코드
cat > "$BIN/curl" <<'SHIM'
#!/usr/bin/env bash
echo "curl $*" >> "$FAKE_LOG"
printf '%s' "${FAKE_CURL_CODE:-200}"
SHIM
# ---- 가짜 sleep: 시험이 오래 걸리지 않게
printf '#!/usr/bin/env bash\nexit 0\n' > "$BIN/sleep"
# ---- 가짜 서비스 워커 점검 스크립트: 호출을 기록하고 FAKE_SW_FAIL=pre|post 이면 그 단계에서 실패한다
cat > "$BIN/sw-check" <<'SHIM'
#!/usr/bin/env bash
echo "swcheck $*" >> "$FAKE_LOG"
[ "${FAKE_SW_FAIL:-}" = "$3" ] && exit 1
exit 0
SHIM
chmod +x "$BIN/docker" "$BIN/curl" "$BIN/sleep" "$BIN/sw-check"

mkdir -p "$WORK/Doro/sdk"   # 가짜 Doro 체크아웃(sdk 디렉터리만 있으면 된다)
ENV_OK="$WORK/ok.env"; printf 'DB_USER=u\nDB_PASSWORD=p\n' > "$ENV_OK"
ENV_TOKEN="$WORK/token.env"; printf 'DB_USER=u\nDB_PASSWORD=p\nDORO_IAM_INTERNAL_TOKEN=super-secret-token-value\n' > "$ENV_TOKEN"
ENV_NOPASS="$WORK/nopass.env"; printf 'DB_USER=u\nDB_PASSWORD=\n' > "$ENV_NOPASS"

# run <시나리오 이름> <env 파일> [VAR=값 ...] -- <deploy 인자...>   → OUT, RC 에 결과를 남긴다
run() {
  local name="$1" envfile="$2"; shift 2
  local vars=()
  while [ "$1" != "--" ]; do vars+=("$1"); shift; done
  shift
  : > "$LOG"
  set +e
  OUT="$(env PATH="$BIN:$PATH" FAKE_LOG="$LOG" INTERVIEW_ENV_FILE="$envfile" INTERVIEW_HEALTH_TIMEOUT=2 DORO_DIR="$WORK/Doro" INTERVIEW_SW_CHECK="$BIN/sw-check" ${vars[@]+"${vars[@]}"} "$REPO/scripts/deploy-on-server.sh" "$@" 2>&1)"
  RC=$?
  set -e
  CALLS="$(cat "$LOG")"
}
ok() { PASS=$((PASS+1)); printf '  ✓ %s\n' "$1"; }
bad() { FAIL=$((FAIL+1)); printf '  ✗ %s\n' "$1"; }
check() { # 설명 조건(0=참)
  if [ "$2" = 0 ]; then ok "$1"; else bad "$1"; fi
}
has() { grep -qF -- "$1" <<<"$2"; echo $?; }       # 0 = 포함
lacks() { grep -qF -- "$1" <<<"$2"; [ $? -ne 0 ]; echo $?; }

echo "== 계획만 보기 / 사전 점검 =="
run dry "$ENV_OK" -- --dry-run
check "dry-run 은 성공한다" "$([ $RC = 0 ]; echo $?)"
check "dry-run 은 빌드·기동·태그를 하지 않는다" "$(lacks 'docker compose' "$(grep -E 'build|up -d' <<<"$CALLS" || true)")"
check "dry-run 은 계획을 보여 준다" "$(has '--dry-run: 여기서 종료' "$OUT")"
check "dry-run 은 이미지 태그를 만들지 않는다" "$(lacks 'docker tag' "$CALLS")"

run noenv "$WORK/none.env" -- --apply
check ".env 가 없으면 실패한다" "$([ $RC != 0 ]; echo $?)"
check ".env 가 없다는 안내" "$(has '먼저 scripts/setup-interview-server.sh' "$OUT")"
check ".env 가 없으면 아무것도 건드리지 않는다" "$(lacks 'docker tag' "$CALLS")"

run nopass "$ENV_NOPASS" -- --apply
check "DB_PASSWORD 가 비어 있으면 실패한다" "$([ $RC != 0 ]; echo $?)"
check "비밀번호 값은 출력하지 않는다(키 이름만)" "$(lacks 'DB_PASSWORD=' "$OUT")"

run badopt "$ENV_OK" -- --nope
check "알 수 없는 옵션은 2 로 끝난다" "$([ $RC = 2 ]; echo $?)"

run nodoro "$ENV_OK" DORO_DIR="$WORK/none" -- --apply
check "Doro 체크아웃이 없으면 실패한다" "$([ $RC != 0 ]; echo $?)"
check "Doro 경로 안내를 한다" "$(has 'DORO_DIR=<Doro 체크아웃 경로>' "$OUT")"
check "Doro 가 없으면 아무것도 건드리지 않는다" "$(lacks 'docker tag' "$CALLS")"

echo "== 탈퇴 동기화 서비스 토큰 점검 =="
run notoken "$ENV_OK" -- --apply --no-gateway
check "토큰이 없으면 경고하지만 배포는 계속한다" "$([ $RC = 0 ] && grep -qF '경고: ' <<<"$OUT" && grep -qF 'DORO_IAM_INTERNAL_TOKEN 이 없다' <<<"$OUT"; echo $?)"
run withtoken "$ENV_TOKEN" -- --apply --no-gateway
check "토큰이 있으면 경고하지 않는다" "$([ $RC = 0 ] && ! grep -qF 'DORO_IAM_INTERNAL_TOKEN 이 없다' <<<"$OUT"; echo $?)"
check "토큰 값은 어디에도 출력하지 않는다" "$(lacks 'super-secret-token-value' "$OUT$CALLS")"

echo "== 롤백 태그 정리(최근 3개만 남긴다) =="
TAGS="latest rollback-20260101-000001 rollback-20260101-000002 rollback-20260101-000003 rollback-20260101-000004 rollback-20260101-000005"
run prune "$ENV_OK" FAKE_TAGS="$TAGS" -- --apply
check "성공하면 0" "$([ $RC = 0 ]; echo $?)"
check "가장 오래된 태그부터 지운다(이미지마다 2개씩, 모두 4번)" "$([ "$(grep -c 'docker image rm' <<<"$CALLS")" = 4 ]; echo $?)"
check "000001·000002 를 지운다" "$([ "$(grep -c 'rollback-20260101-00000[12]' <<<"$(grep 'docker image rm' <<<"$CALLS")")" = 4 ]; echo $?)"
check "최근 3개(000003~000005)와 latest 는 남긴다" "$(lacks 'rollback-20260101-000003' "$(grep 'docker image rm' <<<"$CALLS")")"
run keepall "$ENV_OK" FAKE_TAGS="$TAGS" INTERVIEW_KEEP_ROLLBACKS=10 -- --apply
check "개수 한도 안이면 아무것도 지우지 않는다" "$(lacks 'docker image rm' "$CALLS")"
run prunefail "$ENV_OK" FAKE_TAGS="$TAGS" FAKE_HEALTH=unhealthy -- --apply
check "배포가 실패해 롤백할 때는 태그를 지우지 않는다" "$(lacks 'docker image rm' "$CALLS")"

echo "== 성공(게이트웨이 경유) =="
run good "$ENV_OK" -- --apply
check "성공하면 0" "$([ $RC = 0 ]; echo $?)"
check "롤백 태그를 이미지 이름으로 붙인다(api, web)" "$([ "$(grep -c 'docker tag doro-interview-.*:latest doro-interview-.*:rollback-' <<<"$CALLS")" = 2 ]; echo $?)"
check "태그는 빌드보다 먼저다" "$([ "$(grep -n 'docker tag' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'build' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "빌드 → up 순서" "$([ "$(grep -n ' build' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'up -d' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "게이트웨이 nginx -t 후 reload" "$([ "$(grep -n 'nginx -t' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'nginx -s reload' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "reload 는 컨테이너 기동 뒤다" "$([ "$(grep -n 'up -d' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'nginx -s reload' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "게이트웨이 경유 확인 줄" "$(has '확인: /interview/=200 (200 기대), /interview/api/v1/categories=200' "$OUT")"
check "성공하면 롤백하지 않는다" "$(lacks '롤백한다' "$OUT")"

echo "== 서비스 워커 미리 캐시 점검 =="
check "배포 전 점검은 빌드 뒤 컨테이너 기동 전에 한다" "$([ "$(grep -n ' build' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'swcheck .* pre' <<<"$CALLS" | head -1 | cut -d: -f1)" ] && [ "$(grep -n 'swcheck .* pre' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'up -d' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "배포 후 점검은 게이트웨이 경유 확인 뒤에 한다" "$([ "$(grep -n 'nginx -s reload' <<<"$CALLS" | head -1 | cut -d: -f1)" -lt "$(grep -n 'swcheck .* post' <<<"$CALLS" | head -1 | cut -d: -f1)" ]; echo $?)"
check "새 웹 이미지의 dist 를 /interview/ 접두로 점검한다" "$(has 'swcheck image:doro-interview-web:latest:/usr/share/nginx/html/interview /interview/ pre' "$CALLS")"
run swpre "$ENV_OK" FAKE_SW_FAIL=pre -- --apply
check "배포 전 점검이 실패하면 배포를 실패 처리한다" "$([ $RC = 1 ]; echo $?)"
check "새 컨테이너를 올리지 않고 롤백한다" "$(lacks 'up -d --no-deps interview-api interview-web' "$(grep -v 'no-build' <<<"$CALLS")")"
check "롤백했다고 알린다" "$(has '롤백한다' "$OUT")"
run swpost "$ENV_OK" FAKE_SW_FAIL=post -- --apply
check "배포 후 점검이 실패하면 배포를 실패 처리한다" "$([ $RC = 1 ]; echo $?)"
check "롤백한다" "$(has '롤백한다' "$OUT")"
run swnogw "$ENV_OK" -- --apply --no-gateway
check "게이트웨이 없이(첫 배포)는 점검하지 않는다" "$(lacks 'swcheck' "$CALLS")"

echo "== 헬스 실패 → 롤백 =="
run unhealthy "$ENV_OK" FAKE_HEALTH=unhealthy -- --apply
check "헬스가 안 되면 실패한다" "$([ $RC = 1 ]; echo $?)"
check "롤백한다" "$(has '롤백한다' "$OUT")"
check "롤백 태그를 latest 로 되돌린다" "$([ "$(grep -c 'docker tag doro-interview-.*:rollback-.* doro-interview-.*:latest' <<<"$CALLS")" = 2 ]; echo $?)"
check "롤백은 이전 이미지로 --no-build --force-recreate" "$(has '--no-build --no-deps --force-recreate' "$CALLS")"
check "롤백 뒤 게이트웨이 reload" "$([ "$(grep -c 'nginx -s reload' <<<"$CALLS")" -ge 1 ]; echo $?)"
check "실패 원인으로 api 로그를 보여 준다" "$(has '가짜 로그' "$OUT")"

echo "== 게이트웨이 경유 확인 실패 → 롤백 =="
run gwfail "$ENV_OK" FAKE_CURL_CODE=502 -- --apply
check "경유 확인이 틀리면 실패한다" "$([ $RC = 1 ]; echo $?)"
check "롤백한다" "$(has '롤백한다' "$OUT")"
check "확인을 5번 재시도한 뒤 포기한다" "$([ "$(grep -c '^curl .*/interview/$' <<<"$CALLS")" = 5 ]; echo $?)"
check "롤백 태그를 되살린다" "$(has ':rollback-' "$(grep 'docker tag doro-interview-api:rollback' <<<"$CALLS" || true)")"

echo "== 게이트웨이 reload 실패 → 롤백 =="
run reloadfail "$ENV_OK" FAKE_NGINX_T_FAIL=1 -- --apply
check "nginx -t 가 실패하면 배포를 실패 처리한다" "$([ $RC = 1 ]; echo $?)"
check "롤백한다" "$(has '롤백한다' "$OUT")"

echo "== 빌드 실패 → 롤백 =="
run buildfail "$ENV_OK" FAKE_BUILD_FAIL=1 -- --apply
check "빌드가 실패하면 실패한다" "$([ $RC = 1 ]; echo $?)"
check "컨테이너를 새로 올리지 않는다" "$(lacks 'up -d --no-deps interview-api interview-web' "$(grep -v 'no-build' <<<"$CALLS")")"
check "이전 이미지가 있으니 롤백 태그로 되돌린다" "$(has '롤백한다' "$OUT")"

echo "== 첫 배포(이전 이미지 없음) 실패 =="
run firstfail "$ENV_OK" FAKE_IMAGES_EXIST=0 FAKE_HEALTH=unhealthy -- --apply --no-gateway
check "실패한다" "$([ $RC = 1 ]; echo $?)"
check "롤백 태그를 만들지 않는다" "$(lacks 'docker tag' "$CALLS")"
check "되돌릴 이미지가 없다고 알리고 새 컨테이너를 멈춘다" "$(has '되돌릴 이전 이미지가 없다(첫 배포)' "$OUT")"
check "stop 을 호출한다" "$(has 'stop interview-web interview-api' "$CALLS")"
check "재생성(--force-recreate)은 하지 않는다" "$(lacks '--force-recreate' "$CALLS")"

echo "== --no-gateway =="
run nogw "$ENV_OK" -- --apply --no-gateway
check "성공하면 0" "$([ $RC = 0 ]; echo $?)"
check "게이트웨이를 건드리지 않는다" "$(lacks 'nginx' "$CALLS")"
check "컨테이너 안에서 직접 확인한다" "$(has '직접 확인 통과' "$OUT")"
run nogwbad "$ENV_OK" 'FAKE_API_BODY=<html>502</html>' -- --apply --no-gateway
check "API 응답이 이상하면 실패하고 롤백한다" "$([ $RC = 1 ] && grep -qF '롤백한다' <<<"$OUT"; echo $?)"
run nogwweb "$ENV_OK" 'FAKE_WEB_BODY=nginx default' -- --apply --no-gateway
check "웹이 앱 셸을 안 주면 실패한다" "$([ $RC = 1 ]; echo $?)"

echo
echo "통과 $PASS, 실패 $FAIL"
[ "$FAIL" = 0 ]
