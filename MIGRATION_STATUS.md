# Triplit to Convex Migration Status

## ✅ Completed

### 1. Convex Setup

- ✅ Installed `convex` and `@convex-dev/auth` packages
- ✅ Removed Triplit and Supabase packages
- ✅ Created `convex/` directory structure
- ✅ Updated `.gitignore` for Convex files

### 2. Schema Conversion

- ✅ Created `convex/schema.ts` with all tables:
  - weightConverter
  - coefficientCalculator
  - loadPercentageCalculator
  - plateCalculator
  - exercises
  - workouts
  - performanceGroups
  - performances
  - performanceSets
- ✅ Added proper indexes for efficient queries

### 3. Auth Setup

- ✅ Created `convex/auth.ts` with Google OAuth
- ✅ Created `convex/http.ts` for auth routes
- ✅ Created `ConvexAuth.svelte.ts` auth class
- ✅ Created `GoogleLoginConvex.svelte` component
- ✅ Updated `/auth` page to use Convex Auth
- ✅ Updated `Header.svelte` to use Convex Auth
- ✅ Updated root `+layout.svelte` to provide Convex Auth context

### 4. Data Migration

- ✅ Created `scripts/exportTriplitData.ts` export script
- ✅ Created `convex/importData.ts` import mutation
- ✅ Exported data to `data-export.json` (currently empty)

### 5. Convex Functions

- ✅ `convex/weightConverter.ts` - get & upsert
- ✅ `convex/coefficientCalculator.ts` - get & upsert
- ✅ `convex/loadPercentageCalculator.ts` - get & upsert
- ✅ `convex/plateCalculator.ts` - get & upsert
- ✅ `convex/exercises.ts` - list, getById, create, update, remove
- ✅ `convex/workouts.ts` - list, getById, create, update, remove (with cascading deletes)
- ✅ `convex/performanceGroups.ts` - list, getById, create, update, updateOrder, remove
- ✅ `convex/performances.ts` - getByExercise, create, update, remove
- ✅ `convex/performanceSets.ts` - list, create, update, remove

### 6. SvelteKit Client Setup

- ✅ Created `src/lib/db/convex.ts` - Convex client
- ✅ Created `src/lib/db/convexHelpers.svelte.ts` - Svelte 5 runes hooks

### 7. UI Components Updated

- ✅ `src/routes/(app)/tools/weight-converter/+page.svelte`
- ✅ `src/routes/(app)/tools/coefficient-calculator/+page.svelte`
- ✅ `src/routes/(app)/tools/load-percentage-calculator/+page.svelte`
- ✅ `src/routes/(app)/tools/plate-calculator/+page.svelte`

## 🔄 In Progress

### Training Log Components

The following components still need to be updated to use Convex:

1. `src/routes/(app)/tools/training-log/+page.svelte` - Workouts list
2. `src/routes/(app)/tools/training-log/workout-[id]/+page.svelte` - Workout detail
3. `src/lib/components/training-log/AddWorkout.svelte`
4. `src/lib/components/training-log/PerformanceGroups.svelte`
5. `src/lib/components/training-log/PerformanceGroup.svelte`
6. `src/lib/components/training-log/Performance.svelte`
7. `src/lib/components/training-log/PerformanceSets.svelte`
8. `src/lib/components/training-log/PerformanceSet.svelte`
9. `src/lib/components/training-log/PerformanceNote.svelte`
10. `src/lib/components/training-log/ExerciseSelection.svelte`
11. `src/lib/components/training-log/ExerciseInfoDialog.svelte`
12. `src/lib/components/training-log/PastPerformancesList.svelte`
13. `src/lib/components/training-log/WorkoutInfoDialog.svelte`
14. `src/lib/components/training-log/DeleteWorkoutDialog.svelte`
15. `src/lib/components/training-log/DeleteExerciseDialog.svelte`
16. `src/lib/components/training-log/WorkoutMenu.svelte`
17. `src/lib/components/training-log/PerformanceGroupSummary.svelte`
18. `src/lib/components/training-log/WorkoutHeader.svelte`
19. `src/lib/training-log/addExerciseToPeformanceGroup.ts`
20. `src/lib/training-log/addExerciseToWorkout.ts`

## ⏳ Pending

### Cleanup

- Delete `triplit/` directory
- Delete `src/lib/db/triplit.ts`
- Delete `src/lib/db/supabase.ts`
- Delete `src/lib/db/getAnonData.ts`
- Delete `src/lib/db/loadDb.ts`
- Delete `src/lib/db/Auth.svelte.ts` (old Supabase auth)
- Delete `src/lib/components/app/GoogleLogin.svelte` (old Supabase login)
- Delete `src/lib/components/app/DevLogin.svelte`
- Delete `src/lib/db/userId.ts`
- Delete `src/lib/db/constants.ts` (if only used for Triplit)
- Update `src/lib/db/types.ts` - remove Triplit types, add Convex types

### Testing

After all components are updated and cleanup is done:

1. Run `npx convex dev` to connect to a Convex deployment
2. Test Google OAuth login
3. Test all calculator tools
4. Test training log features
5. Verify data migration (if there was data)

## 📝 Next Steps

### To continue the migration:

1. **Before running the app**, you need to:

   ```bash
   npx convex dev
   ```

   This will:
   - Prompt you to login to Convex
   - Create a new deployment
   - Generate `convex.json` with your deployment URL
   - Generate `convex/_generated/` with TypeScript types

2. **Set environment variables** in Convex dashboard:

   ```bash
   AUTH_SECRET=<generate with: npx auth secret>
   GOOGLE_CLIENT_ID=<from Google OAuth console>
   GOOGLE_CLIENT_SECRET=<from Google OAuth console>
   ```

3. **Continue updating training log components** - The patterns are established:
   - Replace `useQuery(triplit, ...)` with `useConvexQuery(api.collection.query, args)`
   - Replace `triplit.insert/update/delete` with `useConvexMutation(api.collection.mutation)` and call `.mutate(args)`
   - Replace `triplit.transact` with multiple mutation calls

4. **Import data** (if you have data to migrate):
   - After `npx convex dev` is running
   - Run the import mutation from the Convex dashboard with your user ID

## ⚠️ Important Notes

- The app will not run until `npx convex dev` is executed and generates the required files
- Convex Auth requires OAuth redirect URLs to be configured in Google Console
- The export script found 0 items, so data migration may not be necessary
- The migration preserves all functionality but removes offline-first capabilities (as Convex doesn't support that yet)
