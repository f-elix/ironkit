# Jazz Migration Architecture

## Tool Settings Storage (Non-Training-Log)

Calculator settings are now read/written directly from singleton Jazz account root maps under `JazzUserSpace`:

- `root.weightConverter`
- `root.coefficientCalculator`
- `root.loadPercentageCalculator`
- `root.plateCalculator`

Each calculator route uses `AccountCoState(Account, { resolve })` from `jazz-tools/svelte` and updates the corresponding singleton map:

1. Resolve the calculator map directly from `root.<calculatorKey>`.
2. Patch changed fields with `.$jazz.set(...)`.
3. Update `updatedAt` on each write.

This preserves per-user persisted settings behavior while moving reads/writes fully to Jazz and matching the singleton schema pattern.

## Scope Boundary

- Included: all non-training-log tools.
- Explicitly excluded: training-log routes/components and their Convex data paths.
