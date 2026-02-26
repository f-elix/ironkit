# Jazz Migration Backlog

## Completed

- [x] Auth migration to Jazz + Better Auth integration.
- [x] Jazz schema definitions for calculators and training-log entities.
- [x] Migrated non-training-log tool data access from Convex to Jazz:
  - [x] `weight-converter`
  - [x] `coefficient-calculator`
  - [x] `load-percentage-calculator`
  - [x] `plate-calculator`
- [x] Verified `1rm-calculator` has no persisted query/mutation path to migrate.
- [x] Migrated training-log root page (`/tools/training-log`) reads and primary actions to Jazz.

## Remaining

- [ ] Migrate remaining training-log routes/components from Convex to Jazz (beyond `/tools/training-log` root page).
- [ ] Remove Convex client/server runtime usage once all training-log flows are migrated.
- [ ] Decommission Convex schema/functions after migration parity is confirmed.
