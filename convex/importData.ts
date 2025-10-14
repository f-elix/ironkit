import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

export const importFromTriplit = internalMutation({
	args: {
		data: v.object({
			weightConverter: v.array(v.any()),
			coefficientCalculator: v.array(v.any()),
			loadPercentageCalculator: v.array(v.any()),
			plateCalculator: v.array(v.any()),
			exercises: v.array(v.any()),
			workouts: v.array(v.any()),
			performanceGroups: v.array(v.any()),
			performances: v.array(v.any()),
			performanceSets: v.array(v.any())
		}),
		userId: v.id('users')
	},
	handler: async (ctx, args) => {
		const idMap = new Map<string, string>();

		console.log('Starting import...');

		// Import exercises first (no dependencies)
		console.log(`Importing ${args.data.exercises.length} exercises...`);
		for (const exercise of args.data.exercises) {
			const newId = await ctx.db.insert('exercises', {
				userId: args.userId,
				name: exercise.name,
				executionType: exercise.executionType,
				loadType: exercise.loadType,
				muscleGroups: exercise.muscleGroups || [],
				updatedAt: Date.now()
			});
			idMap.set(exercise.id, newId);
		}

		// Import workouts (no dependencies)
		console.log(`Importing ${args.data.workouts.length} workouts...`);
		for (const workout of args.data.workouts) {
			const newId = await ctx.db.insert('workouts', {
				userId: args.userId,
				title: workout.title || 'Untitled workout',
				date: workout.date instanceof Date ? workout.date.getTime() : workout.date,
				notes: workout.notes,
				bodyweight: workout.bodyweight,
				bodyweightUnit: workout.bodyweightUnit,
				updatedAt: Date.now()
			});
			idMap.set(workout.id, newId);
		}

		// Import performance groups (depends on workouts)
		console.log(`Importing ${args.data.performanceGroups.length} performance groups...`);
		for (const group of args.data.performanceGroups) {
			const workoutId = idMap.get(group.workoutId);
			if (!workoutId) {
				console.warn(`Skipping performance group ${group.id} - workout not found`);
				continue;
			}
			const newId = await ctx.db.insert('performanceGroups', {
				userId: args.userId,
				workoutId: workoutId as any,
				label: group.label,
				workoutOrder: group.workoutOrder || 0,
				updatedAt: Date.now()
			});
			idMap.set(group.id, newId);
		}

		// Import performances (depends on workouts, performanceGroups, exercises)
		console.log(`Importing ${args.data.performances.length} performances...`);
		for (const perf of args.data.performances) {
			const workoutId = idMap.get(perf.workoutId);
			const performanceGroupId = idMap.get(perf.performanceGroupId);
			const exerciseId = idMap.get(perf.exerciseId);

			if (!workoutId || !performanceGroupId || !exerciseId) {
				console.warn(`Skipping performance ${perf.id} - missing references`);
				continue;
			}

			const newId = await ctx.db.insert('performances', {
				userId: args.userId,
				performanceGroupId: performanceGroupId as any,
				exerciseId: exerciseId as any,
				workoutId: workoutId as any,
				groupOrder: perf.groupOrder || 0,
				note: perf.note,
				weightUnit: perf.weightUnit || 'lbs',
				updatedAt: Date.now()
			});
			idMap.set(perf.id, newId);
		}

		// Import performance sets (depends on performances)
		console.log(`Importing ${args.data.performanceSets.length} performance sets...`);
		for (const set of args.data.performanceSets) {
			const performanceId = idMap.get(set.performanceId);
			if (!performanceId) {
				console.warn(`Skipping performance set ${set.id} - performance not found`);
				continue;
			}

			await ctx.db.insert('performanceSets', {
				userId: args.userId,
				performanceId: performanceId as any,
				weight: set.weight,
				reps: set.reps,
				durationSeconds: set.durationSeconds,
				note: set.note,
				performanceOrder: set.performanceOrder || 0,
				updatedAt: Date.now()
			});
		}

		// Import calculator settings
		console.log('Importing calculator settings...');
		for (const item of args.data.weightConverter) {
			await ctx.db.insert('weightConverter', {
				userId: args.userId,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of args.data.coefficientCalculator) {
			await ctx.db.insert('coefficientCalculator', {
				userId: args.userId,
				genderClass: item.genderClass || 'male',
				totalUnit: item.totalUnit || 'kg',
				bodyweightUnit: item.bodyweightUnit || 'kg',
				updatedAt: Date.now()
			});
		}

		for (const item of args.data.loadPercentageCalculator) {
			await ctx.db.insert('loadPercentageCalculator', {
				userId: args.userId,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of args.data.plateCalculator) {
			await ctx.db.insert('plateCalculator', {
				userId: args.userId,
				barWeight: item.barWeight || 20,
				heavyCollars: item.heavyCollars || false,
				allowNonStandardConfig: item.allowNonStandardConfig || false,
				updatedAt: Date.now()
			});
		}

		console.log('Import complete!');
		return { success: true, idMap: Object.fromEntries(idMap) };
	}
});
