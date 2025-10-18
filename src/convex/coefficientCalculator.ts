import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { weightUnit } from './schema';
import { genderClass } from './schema';
import { DEFAULT_GENDER_CLASS, DEFAULT_WEIGHT_UNIT } from '../lib/constants';
import { getAuthUser } from './auth';
import { getAuthUserId } from '@convex-dev/auth/server';

export const get = query({
	handler: async (ctx) => {
		const { _id } = await getAuthUser(ctx);
		return ctx.db
			.query('coefficientCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
	}
});

export const upsert = mutation({
	args: {
		genderClass: v.optional(genderClass),
		totalUnit: v.optional(weightUnit),
		bodyweightUnit: v.optional(weightUnit)
	},
	handler: async (ctx, data) => {
		const _id = await getAuthUserId(ctx);
		if (!_id) {
			throw new Error('Not authenticated');
		}
		const existing = await ctx.db
			.query('coefficientCalculator')
			.withIndex('by_userId', (q) => q.eq('userId', _id))
			.first();
		if (existing) {
			await ctx.db.patch(existing._id, {
				...data,
				updatedAt: Date.now()
			});
		} else {
			await ctx.db.insert('coefficientCalculator', {
				userId: _id,
				genderClass: data.genderClass ?? DEFAULT_GENDER_CLASS,
				totalUnit: data.totalUnit ?? DEFAULT_WEIGHT_UNIT,
				bodyweightUnit: data.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
				updatedAt: Date.now()
			});
		}
	}
});
