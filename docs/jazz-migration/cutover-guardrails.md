# Cutover Guardrails Runbook

This runbook implements backlog item 1 for Convex -> Jazz migration cutover guardrails.

## Final Sequence (Must Follow)

1. Run final `prod` migration script with atomic full-replace semantics.
2. Run guardrails evaluation on migrated data.
3. Deploy the Jazz-backed app only if all guardrails pass.

No progressive rollout, dual-write, or backwards-compatible runtime path is allowed.

## Baseline Snapshot Source of Truth

- Baseline table counts are captured from Convex snapshot JSONs.
- One baseline per account (`dev`, `prod`) is stored in `docs/jazz-migration/baselines/`.
- Baselines are generated with the `tsc`-based runner (no `tsx` dependency at runtime):

```bash
node scripts/jazz-migration/run-preflight-guardrails.mjs baseline \
  --account dev \
  --snapshot /absolute/path/to/convex-snapshot.json \
  --out ./docs/jazz-migration/baselines/dev-convex-baseline.json
```

`/absolute/path/to/convex-snapshot.json` is a placeholder; replace it with the real snapshot file path.

Expected snapshot input shape:

- Either top-level table keys (`{ workouts: [], exercises: [] }`)
- Or nested table keys (`{ tables: { workouts: [], exercises: [] } }`)

## Guardrail Gates (Pass/Fail)

Every rehearsal and final `prod` run must pass all gates:

1. `table-parity`
   - Counts for every logical entity match baseline exactly.
2. `referential-integrity`
   - No broken references in imported Jazz graph.
3. `invariants`
   - Domain invariants hold (ordering + parent-context + active run constraints).
4. `smoke`
   - Required app smoke checks pass on migrated data.

Evaluate with:

```bash
node scripts/jazz-migration/run-preflight-guardrails.mjs evaluate \
  --baseline ./docs/jazz-migration/baselines/dev-convex-baseline.json \
  --target-report /absolute/path/to/jazz-target-report.json \
  --out ./docs/jazz-migration/baselines/dev-guardrail-report.json
```

`/absolute/path/to/jazz-target-report.json` is also a placeholder; replace it with your real report file.

`jazz-target-report.json` must include:

- `targetCounts`
- `referentialChecks`
- `invariantChecks`
- `smokeChecks`

## Abort Criteria

Abort cutover immediately if any gate fails:

- Any table count mismatch
- Any referential integrity violation
- Any invariant violation
- Any smoke failure

## Rerun Procedure

1. Abort deploy and keep Convex-backed app live.
2. Discard the failed Jazz target root.
3. Fix mapping/schema/import issue.
4. Re-run full atomic replace from a fresh Convex snapshot.
5. Re-run guardrails; deploy only after all pass.
