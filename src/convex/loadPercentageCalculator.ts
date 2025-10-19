import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { weightUnit } from './schema';
import { getAuthUser } from './auth';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';

export const get = query({
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const calculator = await ctx.db
			.query('loadPercentageCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		return calculator;
	}
});

export const upsert = mutation({
	args: {
		unit: v.optional(weightUnit),
		round: v.optional(v.boolean())
	},
	handler: async (ctx, args) => {
		const { _id } = await getAuthUser(ctx);
		const existing = await ctx.db
			.query('loadPercentageCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, {
				unit: args.unit ?? DEFAULT_WEIGHT_UNIT,
				round: args.round ?? false,
				updatedAt: Date.now()
			});
		} else {
			await ctx.db.insert('loadPercentageCalculator', {
				userId: _id,
				unit: args.unit ?? DEFAULT_WEIGHT_UNIT,
				round: args.round ?? false,
				updatedAt: Date.now()
			});
		}
	}
});
