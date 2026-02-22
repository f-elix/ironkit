import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import {
	assertOwnedExercise,
	defaultSetTargetForExecution,
	normalizeSetRangeTargetsForExecution
} from './programValidation';
import { assertOwnedProgramWorkout } from './programsCore';

type ProgramCtx = MutationCtx | QueryCtx;

const assertOwnedProgramWorkoutExercise = async (
	ctx: ProgramCtx,
	programWorkoutExerciseId: Id<'performances'>,
	userId: string
) => {
	const exerciseTarget = await ctx.db.get(programWorkoutExerciseId);
	if (!exerciseTarget) {
		throw new Error('Program workout exercise not found');
	}
	if (exerciseTarget.programWorkoutId === undefined || exerciseTarget.workoutId !== undefined) {
		throw new Error('Performance is not part of a program workout');
	}
	const { workout, template } = await assertOwnedProgramWorkout(
		ctx,
		exerciseTarget.programWorkoutId,
		userId
	);
	const exercise = await assertOwnedExercise(ctx, exerciseTarget.exerciseId, userId);
	return { exerciseTarget, exercise, workout, template };
};

const assertOwnedProgramWorkoutExerciseSet = async (
	ctx: ProgramCtx,
	id: Id<'programWorkoutExerciseTargets'>,
	userId: string
) => {
	const set = await ctx.db.get(id);
	if (!set) {
		throw new Error('Program workout set target not found');
	}
	const { exerciseTarget, exercise, workout, template } = await assertOwnedProgramWorkoutExercise(
		ctx,
		set.programWorkoutExerciseId,
		userId
	);
	return { set, exerciseTarget, exercise, workout, template };
};

export const list = query({
	args: {
		programWorkoutExerciseId: v.id('performances')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		await assertOwnedProgramWorkoutExercise(ctx, args.programWorkoutExerciseId, userId);
		const rows = await ctx.db
			.query('programWorkoutExerciseTargets')
			.withIndex('by_programWorkoutExerciseId_order', (q) =>
				q.eq('programWorkoutExerciseId', args.programWorkoutExerciseId)
			)
			.collect();
		return rows.toSorted((a, b) => a.targetOrder - b.targetOrder);
	}
});

export const create = mutation({
	args: {
		programWorkoutExerciseId: v.id('performances'),
		setOrder: v.optional(v.number()),
		targetSetRange: v.optional(v.string()),
		targetRepsRange: v.optional(v.string()),
		targetDuration: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		const { exerciseTarget, exercise, template } = await assertOwnedProgramWorkoutExercise(
			ctx,
			args.programWorkoutExerciseId,
			userId
		);
		const defaults = defaultSetTargetForExecution(exercise.executionType);
		const normalizedTargets = normalizeSetRangeTargetsForExecution(
			exercise.executionType,
			args.targetSetRange ?? defaults.targetSetRange,
			args.targetRepsRange ?? defaults.targetRepsRange,
			args.targetDuration ?? defaults.targetDuration
		);
		const currentRows = await ctx.db
			.query('programWorkoutExerciseTargets')
			.withIndex('by_programWorkoutExerciseId_order', (q) =>
				q.eq('programWorkoutExerciseId', exerciseTarget._id)
			)
			.collect();
		const lastRow = currentRows.length ? currentRows[currentRows.length - 1] : undefined;

		const rowId = await ctx.db.insert('programWorkoutExerciseTargets', {
			userId,
			programWorkoutExerciseId: exerciseTarget._id,
			targetOrder: args.setOrder ?? (lastRow?.targetOrder ?? -1) + 1,
			targetSetRange: normalizedTargets.targetSetRange,
			targetRepsRange: normalizedTargets.targetRepsRange,
			targetDuration: normalizedTargets.targetDuration,
			updatedAt: Date.now()
		});

		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return rowId;
	}
});

export const update = mutation({
	args: {
		id: v.id('programWorkoutExerciseTargets'),
		setOrder: v.optional(v.number()),
		targetSetRange: v.optional(v.string()),
		targetRepsRange: v.optional(v.string()),
		targetDuration: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { set, exercise, template } = await assertOwnedProgramWorkoutExerciseSet(
			ctx,
			args.id,
			userId
		);
		const normalizedTargets = normalizeSetRangeTargetsForExecution(
			exercise.executionType,
			args.targetSetRange ?? set.targetSetRange,
			args.targetRepsRange ?? set.targetRepsRange,
			args.targetDuration ?? set.targetDuration
		);
		await ctx.db.patch(set._id, {
			...(args.setOrder !== undefined && { targetOrder: args.setOrder }),
			targetSetRange: normalizedTargets.targetSetRange,
			targetRepsRange: normalizedTargets.targetRepsRange,
			targetDuration: normalizedTargets.targetDuration,
			updatedAt: Date.now()
		});
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return set._id;
	}
});

export const updateOrder = mutation({
	args: {
		updates: v.array(
			v.object({
				id: v.id('programWorkoutExerciseTargets'),
				setOrder: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		await Promise.all(
			args.updates.map(async (update) => {
				const { set, template } = await assertOwnedProgramWorkoutExerciseSet(
					ctx,
					update.id,
					userId
				);
				await ctx.db.patch(set._id, {
					targetOrder: update.setOrder,
					updatedAt: Date.now()
				});
				await ctx.db.patch(template._id, { updatedAt: Date.now() });
			})
		);

		return true;
	}
});

export const replaceAll = mutation({
	args: {
		programWorkoutExerciseId: v.id('performances'),
		sets: v.array(
			v.object({
				targetSetRange: v.optional(v.string()),
				targetRepsRange: v.optional(v.string()),
				targetDuration: v.optional(v.string())
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		if (!args.sets.length) {
			throw new Error('At least one set target is required');
		}
		const { exerciseTarget, exercise, template } = await assertOwnedProgramWorkoutExercise(
			ctx,
			args.programWorkoutExerciseId,
			userId
		);
		const defaults = defaultSetTargetForExecution(exercise.executionType);

		const existingRows = await ctx.db
			.query('programWorkoutExerciseTargets')
			.withIndex('by_programWorkoutExerciseId_order', (q) =>
				q.eq('programWorkoutExerciseId', exerciseTarget._id)
			)
			.collect();
		await Promise.all(existingRows.map(async (row) => ctx.db.delete(row._id)));

		await Promise.all(
			args.sets.map(async (set, index) => {
				const normalizedTargets = normalizeSetRangeTargetsForExecution(
					exercise.executionType,
					set.targetSetRange ?? defaults.targetSetRange,
					set.targetRepsRange ?? defaults.targetRepsRange,
					set.targetDuration ?? defaults.targetDuration
				);
				await ctx.db.insert('programWorkoutExerciseTargets', {
					userId,
					programWorkoutExerciseId: exerciseTarget._id,
					targetOrder: index,
					targetSetRange: normalizedTargets.targetSetRange,
					targetRepsRange: normalizedTargets.targetRepsRange,
					targetDuration: normalizedTargets.targetDuration,
					updatedAt: Date.now()
				});
			})
		);

		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return true;
	}
});

export const remove = mutation({
	args: {
		id: v.id('programWorkoutExerciseTargets')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { set, template } = await assertOwnedProgramWorkoutExerciseSet(ctx, args.id, userId);
		const siblingRows = await ctx.db
			.query('programWorkoutExerciseTargets')
			.withIndex('by_programWorkoutExerciseId_order', (q) =>
				q.eq('programWorkoutExerciseId', set.programWorkoutExerciseId)
			)
			.collect();
		if (siblingRows.length <= 1) {
			throw new Error('At least one set target is required');
		}
		await ctx.db.delete(set._id);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return args.id;
	}
});
