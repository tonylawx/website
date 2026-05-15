# Bugfix Playbook

1. Reproduce the bug
2. Identify whether the root cause is:
   - data
   - contract
   - UI state
   - environment
3. Fix the root cause, not only the symptom
4. Add the narrowest useful verification
5. Re-run the affected flow end-to-end

## Reminder

If the bug spans backend response and frontend rendering, fix both in one pass.
