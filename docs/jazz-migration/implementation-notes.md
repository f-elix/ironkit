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

## 2026-02-23 - Backlog item 1 guardrails + item 2 schema scaffold start

- Scope:
  - Completed backlog item 1 by implementing pre-flight cutover guardrails as code + runbook.
  - Started backlog item 2 with initial Convex -> Jazz schema parity scaffolding.
- Files touched:
  - `src/lib/jazz-migration/preflight-guardrails.ts`
  - `scripts/jazz-migration/preflight-guardrails.ts`
  - `src/lib/jazz-migration/schema-parity-scaffold.ts`
  - `docs/jazz-migration/cutover-guardrails.md`
  - `docs/jazz-migration/baselines/README.md`
  - `docs/jazz-migration/backlog.md`
  - `docs/jazz-migration/architecture.md`
  - `docs/jazz-migration/implementation-notes.md`
- Decisions:
  - Canonicalized entity parity over all Convex migration tables to enforce deterministic guardrail checks.
  - Implemented guardrail evaluation as a hard gate (non-zero exit on failure) so deployment automation can abort immediately.
  - Captured schema parity as typed scaffolding first (enums, entities, relationships, ordering, parent-context rules) before wiring concrete `jazz-tools` runtime types.
  - Assumption: Convex snapshot inputs for baseline capture are JSON objects keyed by table, optionally nested under `tables`.
- Risks:
  - Guardrail evaluator depends on target report quality; incorrect or incomplete target reports can mask migration issues.
  - Schema scaffold is not yet executable Jazz runtime schema; drift risk exists until `jazz-tools` definitions replace/derive from scaffold.
  - Parent-context constraints are currently documented/scaffolded, not yet enforced at write-time in Jazz APIs.
- Validation:
  - Ran `pnpm exec eslint src/lib/jazz-migration/preflight-guardrails.ts scripts/jazz-migration/preflight-guardrails.ts src/lib/jazz-migration/schema-parity-scaffold.ts`.
  - Ran `pnpm exec tsc --noEmit scripts/jazz-migration/preflight-guardrails.ts src/lib/jazz-migration/preflight-guardrails.ts src/lib/jazz-migration/schema-parity-scaffold.ts --moduleResolution bundler --module esnext --target ESNext --strict`.
  - Ran `pnpm exec tsc --outDir /tmp/jazz-migration-cli-cjs --module commonjs --moduleResolution node --target ESNext --strict scripts/jazz-migration/preflight-guardrails.ts src/lib/jazz-migration/preflight-guardrails.ts` and then:
    - `node /tmp/jazz-migration-cli-cjs/scripts/jazz-migration/preflight-guardrails.js baseline --account dev --snapshot /tmp/jazz-migration-snapshot.json --out /tmp/dev-convex-baseline.json`
    - `node /tmp/jazz-migration-cli-cjs/scripts/jazz-migration/preflight-guardrails.js evaluate --baseline /tmp/dev-convex-baseline.json --target-report /tmp/jazz-target-report.json --out /tmp/dev-guardrail-report.json`
- Follow-ups:
  - Add concrete `jazz-tools` dependency and convert scaffold descriptors into executable Jazz schema definitions.
  - Produce real `dev` and `prod` baseline JSON artifacts from deterministic Convex export snapshots.
  - Wire referential/invariant/smoke outputs from migration import script into `target-report.json` generation.

## 2026-02-23 - Guardrail command path switched to tsc-only runner

- Scope:
  - Replaced `tsx` invocation path in guardrail docs with a `tsc`-only runner command.
- Files touched:
  - `scripts/jazz-migration/run-preflight-guardrails.mjs`
  - `scripts/jazz-migration/preflight-guardrails.ts`
  - `docs/jazz-migration/cutover-guardrails.md`
  - `docs/jazz-migration/implementation-notes.md`
- Decisions:
  - Standardized operator command as `node scripts/jazz-migration/run-preflight-guardrails.mjs ...`.
  - Runner compiles the required TypeScript files to CommonJS in temp output and then executes the CLI with Node.
- Risks:
  - Runner depends on `pnpm exec tsc`; if TypeScript compile fails, guardrails cannot run.
  - Temp output path in system tmp can be cleaned externally between runs (safe; runner recompiles each run).
- Validation:
  - Ran `pnpm exec eslint --no-ignore scripts/jazz-migration/preflight-guardrails.ts scripts/jazz-migration/run-preflight-guardrails.mjs`.
  - Ran `node scripts/jazz-migration/run-preflight-guardrails.mjs baseline --account dev --snapshot /tmp/jazz-migration-snapshot.json --out /tmp/dev-convex-baseline.json`.
  - Ran `node scripts/jazz-migration/run-preflight-guardrails.mjs evaluate --baseline /tmp/dev-convex-baseline.json --target-report /tmp/jazz-target-report.json --out /tmp/dev-guardrail-report.json`.
- Follow-ups:
  - Optionally add `package.json` script aliases for baseline/evaluate flows once target-report generation is wired from migration script output.

## 2026-02-23 - Guardrail snapshot path error messaging clarification

- Scope:
  - Clarified placeholder file paths in guardrail runbook and improved missing snapshot error messaging.
- Files touched:
  - `scripts/jazz-migration/preflight-guardrails.ts`
  - `docs/jazz-migration/cutover-guardrails.md`
  - `docs/jazz-migration/implementation-notes.md`
- Decisions:
  - Fail early with explicit guidance when `--snapshot` points to a non-existent file.
  - Mark snapshot/target-report paths as placeholders in docs.
- Risks:
  - None beyond existing requirement that snapshot/target-report files must exist before running guardrails.
- Validation:
  - Ran `pnpm exec eslint --no-ignore scripts/jazz-migration/preflight-guardrails.ts`.
  - Ran `pnpm exec tsc --noEmit scripts/jazz-migration/preflight-guardrails.ts --moduleResolution bundler --module esnext --target ESNext --strict`.
- Follow-ups:
  - Add first-class Convex snapshot export command in migration tooling (backlog item 4) so baseline capture path is generated by tooling instead of user-provided manually.
