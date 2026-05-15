# Verify Checklist

- Run `bun run typecheck`
- If auth changed, test:
  - register
  - sign in
  - sign out
  - current session
- If report/event logic changed, test:
  - one macro event case
  - one earnings event case
  - one no-event case
- If top toolbar changed, test mobile layout
- If deploy behavior changed, ensure CI still builds and health check still passes
