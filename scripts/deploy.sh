#!/usr/bin/env bash
# weid.fun 部署脚本
# Usage:
#   WEID_DEPLOY_SERVER=root@host ./scripts/deploy.sh --yes
#   ./scripts/deploy.sh --dry-run  仅打印命令不执行

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

usage() {
  cat <<'EOF'
Usage:
  WEID_DEPLOY_SERVER=root@host ./scripts/deploy.sh --yes
  WEID_DEPLOY_SERVER=root@host ./scripts/deploy.sh --dry-run
EOF
}

run() {
  echo "+ $*"
  if [[ "$DRY_RUN" == "1" ]]; then
    return 0
  fi

  "$@"
}

DRY_RUN="0"
CONFIRMED="0"
for arg in "$@"; do
  case "$arg" in
    --dry-run)
      DRY_RUN="1"
      ;;
    --yes)
      CONFIRMED="1"
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Unknown argument: $arg"
      usage
      exit 1
      ;;
  esac
done

SERVER="${WEID_DEPLOY_SERVER:-}"
REMOTE_PATH="${WEID_REMOTE_PATH:-/var/www/weid.fun/}"
LOCAL_DIST="dist/"

if [[ -z "$SERVER" ]]; then
  if [[ "$DRY_RUN" == "1" ]]; then
    SERVER="<set WEID_DEPLOY_SERVER>"
  else
    echo "❌ Missing WEID_DEPLOY_SERVER"
    echo "   Example: WEID_DEPLOY_SERVER=root@10.14.0.1 ./scripts/deploy.sh --yes"
    exit 1
  fi
fi

if [[ "$DRY_RUN" != "1" && "$CONFIRMED" != "1" ]]; then
  echo "❌ Refusing to run rsync --delete without explicit confirmation"
  echo "   Re-run with: WEID_DEPLOY_SERVER=root@host ./scripts/deploy.sh --yes"
  exit 1
fi

echo "==> Deploy target: $SERVER:$REMOTE_PATH"
echo "==> Building..."
run bun run build

if [[ ! -d "$LOCAL_DIST" && "$DRY_RUN" != "1" ]]; then
  echo "❌ dist/ not found after build"
  exit 1
fi

echo "==> Syncing $LOCAL_DIST → $SERVER:$REMOTE_PATH"
run rsync -av --delete "$LOCAL_DIST" "$SERVER:$REMOTE_PATH"

echo "==> Reloading nginx..."
run ssh "$SERVER" "nginx -t && systemctl reload nginx"

echo "✅ Deploy complete."
echo "   Verify: curl -I https://weid.fun"
