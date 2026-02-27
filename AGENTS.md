# Agent Instructions

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

Fight entropy. Leave the codebase better than you found it.

## Project

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
