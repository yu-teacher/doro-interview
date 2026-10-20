#!/usr/bin/env bash
# 서버(mini)에서 한 번 실행한다: 도로 면접 배포 전 서버 준비. 여러 번 실행해도 결과가 같다(멱등). 비밀 값은 화면에 출력하지 않는다.
#
#   scripts/setup-interview-server.sh --dry-run    # 바꿀 것만 출력(기본)
#   scripts/setup-interview-server.sh --apply      # 실제 반영
#
# 하는 일
#   1) Postgres 에 service_interview DB 를 만든다(없을 때만).
#   2) ~/doro-interview/.env 를 만든다(없을 때만): DB 접속 계정·비밀번호를 ~/doro/.env 의 POSTGRES_USER/POSTGRES_PASSWORD 에서 복사한다.
#      로그인 토큰은 서비스 밖의 BFF 가 다루므로 이 서비스의 .env 에는 DB 값뿐이다. 탈퇴 동기화용 DORO_IAM_INTERNAL_TOKEN 은 Doro 쪽
#      enable-deleted-sync.sh 가 발급해 넣는다(한 곳에서만 발급). 이 스크립트는 그 값이 **있는지만** 알려 주고 값은 읽어 출력하지 않는다.
# 하지 않는 일: 서비스 전용 DB 계정(interview_app) 만들기(Doro/scripts/split-db-accounts.sh 의 몫, docs/DEPLOY.md 4단계), 게이트웨이 반영, 컨테이너 기동.
# 환경변수(리허설·점검용, 기본값은 운영): POSTGRES_CONTAINER, DORO_ENV, INTERVIEW_DIR
set -Eeuo pipefail

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-doro-postgres}"
DORO_ENV="${DORO_ENV:-$HOME/doro/.env}"
DIR="${INTERVIEW_DIR:-$HOME/doro-interview}"
DB="service_interview"
ENV_FILE="$DIR/.env"
APPLY=false
for a in "$@"; do
  case "$a" in
    --apply) APPLY=true ;;
    --dry-run) APPLY=false ;;
    *) echo "알 수 없는 옵션: $a" >&2; exit 2 ;;
  esac
done
TS="$(date +%Y%m%d-%H%M%S)"
log() { printf '[%s] %s\n' "$(date +%H:%M:%S)" "$*"; }
die() { log "ERROR: $*"; exit 1; }

# 키 이름만 확인하고 값은 읽어도 출력하지 않는다
env_get() { grep -E "^$2=" "$1" 2>/dev/null | head -1 | cut -d= -f2- || true; }
psql_in() { docker exec -i "$POSTGRES_CONTAINER" sh -c "psql -U \"\$POSTGRES_USER\" -d $1 -v ON_ERROR_STOP=1 -tA"; }

docker info >/dev/null 2>&1 || die "docker 를 사용할 수 없다"
docker inspect "$POSTGRES_CONTAINER" >/dev/null 2>&1 || die "$POSTGRES_CONTAINER 컨테이너가 없다"
[ -f "$DORO_ENV" ] || die "$DORO_ENV 가 없다"
[ -n "$(env_get "$DORO_ENV" POSTGRES_USER)" ] && [ -n "$(env_get "$DORO_ENV" POSTGRES_PASSWORD)" ] || die "$DORO_ENV 에 POSTGRES_USER/POSTGRES_PASSWORD 가 없다"

# 값은 보지 않고 있는지(비어 있지 않은지)만 본다
token_state() { if [ -f "$ENV_FILE" ] && grep -Eq '^DORO_IAM_INTERNAL_TOKEN=.+' "$ENV_FILE"; then echo "있음"; else echo "없음"; fi; }

need_db=false; need_env=false
[ "$(echo "SELECT 1 FROM pg_database WHERE datname='$DB'" | psql_in postgres)" = 1 ] || need_db=true
[ -f "$ENV_FILE" ] || need_env=true
log "계획: DB $DB 생성=$need_db, $ENV_FILE 생성=$need_env"
log "DORO_IAM_INTERNAL_TOKEN($ENV_FILE): $(token_state) — 없으면 탈퇴 동기화 호출이 거절된다(경고만, 서비스는 뜬다). Doro/scripts/enable-deleted-sync.sh 가 발급해 넣는다"
if [ "$APPLY" != true ]; then log "--dry-run: 여기서 종료 (--apply 로 반영)"; exit 0; fi

if [ "$need_db" = true ]; then
  echo "CREATE DATABASE $DB" | psql_in postgres >/dev/null
  log "DB $DB 생성"
fi

mkdir -p "$DIR"
if [ "$need_env" = true ]; then
  umask 077
  {
    echo "# 도로 면접 서버 설정 (setup-interview-server.sh 가 $TS 에 생성). 배포가 덮어쓰지 않는다."
    echo "# 서비스 전용 계정으로 바꾸려면 Doro/scripts/split-db-accounts.sh --apply interview (docs/DEPLOY.md)."
    echo "DB_USER=$(env_get "$DORO_ENV" POSTGRES_USER)"
    echo "DB_PASSWORD=$(env_get "$DORO_ENV" POSTGRES_PASSWORD)"
  } > "$ENV_FILE"
  chmod 600 "$ENV_FILE"
  log "$ENV_FILE 생성(값은 출력하지 않는다)"
fi

if [ "$(token_state)" = "없음" ]; then log "알림: DORO_IAM_INTERNAL_TOKEN 이 아직 없다(탈퇴 동기화 전: Doro 레포 enable-deleted-sync.sh 에 interview 를 더한 뒤 실행)"; fi

cat <<MSG

서버 준비 완료. 남은 일(docs/DEPLOY.md):
  1) 저장소를 $DIR 로 가져온다(git clone 또는 rsync)
  2) scripts/deploy-on-server.sh --apply --no-gateway   # 컨테이너 기동·헬스 확인(게이트웨이 반영 전)
  3) scripts/apply-gateway-interview.sh --apply --report-only   # 게이트웨이 반영(CSP Report-Only 로 먼저)
  4) (권장) Doro 레포의 split-db-accounts.sh 에 interview 항목을 추가한 뒤 --apply interview 로 서비스 전용 DB 계정으로 전환
  로그인(BFF)을 켜려면 Doro 쪽 준비가 먼저다: OAuth 클라이언트·BFF 설정·게이트웨이·탈퇴 동기화 토큰(docs/DEPLOY.md 의 로그인 연결 순서)
MSG
