# Agent Instructions

Collection of tools for lifters, with an extensive training log.

## Package Manager

pnpm

## Key Commands

- `pnpm check` - TypeScript/Svelte type checking
- `pnpm lint` - Run linters
- `pnpm lc` - Run check and lint
- `pnpm format` - Run formatter

## Svelte

Use `clsx` style syntax for the `class` attribute over string interpolation.

```svelte
<!-- Bad -->
<div class="class {condition ? 'true': 'false'}">
<!-- Good -->
<div class={['class', condition ? 'true': 'false']}>
```

## Migration Docs

Keep `docs/jazz-migration/backlog.md`, `docs/jazz-migration/architecture.md`, and `docs/jazz-migration/implementation-notes.md` updated as Convex to Jazz migration work progresses.
