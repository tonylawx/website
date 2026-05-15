# UI Rules

## Design

- Preserve the existing Optix visual language: rounded surfaces, dense tool-like layout, warm paper backgrounds, and strong navy contrast.
- Reuse shadcn-style components or shared local UI primitives before creating bespoke controls.
- Prefer compact, app-like interactions on mobile.

## Interaction

- Repeated actions that may grow later should use menus instead of one-off buttons.
- Keep primary controls easy to scan in the top toolbar.
- Loading, clear, and status affordances should live close to the input or control they affect.

## Copy

- Do not hardcode duplicated UI copy in components when it belongs in shared i18n.
- Event summaries should be explicit, not shorthand when the shorthand hides meaning.
