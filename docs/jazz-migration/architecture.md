# Convex to Jazz Migration Architecture

## Data Source

Migration scripts use Convex's built-in export command:

- `pnpm exec convex export --path <dir>`

The zip is parsed in-memory from:

- `/Users/felix/Documents/projects/ironkit/scripts/jazz-migration/convex-export.ts`

## User Map

Hardcoded map file path:

- `/Users/felix/Documents/projects/ironkit/docs/jazz-migration/user-id-map.json`

Format:

- `convexUserId` (Convex/Better Auth user id)
- `jazzUserId` (Jazz account id)

## Credential Retrieval (Option 2)

Per-user Jazz account secrets are not stored in the map file.

They are retrieved from Better Auth user records (`encryptedCredentials`) and decrypted with `BETTER_AUTH_SECRET`.

Requirements:

1. Jazz Better Auth server plugin enabled (`jazzPlugin()` in `src/convex/auth.ts`).
2. Target users have authenticated after plugin enablement so credentials are persisted.
3. `BETTER_AUTH_SECRET` available to migration scripts.

## Scripts

- Generate map (no args):
  - `node scripts/jazz-migration/run-generate-user-map.mjs`
- Seed (no args):
  - `node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs`

## Output

Run artifacts are written to `docs/jazz-migration/runs/seed-*/`:

- `seed-report.json`
- per-user `apply-report.json`, `target-report.json`, `id-map-actual.json`
