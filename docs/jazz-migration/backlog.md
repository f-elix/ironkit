# Convex to Jazz Migration Backlog

## Current Intent

1. Keep Jazz schema + auth wiring stable.
2. Seed Jazz from Convex export data.
3. Iterate users from a map file and migrate one user at a time.
4. Remove Convex runtime usage after migration parity.

## Status

- [x] Jazz schema foundation
  - `/Users/felix/Documents/projects/ironkit/src/lib/jazz/schema.ts`

- [x] Better Auth + Jazz client/server plugin wiring
  - client: `/Users/felix/Documents/projects/ironkit/src/lib/auth-client.ts`
  - server: `/Users/felix/Documents/projects/ironkit/src/convex/auth.ts`

- [x] User map generator (no args)
  - `/Users/felix/Documents/projects/ironkit/scripts/jazz-migration/generate-user-map.ts`
  - uses `convex export` under the hood
  - writes `/Users/felix/Documents/projects/ironkit/docs/jazz-migration/user-id-map.json`

- [x] Seeding script (no args, apply-only)
  - `/Users/felix/Documents/projects/ironkit/scripts/jazz-migration/migrate-convex-to-jazz.ts`
  - uses `convex export` under the hood
  - iterates all mapped users
  - decrypts per-user Jazz credentials from Better Auth user records using `BETTER_AUTH_SECRET`

- [ ] Tool persistence migration
- [ ] Exercises migration
- [ ] Workouts migration
- [ ] Program templates + runs migration
- [ ] Frontend Convex client removal and final cleanup
