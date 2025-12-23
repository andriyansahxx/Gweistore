#!/usr/bin/env bash
set -euo pipefail

SERVICE_TARGET=${SERVICE_TARGET:-api}

case "$SERVICE_TARGET" in
  api)
    echo "[pterodactyl] Building API..."
    npm run build --workspace api
    echo "[pterodactyl] Starting API on PORT=${PORT:-4000}"
    node apps/api/dist/main.js
    ;;
  bot)
    echo "[pterodactyl] Building bot-runner..."
    npm run build --workspace bot-runner
    echo "[pterodactyl] Starting bot-runner"
    node apps/bot-runner/dist/index.js
    ;;
  admin)
    echo "[pterodactyl] Building admin..."
    npm run build --workspace admin
    echo "[pterodactyl] Starting admin (Next.js)"
    npm run start --workspace admin
    ;;
  *)
    echo "Unknown SERVICE_TARGET: $SERVICE_TARGET (use api|bot|admin)" >&2
    exit 1
    ;;
esac
