import { v } from 'convex/values';
import { mutation, MutationCtx, query } from './_generated/server';
import { weightUnit } from './schema';
import { requireUser } from './model/requireUserId';
import { Doc } from './_generated/dataModel';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';

export const get = query({
	args: {},
	handler: async (ctx) => {
		const userId = await requireUser(ctx);
		const result = await ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();
		return result;
	}
});

export const upsert = mutation({
	args: {
		unit: v.optional(weightUnit),
		round: v.optional(v.boolean())
	},
	handler: async (ctx, data) => {
		const userId = await requireUser(ctx);
		const existing = await ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		if (existing) {
			return ctx.db.patch(existing._id, { ...data, updatedAt: Date.now() });
		} else {
			const id = await ctx.db.insert('weightConverter', {
				userId,
				unit: data.unit ?? DEFAULT_WEIGHT_UNIT,
				round: data.round ?? false,
				updatedAt: Date.now()
			});
			return id;
		}
	}
});
