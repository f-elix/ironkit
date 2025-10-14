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

		const converter = await ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		return converter;
	}
});

export const upsert = mutation({
	args: {
		unit: v.string(),
		round: v.boolean()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const existing = await ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				unit: args.unit,
				round: args.round,
				updatedAt: Date.now()
			});
			return existing._id;
		} else {
			const id = await ctx.db.insert('weightConverter', {
				userId,
				unit: args.unit,
				round: args.round,
				updatedAt: Date.now()
			});
			return id;
		}
	}
});
