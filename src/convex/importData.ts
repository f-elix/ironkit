// @ts-nocheck
import { internalMutation } from './_generated/server';
import exercises from './triplit-data/exercises.json' with { type: 'json' };
import workouts from './triplit-data/workouts.json' with { type: 'json' };
import performanceGroups from './triplit-data/performanceGroups.json' with { type: 'json' };
import performances from './triplit-data/performances.json' with { type: 'json' };
import performanceSets from './triplit-data/performanceSets.json' with { type: 'json' };
import weightConverter from './triplit-data/weightConverter.json' with { type: 'json' };
import coefficientCalculator from './triplit-data/coefficientCalculator.json' with { type: 'json' };
import loadPercentageCalculator from './triplit-data/loadPercentageCalculator.json' with { type: 'json' };
import plateCalculator from './triplit-data/plateCalculator.json' with { type: 'json' };

export const importFromTriplit = internalMutation({
	handler: async (ctx) => {
		const idMap = new Map<string, string>();

		const userIdMap = new Map<string, string>();
		userIdMap.set('7a09f20c-f538-4795-a3b6-93d0221453b9', 'k97b4zeqr4ztcpk2x6q3z4jqfs7spxvx');
		userIdMap.set('00d62602-33fa-4709-bd8d-b76dca9e1f28', 'k97592991w28wtnz15k6be8he17sqc29');

		console.log('Starting import...');

		// Import exercises first (no dependencies)
		console.log(`Importing ${exercises.length} exercises...`);
		for (const exercise of exercises) {
			const userId = userIdMap.get(exercise.userId);
			if (!userId) {
				console.warn(`Skipping exercise ${exercise.id} - user not found`);
				continue;
			}
			const newId = await ctx.db.insert('exercises', {
				userId: userId as any,
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
			const userId = userIdMap.get(workout.userId);
			if (!userId) {
				console.warn(`Skipping workout ${workout.id} - user not found`);
				continue;
			}
			const newId = await ctx.db.insert('workouts', {
				userId: userId as any,
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
			const userId = userIdMap.get(group.userId);
			if (!userId) {
				console.warn(`Skipping performance group ${group.id} - user not found`);
				continue;
			}
			const newId = await ctx.db.insert('performanceGroups', {
				userId: userId as any,
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
			const userId = userIdMap.get(perf.userId);
			if (!userId) {
				console.warn(`Skipping performance ${perf.id} - user not found`);
				continue;
			}
			const newId = await ctx.db.insert('performances', {
				userId: userId as any,
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
			const userId = userIdMap.get(set.userId);
			if (!userId) {
				console.warn(`Skipping performance set ${set.id} - user not found`);
				continue;
			}
			await ctx.db.insert('performanceSets', {
				userId: userId as any,
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
			const userId = userIdMap.get(item.userId);
			if (!userId) {
				console.warn(`Skipping weight converter ${item.id} - user not found`);
				continue;
			}
			await ctx.db.insert('weightConverter', {
				userId: userId as any,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of coefficientCalculator) {
			const userId = userIdMap.get(item.userId);
			if (!userId) {
				console.warn(`Skipping coefficient calculator ${item.id} - user not found`);
				continue;
			}
			await ctx.db.insert('coefficientCalculator', {
				userId: userId as any,
				genderClass: item.genderClass || 'male',
				totalUnit: item.totalUnit || 'kg',
				bodyweightUnit: item.bodyweightUnit || 'kg',
				updatedAt: Date.now()
			});
		}

		for (const item of loadPercentageCalculator) {
			const userId = userIdMap.get(item.userId);
			if (!userId) {
				console.warn(`Skipping load percentage calculator ${item.id} - user not found`);
				continue;
			}
			await ctx.db.insert('loadPercentageCalculator', {
				userId: userId as any,
				unit: item.unit || 'kg',
				round: item.round || false,
				updatedAt: Date.now()
			});
		}

		for (const item of plateCalculator) {
			const userId = userIdMap.get(item.userId);
			if (!userId) {
				console.warn(`Skipping plate calculator ${item.id} - user not found`);
				continue;
			}
			await ctx.db.insert('plateCalculator', {
				userId: userId as any,
				barWeight: item.barWeight || 20,
				heavyCollars: item.heavyCollars || false,
				allowNonStandardConfig: item.allowNonStandardConfig || false,
				updatedAt: Date.now()
			});
		}

		console.log('Import complete!');
		return { success: true };
	}
});
