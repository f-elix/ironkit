import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { exerciseExecutionType, exerciseLoadType } from './schema';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const exercises = await ctx.db
			.query('exercises')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
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
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const exercise = await ctx.db.get(args.id);
		if (!exercise || exercise.userId !== userId) {
			throw new Error('Exercise not found');
		}

		await ctx.db.delete(args.id);
		return args.id;
	}
});
