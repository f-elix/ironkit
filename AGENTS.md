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

## Cursor Cloud specific instructions

### Architecture

SvelteKit PWA with client-side rendering only (`ssr = false`). Data syncs via Jazz Cloud (CRDT-based, `wss://cloud.jazz.tools`). Authentication uses Better Auth with a Jazz database adapter, embedded in SvelteKit at `/api/auth/[...all]`. No traditional database or Docker required.

### Environment variables

A `.env` file is required at the repo root. Copy `.env.example` and fill in:

| Variable | Required | Notes |
|---|---|---|
| `PUBLIC_JAZZ_API_KEY` | Yes | Jazz Cloud API key (or an email address for development) |
| `BETTER_AUTH_SECRET` | Yes | Any secret string for session signing |
| `BETTER_AUTH_URL` | Yes | `http://localhost:5173` for local dev |
| `JAZZ_AUTH_WORKER_ACCOUNT` | Yes | Generate via `npx jazz-run account create --name "Auth Worker"` |
| `JAZZ_AUTH_WORKER_SECRET` | Yes | Generated alongside the account above |
| `PUBLIC_TEST_USER_EMAIL` | No | Pre-fills the Dev Login button (dev mode only) |
| `PUBLIC_TEST_USER_PASSWORD` | No | Pre-fills the Dev Login button (dev mode only) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | No | Only needed for Google OAuth; app falls back gracefully |
| `SITE_URL` | No | Fallback for `BETTER_AUTH_URL` |

Note: `.env.example` is outdated — several variable names there don't match the code. Use the table above.

### Running the dev server

`pnpm dev` starts Vite on port 5173. The `--open` flag is already in the script. In dev mode, the `/auth` page shows a "Dev Login" button. The Dev Login calls `signIn.email` — a user must already exist (created via `signUp.email` in the browser or API).

### Gotchas

- `pnpm lint` currently fails with 1 pre-existing ESLint warning (`no-unused-vars` in `PastPerformanceSets.svelte`) due to `--max-warnings=0`.
- `pnpm check` has 5 pre-existing type errors (component prop mismatches and an `AuthProvider` type compatibility issue) unrelated to environment setup.
- The `pnpm.onlyBuiltDependencies` list in `package.json` must include `@tailwindcss/oxide`, `esbuild`, and `sharp` — otherwise `pnpm install` will warn about ignored build scripts and Tailwind CSS won't work correctly.
