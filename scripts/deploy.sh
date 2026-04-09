#!/usr/bin/env bash
# weid.fun 部署脚本
# Usage:
#   ./scripts/deploy.sh            真实部署
#   ./scripts/deploy.sh --dry-run  仅打印命令不执行

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

DRY_RUN=""
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN="echo [DRY]"
fi

SERVER="root@REDACTED_IP"
REMOTE_PATH="/var/www/weid.fun/"
LOCAL_DIST="dist/"

echo "==> Building..."
$DRY_RUN bun run build

if [[ ! -d "$LOCAL_DIST" && -z "$DRY_RUN" ]]; then
  echo "❌ dist/ not found after build"
  exit 1
fi

echo "==> Syncing $LOCAL_DIST → $SERVER:$REMOTE_PATH"
$DRY_RUN rsync -av --delete "$LOCAL_DIST" "$SERVER:$REMOTE_PATH"

echo "==> Reloading nginx..."
$DRY_RUN ssh "$SERVER" "nginx -t && systemctl reload nginx"

echo "✅ Deploy complete."
echo "   Verify: curl -I https://weid.fun"
