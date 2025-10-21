import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { exerciseExecutionType, exerciseLoadType } from './schema';
import { getAuthUser } from './auth';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const { _id: userId } = await getAuthUser(ctx);

		const exercises = await ctx.db
			.query('exercises')
			.withIndex('by_userId_name', (q) => q.eq('userId', userId))
			.order('asc')
			.collect();

		return exercises;
	}
});

export const getById = query({
	args: { id: v.id('exercises') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const exercise = await ctx.db.get(args.id);
		if (!exercise || exercise.userId !== userId) {
			return null;
		}

		return exercise;
	}
});

export const create = mutation({
	args: {
		name: v.string(),
		executionType: exerciseExecutionType,
		loadType: exerciseLoadType,
		muscleGroups: v.array(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const id = await ctx.db.insert('exercises', {
			userId,
			name: args.name,
			executionType: args.executionType,
			loadType: args.loadType,
			muscleGroups: args.muscleGroups,
			updatedAt: Date.now()
		});

		return id;
	}
});

export const update = mutation({
	args: {
		id: v.id('exercises'),
		name: v.optional(v.string()),
		executionType: v.optional(exerciseExecutionType),
		loadType: v.optional(exerciseLoadType),
		muscleGroups: v.optional(v.array(v.string()))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const exercise = await ctx.db.get(args.id);
		if (!exercise || exercise.userId !== userId) {
			throw new Error('Exercise not found');
		}

		await ctx.db.patch(args.id, {
			...(args.name !== undefined && { name: args.name }),
			...(args.executionType !== undefined && { executionType: args.executionType }),
			...(args.loadType !== undefined && { loadType: args.loadType }),
			...(args.muscleGroups !== undefined && { muscleGroups: args.muscleGroups }),
			updatedAt: Date.now()
		});

		return args.id;
	}
});

export const remove = mutation({
	args: { id: v.id('exercises') },
	handler: async (ctx, args) => {
		const { _id: userId } = await getAuthUser(ctx);
		const exercise = await ctx.db.get(args.id);
		if (!exercise || exercise.userId !== userId) {
			throw new Error('Exercise not found');
		}
		// Delete all performances and sets associated with this exercise
		const performances = await ctx.db
			.query('performances')
			.withIndex('by_exerciseId', (q) => q.eq('exerciseId', args.id))
			.collect();
		const sets = (
			await Promise.all(
				performances.map(async (performance) => {
					return ctx.db
						.query('performanceSets')
						.withIndex('by_performanceId', (q) => q.eq('performanceId', performance._id))
						.collect();
				})
			)
		).flat();
		for (const set of sets) {
			await ctx.db.delete(set._id);
		}
		for (const performance of performances) {
			await ctx.db.delete(performance._id);
		}
		// Delete all performance groups that are now empty
		const performanceGroupIds = [
			...new Set(performances.map((performance) => performance.performanceGroupId))
		];
		// Find all performances still in a performance group from which we have deleted a performance
		const performancesStillInGroups = (
			await Promise.all(
				performanceGroupIds.map(async (performanceGroupId) => {
					return ctx.db
						.query('performances')
						.withIndex('by_performanceGroupId', (q) =>
							q.eq('performanceGroupId', performanceGroupId)
						)
						.collect();
				})
			)
		).flat();
		// Find all performance groups that are now empty
		const emptyPerformanceGroupIds = performanceGroupIds.filter(
			(performanceGroupId) =>
				!performancesStillInGroups.some(
					(performance) => performance.performanceGroupId === performanceGroupId
				)
		);
		// Delete all performance groups that are now empty
		for (const performanceGroupId of emptyPerformanceGroupIds) {
			await ctx.db.delete(performanceGroupId);
		}
		// Delete the exercise
		await ctx.db.delete(args.id);
	}
});
