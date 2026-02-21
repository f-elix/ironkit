import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const list = query({
	args: { workoutId: v.id('workouts') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const groups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_workoutId_order', (q) => q.eq('workoutId', args.workoutId))
			.collect();

		return groups
			.filter((g) => g.userId === userId)
			.sort((a, b) => a.workoutOrder - b.workoutOrder);
	}
});

export const getById = query({
	args: { id: v.id('performanceGroups') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const group = await ctx.db.get(args.id);
		if (!group || group.userId !== userId) {
			return null;
		}
		if (!group.workoutId || group.programWorkoutId !== undefined) {
			return null;
		}

		// Get workout for this group
		const workout = await ctx.db.get(group.workoutId);

		// Get performances for this group
		const performances = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', args.id))
			.collect();

		// Get exercises
		const exerciseIds = Array.from(new Set(performances.map((p) => p.exerciseId)));
		const exercises = await Promise.all(exerciseIds.map((id) => ctx.db.get(id)));
		const exerciseMap = new Map(exercises.filter((e) => e !== null).map((e) => [e!._id, e]));

		// Get sets for each performance
		const performancesWithSets = await Promise.all(
			performances.map(async (perf) => {
				const sets = await ctx.db
					.query('performanceSets')
					.withIndex('by_performanceId_order', (q) => q.eq('performanceId', perf._id))
					.collect();

				return {
					...perf,
					exercise: exerciseMap.get(perf.exerciseId) || null,
					sets: sets.sort((a, b) => a.performanceOrder - b.performanceOrder),
					workout
				};
			})
		);

		return {
			...group,
			performances: performancesWithSets.sort((a, b) => a.groupOrder - b.groupOrder)
		};
	}
});

export const getWorkoutStats = query({
	args: { workoutId: v.id('workouts') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return { exerciseCount: 0, setCount: 0 };
		}

		const groups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.workoutId))
			.collect();
		const exerciseCount = groups.filter(
			(group) =>
				group.userId === userId &&
				group.workoutId === args.workoutId &&
				group.programWorkoutId === undefined
		).length;

		const performances = await ctx.db
			.query('performances')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.workoutId))
			.collect();
		const userPerformances = performances.filter(
			(performance) =>
				performance.userId === userId &&
				performance.workoutId === args.workoutId &&
				performance.programWorkoutId === undefined
		);

		const setCounts = await Promise.all(
			userPerformances.map(async (performance) => {
				const sets = await ctx.db
					.query('performanceSets')
					.withIndex('by_performanceId', (q) => q.eq('performanceId', performance._id))
					.collect();
				return sets.length;
			})
		);
		const setCount = setCounts.reduce((sum, count) => sum + count, 0);

		return { exerciseCount, setCount };
	}
});

export const create = mutation({
	args: {
		workoutId: v.id('workouts'),
		label: v.optional(v.string()),
		workoutOrder: v.number()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		// Verify the user owns the workout
		const workout = await ctx.db.get(args.workoutId);
		if (!workout || workout.userId !== userId) {
			throw new Error('Not authorized');
		}

		const id = await ctx.db.insert('performanceGroups', {
			userId,
			workoutId: args.workoutId,
			programWorkoutId: undefined,
			label: args.label,
			workoutOrder: args.workoutOrder,
			updatedAt: Date.now()
		});

		return id;
	}
});

export const update = mutation({
	args: {
		id: v.id('performanceGroups'),
		label: v.optional(v.string()),
		workoutOrder: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const group = await ctx.db.get(args.id);
		if (
			!group ||
			group.userId !== userId ||
			!group.workoutId ||
			group.programWorkoutId !== undefined
		) {
			throw new Error('Performance group not found');
		}

		await ctx.db.patch(args.id, {
			...(args.label !== undefined && { label: args.label }),
			...(args.workoutOrder !== undefined && { workoutOrder: args.workoutOrder }),
			updatedAt: Date.now()
		});

		return args.id;
	}
});

export const updateOrder = mutation({
	args: {
		updates: v.array(
			v.object({
				id: v.id('performanceGroups'),
				workoutOrder: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		// Update all the orders
		for (const update of args.updates) {
			const group = await ctx.db.get(update.id);
			if (group && group.userId === userId) {
				await ctx.db.patch(update.id, {
					workoutOrder: update.workoutOrder,
					updatedAt: Date.now()
				});
			}
		}

		return true;
	}
});

export const remove = mutation({
	args: { id: v.id('performanceGroups') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const group = await ctx.db.get(args.id);
		if (!group || group.userId !== userId) {
			throw new Error('Performance group not found');
		}

		// Delete all performances in this group
		const performances = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', args.id))
			.collect();

		// Delete all sets for each performance
		for (const perf of performances) {
			const sets = await ctx.db
				.query('performanceSets')
				.withIndex('by_performanceId', (q) => q.eq('performanceId', perf._id))
				.collect();
			for (const set of sets) {
				await ctx.db.delete(set._id);
			}
			await ctx.db.delete(perf._id);
		}

		// Delete the group
		await ctx.db.delete(args.id);

		return args.id;
	}
});
