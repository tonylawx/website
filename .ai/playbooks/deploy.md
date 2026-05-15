# Deploy Playbook

1. Verify locally
2. Push code
3. Let GitHub Actions run:
   - verify
   - build-image
   - deploy
   - health-check
4. Confirm `/health`
5. Confirm one real user path for the changed area

## Secrets expected by API deploy

- `API_DEPLOY_HOST`
- `API_DEPLOY_USER`
- `API_DEPLOY_SSH_KEY`
