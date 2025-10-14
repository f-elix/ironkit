import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const calculator = await ctx.db
			.query('plateCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		return calculator;
	}
});

export const upsert = mutation({
	args: {
		barWeight: v.number(),
		heavyCollars: v.boolean(),
		allowNonStandardConfig: v.boolean()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const existing = await ctx.db
			.query('plateCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				barWeight: args.barWeight,
				heavyCollars: args.heavyCollars,
				allowNonStandardConfig: args.allowNonStandardConfig,
				updatedAt: Date.now()
			});
			return existing._id;
		} else {
			const id = await ctx.db.insert('plateCalculator', {
				userId,
				barWeight: args.barWeight,
				heavyCollars: args.heavyCollars,
				allowNonStandardConfig: args.allowNonStandardConfig,
				updatedAt: Date.now()
			});
			return id;
		}
	}
});
