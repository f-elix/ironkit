import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';
import { assertOwnedProgramWorkout } from './programsCore';
import {
	assertOwnedExercise,
	defaultSetTargetForExecution,
	normalizePositiveInteger
} from './programValidation';

type ProgramCtx = MutationCtx | QueryCtx;

const assertOwnedProgramWorkoutGroup = async (
	ctx: ProgramCtx,
	id: Id<'performanceGroups'>,
	userId: string
) => {
	const group = await ctx.db.get(id);
	if (!group) {
		throw new Error('Program workout group not found');
	}
	if (group.programWorkoutId === undefined || group.workoutId !== undefined) {
		throw new Error('Group is not part of a program workout');
	}
	const { workout, template } = await assertOwnedProgramWorkout(
		ctx,
		group.programWorkoutId,
		userId
	);
	return { group, workout, template };
};

const assertOwnedProgramWorkoutExercise = async (
	ctx: ProgramCtx,
	id: Id<'performances'>,
	userId: string
) => {
	const item = await ctx.db.get(id);
	if (!item) {
		throw new Error('Program workout exercise not found');
	}
	if (item.programWorkoutId === undefined || item.workoutId !== undefined) {
		throw new Error('Performance is not part of a program workout');
	}
	const group = await ctx.db.get(item.performanceGroupId);
	if (!group || group.programWorkoutId !== item.programWorkoutId || group.workoutId !== undefined) {
		throw new Error('Program workout group not found');
	}
	const { workout, template } = await assertOwnedProgramWorkout(ctx, item.programWorkoutId, userId);
	return { item, group, workout, template };
};

const listSetTargets = async (ctx: ProgramCtx, performanceId: Id<'performances'>) => {
	const rows = await ctx.db
		.query('performanceSets')
		.withIndex('by_performanceId_order', (q) => q.eq('performanceId', performanceId))
		.collect();
	return rows.sort((a, b) => a.performanceOrder - b.performanceOrder);
};

const createDefaultSetTargets = async (
	ctx: MutationCtx,
	userId: string,
	performanceId: Id<'performances'>,
	executionType: 'reps' | 'time',
	setCount: number
) => {
	const totalSets = normalizePositiveInteger(setCount, 'Set count');
	const defaults = defaultSetTargetForExecution(executionType);

	for (let i = 0; i < totalSets; i += 1) {
		await ctx.db.insert('performanceSets', {
			userId,
			performanceId,
			performanceOrder: i,
			programTargetSetRange: defaults.targetSetRange,
			programTargetRepsRange: defaults.targetRepsRange,
			programTargetDuration: defaults.targetDuration,
			updatedAt: Date.now()
		});
	}
};

const resetSetTargetsForExecution = async (
	ctx: MutationCtx,
	performanceId: Id<'performances'>,
	executionType: 'reps' | 'time'
) => {
	const existingSets = await listSetTargets(ctx, performanceId);
	const defaults = defaultSetTargetForExecution(executionType);

	for (const set of existingSets) {
		await ctx.db.patch(set._id, {
			programTargetSetRange: defaults.targetSetRange,
			programTargetRepsRange: defaults.targetRepsRange,
			programTargetDuration: defaults.targetDuration,
			updatedAt: Date.now()
		});
	}
};

export const list = query({
	args: {
		programWorkoutId: v.id('programWorkouts')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		await assertOwnedProgramWorkout(ctx, args.programWorkoutId, userId);
		const rows = await ctx.db
			.query('performances')
			.withIndex('by_programWorkoutId', (q) => q.eq('programWorkoutId', args.programWorkoutId))
			.collect();
		const rowsWithDetails = await Promise.all(
			rows
				.sort((a, b) => a.groupOrder - b.groupOrder)
				.map(async (row) => ({
					...row,
					exercise: await ctx.db.get(row.exerciseId),
					exactSets: await listSetTargets(ctx, row._id)
				}))
		);
		return rowsWithDetails;
	}
});

export const create = mutation({
	args: {
		programWorkoutId: v.id('programWorkouts'),
		performanceGroupId: v.id('performanceGroups'),
		exerciseId: v.id('exercises'),
		groupOrder: v.optional(v.number()),
		note: v.optional(v.string()),
		initialSetCount: v.optional(v.number())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const { group, workout, template } = await assertOwnedProgramWorkoutGroup(
			ctx,
			args.performanceGroupId,
			userId
		);
		if (group.programWorkoutId !== args.programWorkoutId || workout._id !== args.programWorkoutId) {
			throw new Error('Group is not part of the provided program workout');
		}

		const exercise = await assertOwnedExercise(ctx, args.exerciseId, userId);
		const currentRows = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
			.collect();
		const lastRow = currentRows.length
			? currentRows.sort((a, b) => a.groupOrder - b.groupOrder)[currentRows.length - 1]
			: undefined;

		const rowId = await ctx.db.insert('performances', {
			userId,
			performanceGroupId: group._id,
			exerciseId: args.exerciseId,
			workoutId: undefined,
			programWorkoutId: args.programWorkoutId,
			groupOrder: args.groupOrder ?? (lastRow?.groupOrder ?? -1) + 1,
			note: args.note,
			weightUnit: DEFAULT_WEIGHT_UNIT,
			updatedAt: Date.now()
		});

		await createDefaultSetTargets(
			ctx,
			userId,
			rowId,
			exercise.executionType,
			args.initialSetCount ?? 3
		);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return rowId;
	}
});

export const update = mutation({
	args: {
		id: v.id('performances'),
		exerciseId: v.optional(v.id('exercises')),
		performanceGroupId: v.optional(v.id('performanceGroups')),
		groupOrder: v.optional(v.number()),
		note: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { item, workout, template } = await assertOwnedProgramWorkoutExercise(
			ctx,
			args.id,
			userId
		);

		let performanceGroupId = item.performanceGroupId;
		if (args.performanceGroupId !== undefined) {
			const { group } = await assertOwnedProgramWorkoutGroup(ctx, args.performanceGroupId, userId);
			if (group.programWorkoutId !== workout._id) {
				throw new Error('Target group must be in the same program workout');
			}
			performanceGroupId = group._id;
		}

		const currentExercise = await assertOwnedExercise(ctx, item.exerciseId, userId);
		const nextExercise =
			args.exerciseId !== undefined
				? await assertOwnedExercise(ctx, args.exerciseId, userId)
				: currentExercise;

		await ctx.db.patch(item._id, {
			...(args.exerciseId !== undefined && { exerciseId: args.exerciseId }),
			...(args.groupOrder !== undefined && { groupOrder: args.groupOrder }),
			...(args.note !== undefined && { note: args.note }),
			...(performanceGroupId !== item.performanceGroupId && { performanceGroupId }),
			updatedAt: Date.now()
		});

		if (currentExercise.executionType !== nextExercise.executionType) {
			await resetSetTargetsForExecution(ctx, item._id, nextExercise.executionType);
		}

		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return item._id;
	}
});

export const updateOrder = mutation({
	args: {
		updates: v.array(
			v.object({
				id: v.id('performances'),
				groupOrder: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		for (const update of args.updates) {
			const { item, template } = await assertOwnedProgramWorkoutExercise(ctx, update.id, userId);
			await ctx.db.patch(item._id, {
				groupOrder: update.groupOrder,
				updatedAt: Date.now()
			});
			await ctx.db.patch(template._id, { updatedAt: Date.now() });
		}
		return true;
	}
});

export const remove = mutation({
	args: {
		id: v.id('performances')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { item, template } = await assertOwnedProgramWorkoutExercise(ctx, args.id, userId);
		const setTargets = await listSetTargets(ctx, item._id);
		for (const setTarget of setTargets) {
			await ctx.db.delete(setTarget._id);
		}
		await ctx.db.delete(item._id);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return args.id;
	}
});
