import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { programTemplateStatus } from './schema';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		const templates = await ctx.db
			.query('programTemplates')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.collect();
		return templates.sort((a, b) => b.updatedAt - a.updatedAt);
	}
});

export const getById = query({
	args: {
		id: v.id('programTemplates')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const template = await ctx.db.get(args.id);
		if (!template || template.userId !== userId) {
			return null;
		}
		return template;
	}
});

export const create = mutation({
	args: {
		name: v.string(),
		notes: v.optional(v.string()),
		totalWeeks: v.number(),
		status: v.optional(programTemplateStatus)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		return ctx.db.insert('programTemplates', {
			userId,
			name: args.name.trim() || 'Untitled program',
			notes: args.notes,
			totalWeeks: Math.max(1, Math.floor(args.totalWeeks)),
			status: args.status ?? 'draft',
			updatedAt: Date.now()
		});
	}
});

export const update = mutation({
	args: {
		id: v.id('programTemplates'),
		name: v.optional(v.string()),
		notes: v.optional(v.string()),
		totalWeeks: v.optional(v.number()),
		status: v.optional(programTemplateStatus)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await ctx.db.get(args.id);
		if (!template || template.userId !== userId) {
			throw new Error('Program template not found');
		}
		await ctx.db.patch(args.id, {
			...(args.name !== undefined && { name: args.name.trim() || 'Untitled program' }),
			...(args.notes !== undefined && { notes: args.notes }),
			...(args.totalWeeks !== undefined && { totalWeeks: Math.max(1, Math.floor(args.totalWeeks)) }),
			...(args.status !== undefined && { status: args.status }),
			updatedAt: Date.now()
		});
		return args.id;
	}
});

export const archive = mutation({
	args: {
		id: v.id('programTemplates')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await ctx.db.get(args.id);
		if (!template || template.userId !== userId) {
			throw new Error('Program template not found');
		}
		await ctx.db.patch(args.id, {
			status: 'archived',
			updatedAt: Date.now()
		});
		return args.id;
	}
});

export const remove = mutation({
	args: {
		id: v.id('programTemplates')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await ctx.db.get(args.id);
		if (!template || template.userId !== userId) {
			throw new Error('Program template not found');
		}

		const programWorkouts = await ctx.db
			.query('programWorkouts')
			.withIndex('by_programTemplateId', (q) => q.eq('programTemplateId', args.id))
			.collect();

		for (const programWorkout of programWorkouts) {
			const runSessions = await ctx.db
				.query('programRunSessions')
				.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', programWorkout._id))
				.collect();
			const hasUnfinishedSession = runSessions.some(
				(session) => session.workoutId === undefined && session.skippedAt === undefined
			);
			if (hasUnfinishedSession) {
				throw new Error('Cannot delete template referenced by unfinished program run sessions');
			}
		}

		for (const programWorkout of programWorkouts) {
			const groups = await ctx.db
				.query('performanceGroups')
				.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', programWorkout._id))
				.collect();

			for (const group of groups) {
				const groupExercises = await ctx.db
					.query('performances')
					.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
					.collect();
				for (const exercise of groupExercises.filter((row) => row.programWorkoutId === programWorkout._id)) {
					const setTargets = await ctx.db
						.query('performanceSets')
						.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
						.collect();
					for (const setTarget of setTargets) {
						await ctx.db.delete(setTarget._id);
					}
					await ctx.db.delete(exercise._id);
				}
				await ctx.db.delete(group._id);
			}

			const leftoverExercises = await ctx.db
				.query('performances')
				.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', programWorkout._id))
				.collect();
			for (const exercise of leftoverExercises) {
				const setTargets = await ctx.db
					.query('performanceSets')
					.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
					.collect();
				for (const setTarget of setTargets) {
					await ctx.db.delete(setTarget._id);
				}
				await ctx.db.delete(exercise._id);
			}

			await ctx.db.delete(programWorkout._id);
		}

		await ctx.db.delete(args.id);
		return args.id;
	}
});
