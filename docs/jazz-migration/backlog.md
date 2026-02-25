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

## Remaining

- [ ] Migrate training-log queries and mutations from Convex to Jazz.
- [ ] Remove Convex client/server runtime usage once all training-log flows are migrated.
- [ ] Decommission Convex schema/functions after migration parity is confirmed.
