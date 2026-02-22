import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import {
	assertOwnedProgramTemplate,
	assertOwnedProgramWorkout,
	getProgramWorkoutWithDetails
} from './programsCore';

const getNextSlotOrder = async (
	ctx: MutationCtx,
	programTemplateId: Id<'programTemplates'>,
	weekNumber: number
) => {
	const workouts = await ctx.db
		.query('programWorkouts')
		.withIndex('by_programTemplateId_week_slot', (q) =>
			q.eq('programTemplateId', programTemplateId).eq('weekNumber', weekNumber)
		)
		.collect();
	const lastWorkout = workouts.length ? workouts[workouts.length - 1] : undefined;
	return (lastWorkout?.slotOrder ?? -1) + 1;
};

const cloneProgramWorkoutStructure = async (
	ctx: MutationCtx,
	userId: string,
	sourceProgramWorkoutId: Id<'programWorkouts'>,
	targetProgramWorkoutId: Id<'programWorkouts'>
) => {
	const groups = await ctx.db
		.query('performanceGroups')
		.withIndex('by_programWorkoutId_order', (q) => q.eq('programWorkoutId', sourceProgramWorkoutId))
		.collect();

	for (const group of groups.toSorted((a, b) => a.workoutOrder - b.workoutOrder)) {
		const newGroupId = await ctx.db.insert('performanceGroups', {
			userId,
			workoutId: undefined,
			programWorkoutId: targetProgramWorkoutId,
			label: group.label,
			workoutOrder: group.workoutOrder,
			updatedAt: Date.now()
		});

		const exercises = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
			.collect();

		for (const exercise of exercises
			.filter((item) => item.programWorkoutId === sourceProgramWorkoutId)
			.toSorted((a, b) => a.groupOrder - b.groupOrder)) {
			const newExerciseId = await ctx.db.insert('performances', {
				userId,
				performanceGroupId: newGroupId,
				exerciseId: exercise.exerciseId,
				workoutId: undefined,
				programWorkoutId: targetProgramWorkoutId,
				groupOrder: exercise.groupOrder,
				note: exercise.note,
				weightUnit: exercise.weightUnit,
				updatedAt: Date.now()
			});

			const setTargets = await ctx.db
				.query('performanceSets')
				.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
				.collect();
			for (const setTarget of setTargets.toSorted((a, b) => a.performanceOrder - b.performanceOrder)) {
				await ctx.db.insert('performanceSets', {
					userId,
					performanceId: newExerciseId,
					weight: setTarget.weight,
					reps: setTarget.reps,
					durationSeconds: setTarget.durationSeconds,
					programTargetSetRange: setTarget.programTargetSetRange,
					programTargetRepsRange: setTarget.programTargetRepsRange,
					programTargetDuration: setTarget.programTargetDuration,
					note: setTarget.note,
					performanceOrder: setTarget.performanceOrder,
					updatedAt: Date.now()
				});
			}
		}
	}
};

const removeProgramWorkoutStructure = async (
	ctx: MutationCtx,
	programWorkoutId: Id<'programWorkouts'>
) => {
	const groups = await ctx.db
		.query('performanceGroups')
		.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', programWorkoutId))
		.collect();

	for (const group of groups) {
		const exercises = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
			.collect();
		for (const exercise of exercises.filter((item) => item.programWorkoutId === programWorkoutId)) {
			const setTargets = await ctx.db
				.query('performanceSets')
				.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
				.collect();
			for (const setTarget of setTargets) {
				await ctx.db.delete(setTarget._id);
			}
			await ctx.db.delete(exercise._id);
		}
		await ctx.db.delete(group._id);
	}

	const leftoverExercises = await ctx.db
		.query('performances')
		.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', programWorkoutId))
		.collect();
	for (const exercise of leftoverExercises) {
		const setTargets = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
			.collect();
		for (const setTarget of setTargets) {
			await ctx.db.delete(setTarget._id);
		}
		await ctx.db.delete(exercise._id);
	}
};

export const listByTemplate = query({
	args: {
		programTemplateId: v.id('programTemplates')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);
		const workouts = await ctx.db
			.query('programWorkouts')
			.withIndex('by_programTemplateId', (q) => q.eq('programTemplateId', args.programTemplateId))
			.collect();
		return workouts.toSorted((a, b) => a.weekNumber - b.weekNumber || a.slotOrder - b.slotOrder);
	}
});

export const listByWeek = query({
	args: {
		programTemplateId: v.id('programTemplates'),
		weekNumber: v.number()
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);
		const workouts = await ctx.db
			.query('programWorkouts')
			.withIndex('by_programTemplateId_week_slot', (q) =>
				q.eq('programTemplateId', args.programTemplateId).eq('weekNumber', args.weekNumber)
			)
			.collect();
		return workouts.toSorted((a, b) => a.slotOrder - b.slotOrder);
	}
});

export const getById = query({
	args: {
		id: v.optional(v.id('programWorkouts'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId || !args.id) {
			return null;
		}
		await assertOwnedProgramWorkout(ctx, args.id, userId);
		return getProgramWorkoutWithDetails(ctx, args.id);
	}
});

export const createWeekWorkoutFromScratch = mutation({
	args: {
		programTemplateId: v.id('programTemplates'),
		weekNumber: v.number(),
		trackKey: v.string(),
		label: v.optional(v.string()),
		notes: v.optional(v.string()),
		slotOrder: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);
		const weekNumber = Math.max(1, Math.floor(args.weekNumber));
		const slotOrder = args.slotOrder ?? (await getNextSlotOrder(ctx, template._id, weekNumber));
		const programWorkoutId = await ctx.db.insert('programWorkouts', {
			userId,
			programTemplateId: args.programTemplateId,
			weekNumber,
			slotOrder,
			trackKey: args.trackKey.trim().toUpperCase() || 'A',
			label: args.label,
			notes: args.notes,
			updatedAt: Date.now()
		});
		await ctx.db.insert('performanceGroups', {
			userId,
			workoutId: undefined,
			programWorkoutId,
			workoutOrder: 0,
			label: undefined,
			updatedAt: Date.now()
		});
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return programWorkoutId;
	}
});

export const copyPreviousTrackOccurrenceToWeek = mutation({
	args: {
		programTemplateId: v.id('programTemplates'),
		trackKey: v.string(),
		targetWeekNumber: v.number(),
		label: v.optional(v.string()),
		notes: v.optional(v.string()),
		slotOrder: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);
		const targetWeekNumber = Math.max(1, Math.floor(args.targetWeekNumber));
		const normalizedTrackKey = args.trackKey.trim().toUpperCase();
		const candidates = await ctx.db
			.query('programWorkouts')
			.withIndex('by_programTemplateId_track_week', (q) =>
				q.eq('programTemplateId', template._id).eq('trackKey', normalizedTrackKey)
			)
			.collect();
		const sourceWorkout = candidates
			.filter((workout) => workout.weekNumber < targetWeekNumber)
			.toSorted((a, b) => b.weekNumber - a.weekNumber || b.slotOrder - a.slotOrder)[0];

		if (!sourceWorkout) {
			throw new Error('No previous workout found for this track');
		}

		const slotOrder =
			args.slotOrder ?? (await getNextSlotOrder(ctx, template._id, targetWeekNumber));
		const targetProgramWorkoutId = await ctx.db.insert('programWorkouts', {
			userId,
			programTemplateId: template._id,
			weekNumber: targetWeekNumber,
			slotOrder,
			trackKey: normalizedTrackKey,
			label: args.label ?? sourceWorkout.label,
			notes: args.notes ?? sourceWorkout.notes,
			updatedAt: Date.now()
		});

		await cloneProgramWorkoutStructure(ctx, userId, sourceWorkout._id, targetProgramWorkoutId);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return targetProgramWorkoutId;
	}
});

export const updateWorkoutMeta = mutation({
	args: {
		id: v.id('programWorkouts'),
		weekNumber: v.optional(v.number()),
		slotOrder: v.optional(v.number()),
		trackKey: v.optional(v.string()),
		label: v.optional(v.string()),
		notes: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { workout, template } = await assertOwnedProgramWorkout(ctx, args.id, userId);
		await ctx.db.patch(workout._id, {
			...(args.weekNumber !== undefined && {
				weekNumber: Math.max(1, Math.floor(args.weekNumber))
			}),
			...(args.slotOrder !== undefined && { slotOrder: Math.floor(args.slotOrder) }),
			...(args.trackKey !== undefined && { trackKey: args.trackKey.trim().toUpperCase() || 'A' }),
			...(args.label !== undefined && { label: args.label }),
			...(args.notes !== undefined && { notes: args.notes }),
			updatedAt: Date.now()
		});
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return workout._id;
	}
});

export const reorderWithinWeek = mutation({
	args: {
		programTemplateId: v.id('programTemplates'),
		weekNumber: v.number(),
		updates: v.array(
			v.object({
				id: v.id('programWorkouts'),
				slotOrder: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const template = await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);

		for (const update of args.updates) {
			const { workout } = await assertOwnedProgramWorkout(ctx, update.id, userId);
			if (workout.programTemplateId !== template._id || workout.weekNumber !== args.weekNumber) {
				throw new Error('Program workout does not belong to this week');
			}
			await ctx.db.patch(workout._id, {
				slotOrder: Math.floor(update.slotOrder),
				updatedAt: Date.now()
			});
		}
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return true;
	}
});

export const remove = mutation({
	args: {
		id: v.id('programWorkouts')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { workout, template } = await assertOwnedProgramWorkout(ctx, args.id, userId);

		const linkedRunSessions = await ctx.db
			.query('programRunSessions')
			.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', workout._id))
			.collect();
		const hasUnfinishedRunSession = linkedRunSessions.some(
			(session) => session.workoutId === undefined && session.skippedAt === undefined
		);
		if (hasUnfinishedRunSession) {
			throw new Error('Cannot delete a program workout referenced by unfinished run sessions');
		}

		await removeProgramWorkoutStructure(ctx, workout._id);
		await ctx.db.delete(workout._id);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return args.id;
	}
});
