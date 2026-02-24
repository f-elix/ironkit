# Cutover Guardrails

## Required Preconditions

1. `user-id-map.json` is filled.
2. Better Auth user records contain persisted Jazz credentials (`encryptedCredentials`).
3. `BETTER_AUTH_SECRET` is set for script runtime.

## Run

```bash
node scripts/jazz-migration/run-generate-user-map.mjs
node scripts/jazz-migration/run-migrate-convex-to-jazz.mjs
```

## Pass Criteria

1. `seed-report.json` has no `failed` users.
2. Each per-user `target-report.json` has referential/invariant checks passing.
3. Imported counts look correct.

## Abort Rule

Do not deploy with any failed user migration.
