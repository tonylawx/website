# Verification Prompt

Use this after implementation.

## Minimum checks

1. `bun run typecheck`
2. Relevant local API or function-level smoke check
3. Relevant page or UI smoke check if the task changes user-facing behavior

## Verify questions

- Did any frontend branch depend on implicit backend behavior?
- Did any i18n string remain hardcoded in a component?
- Did any event summary regress into a placeholder label?
- Did any auth flow branch still assume email verification when it is disabled?
