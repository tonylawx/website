FROM oven/bun:1.3.11-slim

WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json bun.lock ./
COPY tsconfig.base.json ./
COPY backend/api/package.json backend/api/package.json
COPY packages/auth/package.json packages/auth/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY frontend/auth-web/package.json frontend/auth-web/package.json

RUN bun install --frozen-lockfile --production --omit peer --filter @tonylaw/api

COPY backend/api ./backend/api
COPY packages ./packages

EXPOSE 3001

CMD ["bun", "run", "--cwd", "backend/api", "start"]
