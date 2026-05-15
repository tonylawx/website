# API Rules

## Contracts

- Make auth state and policy explicit in API responses.
- Keep public and internal auth routes clearly separated.
- Return stable machine-readable fields for frontend branching.

## Event Data

- Important event items should include both the display title and the date/countdown metadata.
- Macro and earnings event formatting should be derived centrally.
- If an upstream source returns partial data, enrich it once in the backend instead of patching the UI.

## Deployment

- Build images in GitHub Actions, not on the VPS.
- The VPS should pull and run a tagged image, then pass health checks.
