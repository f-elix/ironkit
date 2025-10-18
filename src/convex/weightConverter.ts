import { v } from 'convex/values';
import { mutation, MutationCtx, query } from './_generated/server';
import { weightUnit } from './schema';
import { requireUser } from './model/requireUser';
import { Doc } from './_generated/dataModel';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';
import { toolSingletonQuery } from './model/toolSingletonQuery';

export const get = query({
	handler: async (ctx) => {
		const { _id } = await requireUser(ctx);
		return ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
	}
});

export const upsert = mutation({
	args: {
		unit: v.optional(weightUnit),
		round: v.optional(v.boolean())
	},
	handler: async (ctx, data) => {
		const { _id } = await requireUser(ctx);
		const existing = await ctx.db
			.query('weightConverter')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
		if (existing) {
			return ctx.db.patch(existing._id, { ...data, updatedAt: Date.now() });
		} else {
			const id = await ctx.db.insert('weightConverter', {
				userId: _id,
				unit: data.unit ?? DEFAULT_WEIGHT_UNIT,
				round: data.round ?? false,
				updatedAt: Date.now()
			});
			return id;
		}
	}
});
