import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { weightUnit } from './schema';
import { genderClass } from './schema';

export const get = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const calculator = await ctx.db
			.query('coefficientCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		return calculator;
	}
});

export const upsert = mutation({
	args: {
		genderClass: genderClass,
		totalUnit: weightUnit,
		bodyweightUnit: weightUnit
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const existing = await ctx.db
			.query('coefficientCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.first();

		if (existing) {
			await ctx.db.patch(existing._id, {
				genderClass: args.genderClass,
				totalUnit: args.totalUnit,
				bodyweightUnit: args.bodyweightUnit,
				updatedAt: Date.now()
			});
			return existing._id;
		} else {
			const id = await ctx.db.insert('coefficientCalculator', {
				userId,
				genderClass: args.genderClass,
				totalUnit: args.totalUnit,
				bodyweightUnit: args.bodyweightUnit,
				updatedAt: Date.now()
			});
			return id;
		}
	}
});
