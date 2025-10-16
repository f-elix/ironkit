import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}

		const workouts = await ctx.db
			.query('workouts')
			.withIndex('by_userId_date', (q) => q.eq('userId', userId))
			.order('desc')
			.collect();

		return workouts;
	}
});

export const getById = query({
	args: { id: v.id('workouts') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}

		const workout = await ctx.db.get(args.id);
		if (!workout || workout.userId !== userId) {
			return null;
		}

		// Get all performance groups for this workout
		const performanceGroups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		// Get all performances for these groups
		const performances = await ctx.db
			.query('performances')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		// Get all exercise IDs
		const exerciseIds = Array.from(new Set(performances.map((p) => p.exerciseId)));
		const exercises = await Promise.all(exerciseIds.map((id) => ctx.db.get(id)));
		const exerciseMap = new Map(exercises.filter((e) => e !== null).map((e) => [e!._id, e]));

		// Get all performance sets
		const performanceIds = performances.map((p) => p._id);
		const allSets: any[] = [];
		for (const perfId of performanceIds) {
			const sets = await ctx.db
				.query('performanceSets')
				.withIndex('by_performanceId', (q) => q.eq('performanceId', perfId))
				.collect();
			allSets.push(...sets);
		}

		// Build the nested structure
		return {
			...workout,
			performanceGroups: performanceGroups
				.sort((a, b) => a.workoutOrder - b.workoutOrder)
				.map((group) => ({
					...group,
					performances: performances
						.filter((p) => p.performanceGroupId === group._id)
						.sort((a, b) => a.groupOrder - b.groupOrder)
						.map((perf) => ({
							...perf,
							exercise: exerciseMap.get(perf.exerciseId) || null,
							sets: allSets
								.filter((s) => s.performanceId === perf._id)
								.sort((a, b) => a.performanceOrder - b.performanceOrder)
						}))
				}))
		};
	}
});

export const create = mutation({
	args: {
		title: v.string(),
		date: v.number(),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const id = await ctx.db.insert('workouts', {
			userId,
			title: args.title,
			date: args.date,
			notes: args.notes,
			bodyweight: args.bodyweight,
			bodyweightUnit: args.bodyweightUnit,
			updatedAt: Date.now()
		});

		return id;
	}
});

export const update = mutation({
	args: {
		id: v.id('workouts'),
		title: v.optional(v.string()),
		date: v.optional(v.number()),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const workout = await ctx.db.get(args.id);
		if (!workout || workout.userId !== userId) {
			throw new Error('Workout not found');
		}

		await ctx.db.patch(args.id, {
			...(args.title !== undefined && { title: args.title }),
			...(args.date !== undefined && { date: args.date }),
			...(args.notes !== undefined && { notes: args.notes }),
			...(args.bodyweight !== undefined && { bodyweight: args.bodyweight }),
			...(args.bodyweightUnit !== undefined && { bodyweightUnit: args.bodyweightUnit }),
			updatedAt: Date.now()
		});

		return args.id;
	}
});

export const remove = mutation({
	args: { id: v.id('workouts') },
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const workout = await ctx.db.get(args.id);
		if (!workout || workout.userId !== userId) {
			throw new Error('Workout not found');
		}

		// Delete all related performance groups
		const performanceGroups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		// Delete all related performances
		const performances = await ctx.db
			.query('performances')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		// Delete all related performance sets
		for (const perf of performances) {
			const sets = await ctx.db
				.query('performanceSets')
				.withIndex('by_performanceId', (q) => q.eq('performanceId', perf._id))
				.collect();
			for (const set of sets) {
				await ctx.db.delete(set._id);
			}
		}

		// Delete performances
		for (const perf of performances) {
			await ctx.db.delete(perf._id);
		}

		// Delete performance groups
		for (const group of performanceGroups) {
			await ctx.db.delete(group._id);
		}

		// Finally delete the workout
		await ctx.db.delete(args.id);

		return args.id;
	}
});
