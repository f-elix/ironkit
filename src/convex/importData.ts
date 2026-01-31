import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

// Note: This was a one-time migration from Triplit. The JSON data files have been removed
// after the migration was completed. This mutation is kept for reference but is now a no-op.
export const importFromTriplit = internalMutation({
	handler: async () => {
		console.log('Import already completed. This mutation is now a no-op.');
		return { success: true, message: 'Migration already completed' };
	}
});

export const clearTable = internalMutation({
	args: {
		table: v.union(
			v.literal('performanceSets'),
			v.literal('performances'),
			v.literal('performanceGroups'),
			v.literal('workouts'),
			v.literal('exercises'),
			v.literal('weightConverter'),
			v.literal('coefficientCalculator'),
			v.literal('loadPercentageCalculator'),
			v.literal('plateCalculator')
		)
	},
	handler: async (ctx, args) => {
		const docs = await ctx.db.query(args.table).collect();
		for (const doc of docs) {
			await ctx.db.delete(doc._id);
		}
		return { deleted: docs.length };
	}
});
