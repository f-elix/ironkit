import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { weightUnit } from './schema';

export const getByExercise = query({
	args: {
		exerciseId: v.id('exercises'),
		currentWorkoutId: v.optional(v.id('workouts')),
		maxDate: v.optional(v.number()),
		limit: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		// Get all performances for this exercise
		const allPerformances = await ctx.db
			.query('performances')
			.withIndex('by_exerciseId', (q) => q.eq('exerciseId', args.exerciseId))
			.collect();

		// Filter by user and workout constraints
		let filteredPerformances = allPerformances.filter((p) => p.userId === userId);

		// If currentWorkoutId is provided, exclude it and filter by date
		if (args.currentWorkoutId) {
			filteredPerformances = filteredPerformances.filter(
				(p) => p.workoutId !== args.currentWorkoutId
			);

			const currentWorkout = await ctx.db.get(args.currentWorkoutId);
			if (currentWorkout) {
				const workoutIds = [...new Set(filteredPerformances.map((p) => p.workoutId))];
				const workouts = await Promise.all(workoutIds.map((id) => ctx.db.get(id)));
				const validWorkoutIds = new Set(
					workouts.filter((w) => w !== null && w.date <= currentWorkout.date).map((w) => w!._id)
				);
				filteredPerformances = filteredPerformances.filter((p) => validWorkoutIds.has(p.workoutId));
			}
		} else if (args.maxDate) {
			// Filter by max date
			const workoutIds = [...new Set(filteredPerformances.map((p) => p.workoutId))];
			const workouts = await Promise.all(workoutIds.map((id) => ctx.db.get(id)));
			const validWorkoutIds = new Set(
				workouts.filter((w) => w !== null && w.date < args.maxDate!).map((w) => w!._id)
			);
			filteredPerformances = filteredPerformances.filter((p) => validWorkoutIds.has(p.workoutId));
		}

		// Get workouts for sorting and filtering
		const workoutIds = [...new Set(filteredPerformances.map((p) => p.workoutId))];
		const workouts = await Promise.all(workoutIds.map((id) => ctx.db.get(id)));
		const workoutMap = new Map(workouts.filter((w) => w !== null).map((w) => [w!._id, w]));

		// Sort by workout date DESC
		filteredPerformances.sort((a, b) => {
			const workoutA = workoutMap.get(a.workoutId);
			const workoutB = workoutMap.get(b.workoutId);
			if (!workoutA || !workoutB) {
				return 0;
			}
			return workoutB.date - workoutA.date;
		});

		// Limit results
		const limit = args.limit || 10;
		const limitedPerformances = filteredPerformances.slice(0, limit);

		// Get exercise and sets for each performance
		const exercise = await ctx.db.get(args.exerciseId);
		const performancesWithDetails = await Promise.all(
			limitedPerformances.map(async (perf) => {
				const sets = await ctx.db
					.query('performanceSets')
					.withIndex('by_performanceId_order', (q) => q.eq('performanceId', perf._id))
					.collect();

				// Filter sets to only include those with values
				const validSets = sets.filter(
					(s) =>
						(s.weight && s.weight > 0) ||
						(s.reps && s.reps > 0) ||
						(s.durationSeconds && s.durationSeconds > 0)
				);

				return {
					...perf,
					exercise,
					workout: workoutMap.get(perf.workoutId) || null,
					sets: validSets.sort((a, b) => a.performanceOrder - b.performanceOrder)
				};
			})
		);

		return performancesWithDetails;
	}
});

export const create = mutation({
	args: {
		performanceGroupId: v.id('performanceGroups'),
		exerciseId: v.id('exercises'),
		workoutId: v.id('workouts'),
		groupOrder: v.number(),
		note: v.optional(v.string()),
		weightUnit: weightUnit
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const id = await ctx.db.insert('performances', {
			userId,
			performanceGroupId: args.performanceGroupId,
			exerciseId: args.exerciseId,
			workoutId: args.workoutId,
			groupOrder: args.groupOrder,
			note: args.note,
			weightUnit: args.weightUnit,
			updatedAt: Date.now()
		});

		return id;
	}
});

export const update = mutation({
	args: {
		id: v.id('performances'),
		note: v.optional(v.string()),
		weightUnit: v.optional(weightUnit)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const performance = await ctx.db.get(args.id);
		if (!performance || performance.userId !== userId) {
			throw new Error('Performance not found');
		}

		await ctx.db.patch(args.id, {
			...(args.note !== undefined && { note: args.note }),
			...(args.weightUnit !== undefined && { weightUnit: args.weightUnit }),
			updatedAt: Date.now()
		});

		return args.id;
	}
});

export const remove = mutation({
	args: { id: v.id('performances') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const performance = await ctx.db.get(args.id);
		if (!performance || performance.userId !== userId) {
			throw new Error('Performance not found');
		}

		// Delete all sets for this performance
		const sets = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId', (q) => q.eq('performanceId', args.id))
			.collect();

		for (const set of sets) {
			await ctx.db.delete(set._id);
		}

		// Delete the performance
		await ctx.db.delete(args.id);

		return args.id;
	}
});
