# AI Workflow

This repository uses a lightweight `Superpowers + Harness` workflow.

## Goals

- Keep coding rules in-repo instead of in one tool only.
- Make implementation steps repeatable across Codex, Claude Code, Cursor, and other agents.
- Gate deployment with verification before image build and release.

## Structure

- `rules/`
  Core project rules that all agents should follow.
- `prompts/`
  Reusable prompts for planning, implementation, and verification.
- `checklists/`
  Fast execution checklists before review or deploy.
- `playbooks/`
  End-to-end workflows for common tasks such as features, bugfixes, and deploys.

## Operating Model

1. Start with `prompts/plan.md`.
2. Follow `rules/` while editing.
3. Run `checklists/verify.md` before asking for review or deploying.
4. Use `playbooks/feature.md`, `playbooks/bugfix.md`, or `playbooks/deploy.md` to keep the flow consistent.

## CI Mapping

The GitHub workflow in `.github/workflows/deploy-api.yml` mirrors the same Harness-style stages:

1. `verify`
2. `build-image`
3. `deploy`
4. `health-check`

That means local AI work and remote CI work use the same sequence.
