import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUser } from './auth';

export const get = query({
	handler: async (ctx) => {
		const { _id } = await getAuthUser(ctx);
		return ctx.db
			.query('plateCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
	}
});

export const upsert = mutation({
	args: {
		barWeight: v.optional(v.number()),
		heavyCollars: v.optional(v.boolean()),
		allowNonStandardConfig: v.optional(v.boolean())
	},
	handler: async (ctx, data) => {
		const { _id } = await getAuthUser(ctx);
		const existing = await ctx.db
			.query('plateCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, {
				...data,
				updatedAt: Date.now()
			});
		} else {
			await ctx.db.insert('plateCalculator', {
				userId: _id,
				barWeight: data.barWeight ?? 20,
				heavyCollars: data.heavyCollars ?? false,
				allowNonStandardConfig: data.allowNonStandardConfig ?? false,
				updatedAt: Date.now()
			});
		}
	}
});
