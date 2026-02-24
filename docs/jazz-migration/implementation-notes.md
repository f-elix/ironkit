# Convex to Jazz Migration Implementation Notes

## 2026-02-24 - Simplified migration scripts

- Removed mode-heavy migration CLI flow.
- Added no-args map generator and no-args apply-only seeding script.

## 2026-02-24 - Switched to Convex export command

- Scripts now use built-in `convex export` and parse exported ZIP data directly.
- Removed custom Convex snapshot query path.

## 2026-02-24 - Option 2 credentials retrieval

- Added Jazz Better Auth server plugin in `src/convex/auth.ts`.
- Seeding script now decrypts per-user Jazz credentials from Better Auth user records using `BETTER_AUTH_SECRET`.
- Map file keeps ids only (`convexUserId`, `jazzUserId`), not secrets.
