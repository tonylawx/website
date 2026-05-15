# Coding Rules

## Core

- Prefer small, direct changes over broad refactors unless the task explicitly calls for structural work.
- Keep logic in one place. Avoid duplicating formatting, auth, or event interpretation across layers.
- Use English i18n keys only. Display strings may be Chinese or English, but keys should stay language-neutral.
- Replace stringly typed status checks with constants or enums when the meaning is domain-level.

## Type Safety

- Keep TypeScript strictness intact.
- Run `bun run typecheck` after non-trivial changes.
- When backend responses change, update the calling frontend path in the same task.

## Data Contracts

- Prefer explicit response fields over frontend guessing.
- If a UI state depends on backend policy, return that policy explicitly from the API.
- Do not let user-facing event titles degrade into placeholder values such as raw dates if a richer title can be derived.

## Repo Conventions

- Frontend styling should use Tailwind.
- Shared formatting and copy belong in shared modules when reused by multiple apps.
- Hono remains the backend framework.
