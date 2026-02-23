# Convex to Jazz Migration Implementation Notes

This file is a running log. Add a dated entry for every meaningful migration change.

## Log Template

```md
## YYYY-MM-DD - Short title

- Scope:
- Files touched:
- Decisions:
- Risks:
- Validation:
- Follow-ups:
```

## 2026-02-23 - Migration docs scaffold + initial plan

- Scope:
  - Created migration doc set with backlog and architecture for Convex -> Jazz.
  - Added instruction in `AGENTS.md` to keep migration docs current.
- Files touched:
  - `AGENTS.md`
  - `docs/jazz-migration/backlog.md`
  - `docs/jazz-migration/architecture.md`
  - `docs/jazz-migration/implementation-notes.md`
- Decisions:
  - Keep migration scoped to parity first; no behavior redesign during backend swap.
  - Initial sequence: schema -> auth -> migration script -> domain-by-domain endpoint migration.
- Risks:
  - Auth/account mapping mismatch can break data ownership after import.
  - Cyclic links between workouts and run sessions require two-pass import patching.
  - Program/template/run invariants are easy to regress if write-path parity is incomplete.
- Validation:
  - Existing Convex endpoints and relationships were inventoried to seed backlog.
  - Better Auth + Jazz migration capability confirmed from Jazz docs.
- Follow-ups:
  - Implement Jazz schema definitions with explicit ownership/permission defaults.
  - Draft export/import script skeleton with dry-run support and parity report output.

## 2026-02-23 - Strategy adjustments for single-user cutover

- Scope:
  - Updated migration strategy to match personal app constraints (single operator, `dev` + `prod` accounts).
- Files touched:
  - `docs/jazz-migration/backlog.md`
  - `docs/jazz-migration/architecture.md`
  - `docs/jazz-migration/implementation-notes.md`
- Decisions:
  - No progressive rollout, no dual-backend path, and no backward compatibility layer.
  - Migration script is atomic and replace-all on every run.
  - Script will be run multiple times on `dev` and once on `prod` right before deployment.
  - Final deployment is all-at-once immediately after final production migration.
- Risks:
  - Atomic replace-all requires strict environment targeting to avoid wiping the wrong account.
  - Root-switch mechanism must be validated so failed imports never become active data.
- Validation:
  - Backlog and architecture now encode explicit big-bang and repeated-rehearsal workflow.
- Follow-ups:
  - Define exact script safety checks (`--env`, `--account`, `--confirm` for destructive run).
  - Implement and test root-build + pointer-switch atomic import flow.
