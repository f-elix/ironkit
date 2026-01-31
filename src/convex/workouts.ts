import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { weightUnit } from './schema';
import { getAuthUser } from './auth';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';
import type { Doc } from './_generated/dataModel';

export const list = query({
	args: {},
	handler: async (ctx) => {
		const { _id } = await getAuthUser(ctx);

		const workouts = await ctx.db
			.query('workouts')
			.withIndex('by_userId_date', (q) => q.eq('userId', _id))
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
		const allSets: Doc<'performanceSets'>[] = [];
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
		bodyweightUnit: v.optional(weightUnit),
		templateWorkoutId: v.optional(v.id('workouts'))
	},
	handler: async (ctx, args) => {
		const { _id: userId } = await getAuthUser(ctx);
		const newWorkoutId = await ctx.db.insert('workouts', {
			userId,
			title: args.title,
			date: args.date,
			notes: args.notes,
			bodyweight: args.bodyweight,
			bodyweightUnit: args.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
			updatedAt: Date.now()
		});
		if (args.templateWorkoutId) {
			const template = await ctx.db.get(args.templateWorkoutId);
			if (!template || template.userId !== userId) {
				throw new Error('Template workout not found');
			}
			const performanceGroups = await ctx.db
				.query('performanceGroups')
				.withIndex('by_workoutId', (q) => q.eq('workoutId', template._id))
				.collect();
			for (const group of performanceGroups) {
				const newGroupId = await ctx.db.insert('performanceGroups', {
					userId,
					label: group.label,
					workoutId: newWorkoutId,
					workoutOrder: group.workoutOrder,
					updatedAt: Date.now()
				});
				const performances = await ctx.db
					.query('performances')
					.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
					.collect();
				for (const perf of performances) {
					const newPerformanceId = await ctx.db.insert('performances', {
						userId,
						performanceGroupId: newGroupId,
						exerciseId: perf.exerciseId,
						groupOrder: perf.groupOrder,
						workoutId: newWorkoutId,
						updatedAt: Date.now(),
						weightUnit: perf.weightUnit
					});
					const sets = await ctx.db
						.query('performanceSets')
						.withIndex('by_performanceId', (q) => q.eq('performanceId', perf._id))
						.collect();
					for (const set of sets) {
						await ctx.db.insert('performanceSets', {
							userId,
							performanceId: newPerformanceId,
							performanceOrder: set.performanceOrder,
							updatedAt: Date.now()
						});
					}
				}
			}
		}
		return newWorkoutId;
	}
});

export const update = mutation({
	args: {
		id: v.id('workouts'),
		title: v.optional(v.string()),
		date: v.optional(v.number()),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(weightUnit)
	},
	handler: async (ctx, args) => {
		const { _id } = await getAuthUser(ctx);
		const { id, ...updates } = args;
		const workout = await ctx.db.get(id);
		if (!workout || workout.userId !== _id) {
			throw new Error('Workout not found');
		}
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now()
		});
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
