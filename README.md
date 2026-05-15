# Option Tool

Monorepo for the `tonylaw.cc` options tool stack.

## Apps

- `app/`
  Main Optix web frontend
- `frontend/auth-web/`
  Shared auth frontend
- `backend/api/`
  Unified Hono backend
- `packages/`
  Shared auth, db, contracts, UI, and i18n packages

## Local Development

Install dependencies:

```bash
bun install
```

Run the main frontend:

```bash
bun run dev
```

Run the auth frontend:

```bash
bun run auth:dev
```

Run the unified backend:

```bash
bun run unified-api:dev
```

## AI Workflow

This repository includes an in-repo AI workflow under:

- [`.ai/README.md`](.ai/README.md)

Recommended flow:

1. Start with `.ai/prompts/plan.md`
2. Follow `.ai/rules/*.md`
3. Verify with `.ai/checklists/verify.md`
4. Use `.ai/playbooks/*.md` for feature, bugfix, and deploy work

## CI/CD

### Pull Requests

PRs run the quality gate workflow:

- typecheck only

Workflow:

- [`.github/workflows/quality-gate.yml`](.github/workflows/quality-gate.yml)

### Deploy API

Pushes to deploy branches run the API pipeline:

1. verify
2. build image
3. deploy to VPS
4. health check

Workflow:

- [`.github/workflows/deploy-api.yml`](.github/workflows/deploy-api.yml)

## Deployment Notes

- Docker images are built in GitHub Actions
- The VPS only pulls and runs tagged images
- API deployment expects these repository secrets:
  - `API_DEPLOY_HOST`
  - `API_DEPLOY_USER`
  - `API_DEPLOY_SSH_KEY`
