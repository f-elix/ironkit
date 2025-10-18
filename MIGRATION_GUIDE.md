# Complete Triplit to Convex Migration Guide

## Current Status

Most of the foundational work is complete:

- ✅ All Convex functions written
- ✅ Schema converted
- ✅ Auth system migrated
- ✅ Calculator tools updated
- ✅ Some training log components updated

## What Remains

### Remaining Training Log Components

These files still use Triplit and need to be updated to Convex. The pattern is consistent across all of them.

## Update Pattern

### 1. Replace Imports

```typescript
// OLD (Triplit)
import { triplit } from '$lib/db/triplit';
import { useQuery, useQueryOne } from '@triplit/svelte';
import { userId } from '$lib/db/userId';

// NEW (Convex)
import { useConvexQuery, useConvexMutation } from 'convex-svelte';
import { api } from '$convex/_generated/api';
```

### 2. Replace Queries

```typescript
// OLD
const query = useQuery(triplit, triplit.query('workouts'));
let workouts = $derived(query.results);

// NEW
const query = useConvexQuery(api.workouts.list, {});
let workouts = $derived(query.data ?? []);

// OLD (with filters)
const query = useQuery(
	triplit,
	triplit.query('performanceGroups').Where('workoutId', '=', workoutId).Order('workoutOrder', 'ASC')
);

// NEW (filters handled in Convex function)
const query = useConvexQuery(api.performanceGroups.list, { workoutId });
```

### 3. Replace Mutations

```typescript
// OLD
triplit.insert('workouts', {
	...workout,
	userId: userId(),
	title: 'New Workout'
});

// NEW
const createMutation = useConvexMutation(api.workouts.create);
createMutation.mutate({
	title: 'New Workout',
	date: Date.now()
	// ... other fields
});

// OLD (update)
await triplit.update('workouts', id, { title: 'Updated' });

// NEW
const updateMutation = useConvexMutation(api.workouts.update);
await updateMutation.mutate({
	id,
	title: 'Updated'
});

// OLD (delete)
await triplit.delete('workouts', id);

// NEW
const deleteMutation = useConvexMutation(api.workouts.remove);
await deleteMutation.mutate({ id });
```

### 4. Replace ID References

```typescript
// Convex uses _id instead of id
workout.id → workout._id
exercise.id → exercise._id
// etc.
```

### 5. Handle Dates

```typescript
// Convex stores dates as timestamps (numbers)
// Convert to Date when displaying:
const date = new Date(workout.date);

// Convert to timestamp when saving:
date: new Date().getTime();
// or
date: Date.now();
```

### 6. Remove userId() Calls

Convex Auth handles user ID automatically on the server side. Remove all `userId()` calls and `userId` imports.

### 7. Handle Transactions

```typescript
// OLD (Triplit transactions)
await triplit.transact(async (tx) => {
	await tx.delete('performanceSets', setId);
	await tx.delete('performances', perfId);
});

// NEW (Convex - use mutations that handle cascading)
// The mutations in convex/workouts.ts, convex/performanceGroups.ts, etc.
// already handle cascading deletes
await deleteMutation.mutate({ id: perfId });
```

## Files That Still Need Updates

### Priority 1 (Core Functionality)

1. `src/lib/components/training-log/WorkoutInfoDialog.svelte` - Create/edit workout dialog
2. `src/lib/components/training-log/PerformanceGroups.svelte` - List of performance groups
3. `src/lib/components/training-log/PerformanceGroup.svelte` - Single performance group
4. `src/lib/components/training-log/Performance.svelte` - Single performance
5. `src/lib/components/training-log/PerformanceSets.svelte` - List of sets
6. `src/lib/components/training-log/PerformanceSet.svelte` - Single set

### Priority 2 (Supporting Features)

7. `src/lib/components/training-log/PerformanceNote.svelte` - Add notes to performance
8. `src/lib/components/training-log/ExerciseInfoDialog.svelte` - Create/edit exercise
9. `src/lib/components/training-log/PastPerformancesList.svelte` - View past performances
10. `src/lib/components/training-log/WorkoutHeader.svelte` - Workout header with date/title
11. `src/lib/components/training-log/WorkoutMenu.svelte` - Workout actions menu
12. `src/lib/components/training-log/PerformanceGroupSummary.svelte` - Summary view

### Priority 3 (Delete Dialogs)

13. `src/lib/components/training-log/DeleteWorkoutDialog.svelte`
14. `src/lib/components/training-log/DeleteExerciseDialog.svelte`
15. `src/lib/components/training-log/DeletePerformanceDialog.svelte`

### Priority 4 (Helper Functions)

16. `src/lib/training-log/addExerciseToPeformanceGroup.ts` - Helper function
17. `src/lib/training-log/addExerciseToWorkout.ts` - Helper function

### Priority 5 (Route Pages)

18. `src/routes/(app)/tools/training-log/workout-[id]/+page.svelte` - Workout detail page

## After Component Updates

### Run Convex Dev

```bash
npx convex dev
```

This will:

1. Prompt you to login to Convex
2. Create a deployment
3. Generate `convex.json` with your deployment URL
4. Generate `convex/_generated/` directory with TypeScript types

### Set Environment Variables

In the Convex dashboard (opens automatically), set:

```
AUTH_SECRET=<generate with: npx auth secret>
GOOGLE_CLIENT_ID=<from Google OAuth console>
GOOGLE_CLIENT_SECRET=<from Google OAuth console>
```

Also update Google OAuth console:

- Add authorized redirect URI: `https://<your-deployment>.convex.site/api/auth/callback/google`

### Create .env.local (Optional)

```
VITE_CONVEX_URL=<from convex.json>
```

### Cleanup Old Files

Delete:

```bash
rm -rf triplit/
rm src/lib/db/triplit.ts
rm src/lib/db/supabase.ts
rm src/lib/db/getAnonData.ts
rm src/lib/db/loadDb.ts
rm src/lib/db/Auth.svelte.ts
rm src/lib/db/userId.ts
rm src/lib/components/app/GoogleLogin.svelte
rm src/lib/components/app/DevLogin.svelte
rm src/lib/db/constants.ts  # if only used for Triplit
```

### Update Types

Update `src/lib/db/types.ts`:

```typescript
// Remove Triplit imports and types
// Add Convex Doc types if needed
import { type Doc, type Id } from '$convex/_generated/dataModel';

export type Workout = Doc<'workouts'>;
export type PerformanceGroup = Doc<'performanceGroups'>;
export type Performance = Doc<'performances'>;
export type Exercise = Doc<'exercises'>;
export type PerformanceSet = Doc<'performanceSets'>;

// For nested queries, you may need to manually type them
// or keep the types simple and rely on inference
```

### Test Everything

1. ✅ Google OAuth login
2. ✅ Weight converter - save settings
3. ✅ Coefficient calculator - save settings
4. ✅ Load percentage calculator - save settings
5. ✅ Plate calculator - save settings
6. ⏳ Create workout
7. ⏳ Add exercise to workout
8. ⏳ Add sets to exercise
9. ⏳ Create superset
10. ⏳ Reorder performance groups
11. ⏳ View past performances
12. ⏳ Delete sets/exercises/workouts
13. ⏳ Sign out

## Common Issues & Solutions

### Issue: `Cannot find module '$convex/_generated/api'`

**Solution**: Run `npx convex dev` to generate the types

### Issue: Auth not working

**Solution**:

1. Check environment variables in Convex dashboard
2. Verify Google OAuth redirect URLs
3. Check that `convex/http.ts` exports the auth routes

### Issue: Queries returning undefined

**Solution**:

1. Check that you're authenticated
2. Verify the query parameters match the function signature
3. Check Convex dashboard logs for errors

### Issue: Mutations failing silently

**Solution**:

1. Add try/catch blocks and log errors
2. Check Convex dashboard logs
3. Verify userId is being set correctly on the server

## Tips

1. **Update one component at a time** and test it before moving to the next
2. **Check the Convex dashboard logs** frequently for errors
3. **Use TypeScript autocomplete** - the generated types are very helpful
4. **Test auth first** - many components rely on being authenticated
5. **Start with simple components** (like ExerciseSelection) before complex ones (like PerformanceGroup)

## Need Help?

- Convex Docs: https://docs.convex.dev
- Convex Discord: https://convex.dev/community
- Check existing updated components for reference patterns
