import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const list = query({
	args: { performanceId: v.id('performances') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const sets = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) => q.eq('performanceId', args.performanceId))
			.collect();

		return sets
			.filter((s) => s.userId === userId)
			.toSorted((a, b) => a.performanceOrder - b.performanceOrder);
	}
});

export const create = mutation({
	args: {
		performanceId: v.id('performances'),
		weight: v.optional(v.number()),
		reps: v.optional(v.number()),
		durationSeconds: v.optional(v.number()),
		note: v.optional(v.string()),
		performanceOrder: v.number()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		// Verify the user owns the parent performance
		const performance = await ctx.db.get(args.performanceId);
		if (!performance || performance.userId !== userId) {
			throw new Error('Not authorized');
		}

		const id = await ctx.db.insert('performanceSets', {
			userId,
			performanceId: args.performanceId,
			weight: args.weight,
			reps: args.reps,
			durationSeconds: args.durationSeconds,
			note: args.note,
			performanceOrder: args.performanceOrder,
			updatedAt: Date.now()
		});

		return id;
	}
});

export const update = mutation({
	args: {
		id: v.id('performanceSets'),
		weight: v.optional(v.number()),
		reps: v.optional(v.number()),
		durationSeconds: v.optional(v.number()),
		note: v.optional(v.string()),
		performanceOrder: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const set = await ctx.db.get(args.id);
		if (!set || set.userId !== userId) {
			throw new Error('Performance set not found');
		}

		await ctx.db.patch(args.id, {
			...(args.weight !== undefined && { weight: args.weight }),
			...(args.reps !== undefined && { reps: args.reps }),
			...(args.durationSeconds !== undefined && { durationSeconds: args.durationSeconds }),
			...(args.note !== undefined && { note: args.note }),
			...(args.performanceOrder !== undefined && { performanceOrder: args.performanceOrder }),
			updatedAt: Date.now()
		});

		return args.id;
	}
});

export const remove = mutation({
	args: { id: v.id('performanceSets') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const set = await ctx.db.get(args.id);
		if (!set || set.userId !== userId) {
			throw new Error('Performance set not found');
		}

		await ctx.db.delete(args.id);
		return args.id;
	}
});
