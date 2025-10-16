import { internalMutation } from './_generated/server';
import { v } from 'convex/values';
import exercises from './snapshot-1760579946447/collections/exercises.json' with { type: 'json' };
import workouts from './snapshot-1760579946447/collections/workouts.json' with { type: 'json' };
import performanceGroups from './snapshot-1760579946447/collections/performanceGroups.json' with { type: 'json' };
import performances from './snapshot-1760579946447/collections/performances.json' with { type: 'json' };
import performanceSets from './snapshot-1760579946447/collections/performanceSets.json' with { type: 'json' };
import weightConverter from './snapshot-1760579946447/collections/weightConverter.json' with { type: 'json' };
import coefficientCalculator from './snapshot-1760579946447/collections/coefficientCalculator.json' with { type: 'json' };
import loadPercentageCalculator from './snapshot-1760579946447/collections/loadPercentageCalculator.json' with { type: 'json' };
import plateCalculator from './snapshot-1760579946447/collections/plateCalculator.json' with { type: 'json' };

export const importFromTriplit = internalMutation({
	handler: async (ctx) => {
		const idMap = new Map<string, string>();

		console.log('Starting import...');

		// Import exercises first (no dependencies)
		console.log(`Importing ${exercises.length} exercises...`);
		for (const exercise of exercises) {
			const newId = await ctx.db.insert('exercises', {
				userId: exercise.userId,
				name: exercise.name,
				executionType: exercise.executionType,
				loadType: exercise.loadType,
				muscleGroups: exercise.muscleGroups || [],
				updatedAt: Date.now()
			});
			idMap.set(exercise.id, newId);
		}

		// Import workouts (no dependencies)
		console.log(`Importing ${workouts.length} workouts...`);
		for (const workout of workouts) {
			const newId = await ctx.db.insert('workouts', {
				userId: workout.userId as any,
				title: workout.title || 'Untitled workout',
				date: new Date(workout.date as string).getTime(),
				notes: workout.notes,
				bodyweight: workout.bodyweight,
				bodyweightUnit: workout.bodyweightUnit,
				updatedAt: Date.now()
			});
			idMap.set(workout.id, newId);
		}

		// Import performance groups (depends on workouts)
		console.log(`Importing ${performanceGroups.length} performance groups...`);
		for (const group of performanceGroups) {
			const workoutId = idMap.get(group.workoutId);
			if (!workoutId) {
				console.warn(`Skipping performance group ${group.id} - workout not found`);
				continue;
			}
			const newId = await ctx.db.insert('performanceGroups', {
				userId: group.userId as any,
				workoutId: workoutId as any,
				label: group.label,
				workoutOrder: group.workoutOrder || 0,
				updatedAt: Date.now()
			});
			idMap.set(group.id, newId);
		}

		// Import performances (depends on workouts, performanceGroups, exercises)
		console.log(`Importing ${performances.length} performances...`);
		for (const perf of performances) {
			const workoutId = idMap.get(perf.workoutId);
			const performanceGroupId = idMap.get(perf.performanceGroupId);
			const exerciseId = idMap.get(perf.exerciseId);

			if (!workoutId || !performanceGroupId || !exerciseId) {
				console.warn(`Skipping performance ${perf.id} - missing references`);
				continue;
			}

			const newId = await ctx.db.insert('performances', {
				userId: perf.userId as any,
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
		console.log(`Importing ${performanceSets.length} performance sets...`);
		for (const set of performanceSets) {
			const performanceId = idMap.get(set.performanceId);
			if (!performanceId) {
				console.warn(`Skipping performance set ${set.id} - performance not found`);
				continue;
			}

			await ctx.db.insert('performanceSets', {
				userId: set.userId as any,
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
		for (const item of weightConverter) {
			await ctx.db.insert('weightConverter', {
				userId: item.userId as any,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of coefficientCalculator) {
			await ctx.db.insert('coefficientCalculator', {
				userId: item.userId as any,
				genderClass: item.genderClass || 'male',
				totalUnit: item.totalUnit || 'kg',
				bodyweightUnit: item.bodyweightUnit || 'kg',
				updatedAt: Date.now()
			});
		}

		for (const item of loadPercentageCalculator) {
			await ctx.db.insert('loadPercentageCalculator', {
				userId: item.userId as any,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of plateCalculator) {
			await ctx.db.insert('plateCalculator', {
				userId: item.userId as any,
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
