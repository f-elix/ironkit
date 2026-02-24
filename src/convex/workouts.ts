import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { getAuthUserId } from '@convex-dev/auth/server';
import { weightUnit } from './schema';
import { getAuthUser } from './auth';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';

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

		return workout;
	}
});

export const create = mutation({
	args: {
		title: v.string(),
		date: v.number(),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(weightUnit),
		programRunId: v.optional(v.id('programRuns')),
		programRunSessionId: v.optional(v.id('programRunSessions')),
		sourceProgramWorkoutId: v.optional(v.id('programWorkouts')),
		templateWorkoutId: v.optional(v.id('workouts'))
	},
	handler: async (ctx, args) => {
		const { _id: userId } = await getAuthUser(ctx);

		if (args.programRunSessionId) {
			const programRunSession = await ctx.db.get(args.programRunSessionId);
			if (!programRunSession || programRunSession.userId !== userId) {
				throw new Error('Program run session not found');
			}
			const programRun = await ctx.db.get(programRunSession.programRunId);
			if (!programRun || programRun.userId !== userId) {
				throw new Error('Program run not found');
			}
			if (args.programRunId && args.programRunId !== programRun._id) {
				throw new Error('Program run mismatch');
			}
			if (programRunSession.workoutId !== undefined) {
				throw new Error('Program run session is already linked to a workout');
			}
			if (programRunSession.skippedAt !== undefined) {
				throw new Error('Program run session is skipped');
			}
		} else if (args.programRunId) {
			const programRun = await ctx.db.get(args.programRunId);
			if (!programRun || programRun.userId !== userId) {
				throw new Error('Program run not found');
			}
		}

		if (args.sourceProgramWorkoutId) {
			const programWorkout = await ctx.db.get(args.sourceProgramWorkoutId);
			if (!programWorkout) {
				throw new Error('Source program workout not found');
			}
			const programTemplate = await ctx.db.get(programWorkout.programTemplateId);
			if (!programTemplate || programTemplate.userId !== userId) {
				throw new Error('Source program workout not found');
			}
		}

		const newWorkoutId = await ctx.db.insert('workouts', {
			userId,
			title: args.title,
			date: args.date,
			notes: args.notes,
			bodyweight: args.bodyweight,
			bodyweightUnit: args.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
			programRunId: args.programRunId,
			programRunSessionId: args.programRunSessionId,
			sourceProgramWorkoutId: args.sourceProgramWorkoutId,
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
			bodyweight: updates.bodyweight || undefined,
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

		if (workout.programRunSessionId && workout.programRunId) {
			const runSession = await ctx.db.get(workout.programRunSessionId);
			if (runSession && runSession.programRunId === workout.programRunId) {
				await ctx.db.patch(runSession._id, {
					workoutId: undefined,
					updatedAt: Date.now()
				});

				const run = await ctx.db.get(workout.programRunId);
				if (run && run.userId === userId) {
					if (run.status === 'completed') {
						await ctx.db.patch(run._id, {
							status: 'paused',
							endedAt: undefined,
							updatedAt: Date.now()
						});
					} else {
						await ctx.db.patch(run._id, {
							updatedAt: Date.now()
						});
					}
				}
			}
		}

		const performanceGroups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		const performances = await ctx.db
			.query('performances')
			.withIndex('by_workoutId', (q) => q.eq('workoutId', args.id))
			.collect();

		await Promise.all([
			...performances.map(async (perf) => {
				const sets = await ctx.db
					.query('performanceSets')
					.withIndex('by_performanceId', (q) => q.eq('performanceId', perf._id))
					.collect();
				await Promise.all(sets.map(async (set) => ctx.db.delete(set._id)));
			}),
			...performances.map(async (perf) => ctx.db.delete(perf._id)),
			...performanceGroups.map(async (group) => ctx.db.delete(group._id)),
			ctx.db.delete(args.id)
		]);

		return args.id;
	}
});
