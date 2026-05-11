#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/tonylaw/option-tool}"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-main}"
COMPOSE_FILE="$APP_DIR/ops/api/compose.yml"
DEPLOY_ENV_DIR="${DEPLOY_ENV_DIR:-/opt/tonylaw/api}"
DEPLOY_ENV_FILE="$DEPLOY_ENV_DIR/deploy.env"
API_IMAGE="${API_IMAGE:?API_IMAGE is required}"

if [[ -n "${GHCR_USERNAME:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USERNAME" --password-stdin >/dev/null
fi

cd "$APP_DIR"
if [[ "${SKIP_GIT_SYNC:-false}" != "true" ]]; then
  git fetch origin "$DEPLOY_BRANCH"
  git checkout "$DEPLOY_BRANCH"
  git reset --hard "origin/$DEPLOY_BRANCH"
fi

install -d -m 755 "$DEPLOY_ENV_DIR"
printf 'API_IMAGE=%s\n' "$API_IMAGE" > "$DEPLOY_ENV_FILE"

if [[ "${SKIP_PULL:-false}" != "true" ]]; then
  docker compose -f "$COMPOSE_FILE" --env-file "$DEPLOY_ENV_FILE" pull
fi

docker compose -f "$COMPOSE_FILE" --env-file "$DEPLOY_ENV_FILE" up -d --remove-orphans

for attempt in {1..30}; do
  if docker compose -f "$COMPOSE_FILE" --env-file "$DEPLOY_ENV_FILE" exec -T api bun --eval "fetch('http://127.0.0.1:3001/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"; then
    echo "API health check passed"
    exit 0
  fi

  echo "Waiting for API health check... ($attempt/30)"
  sleep 2
done

docker compose -f "$COMPOSE_FILE" --env-file "$DEPLOY_ENV_FILE" logs --tail=120 api
exit 1
