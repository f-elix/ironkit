import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { assertOwnedExercise, normalizeSetTargetForExecution } from './programValidation';
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
	id: Id<'performanceSets'>,
	userId: string
) => {
	const set = await ctx.db.get(id);
	if (!set) {
		throw new Error('Program workout set target not found');
	}
	const { exerciseTarget, exercise, workout, template } = await assertOwnedProgramWorkoutExercise(
		ctx,
		set.performanceId,
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
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) =>
				q.eq('performanceId', args.programWorkoutExerciseId)
			)
			.collect();
		return rows.sort((a, b) => a.performanceOrder - b.performanceOrder);
	}
});

export const create = mutation({
	args: {
		programWorkoutExerciseId: v.id('performances'),
		setOrder: v.optional(v.number()),
		targetReps: v.optional(v.number()),
		targetDurationSeconds: v.optional(v.number())
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
		const normalizedTargets = normalizeSetTargetForExecution(
			exercise.executionType,
			args.targetReps,
			args.targetDurationSeconds
		);
		const currentRows = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exerciseTarget._id))
			.collect();
		const lastRow = currentRows.length ? currentRows[currentRows.length - 1] : undefined;

		const rowId = await ctx.db.insert('performanceSets', {
			userId,
			performanceId: exerciseTarget._id,
			performanceOrder: args.setOrder ?? (lastRow?.performanceOrder ?? -1) + 1,
			programTargetReps: normalizedTargets.targetReps,
			programTargetDurationSeconds: normalizedTargets.targetDurationSeconds,
			updatedAt: Date.now()
		});

		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return rowId;
	}
});

export const update = mutation({
	args: {
		id: v.id('performanceSets'),
		setOrder: v.optional(v.number()),
		targetReps: v.optional(v.number()),
		targetDurationSeconds: v.optional(v.number())
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
		const normalizedTargets = normalizeSetTargetForExecution(
			exercise.executionType,
			args.targetReps ?? set.programTargetReps,
			args.targetDurationSeconds ?? set.programTargetDurationSeconds
		);
		await ctx.db.patch(set._id, {
			...(args.setOrder !== undefined && { performanceOrder: args.setOrder }),
			programTargetReps: normalizedTargets.targetReps,
			programTargetDurationSeconds: normalizedTargets.targetDurationSeconds,
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
				id: v.id('performanceSets'),
				setOrder: v.number()
			})
		)
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		for (const update of args.updates) {
			const { set, template } = await assertOwnedProgramWorkoutExerciseSet(ctx, update.id, userId);
			await ctx.db.patch(set._id, {
				performanceOrder: update.setOrder,
				updatedAt: Date.now()
			});
			await ctx.db.patch(template._id, { updatedAt: Date.now() });
		}

		return true;
	}
});

export const replaceAll = mutation({
	args: {
		programWorkoutExerciseId: v.id('performances'),
		sets: v.array(
			v.object({
				targetReps: v.optional(v.number()),
				targetDurationSeconds: v.optional(v.number())
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

		const existingRows = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exerciseTarget._id))
			.collect();
		for (const row of existingRows) {
			await ctx.db.delete(row._id);
		}

		for (const [index, set] of args.sets.entries()) {
			const normalizedTargets = normalizeSetTargetForExecution(
				exercise.executionType,
				set.targetReps,
				set.targetDurationSeconds
			);
			await ctx.db.insert('performanceSets', {
				userId,
				performanceId: exerciseTarget._id,
				performanceOrder: index,
				programTargetReps: normalizedTargets.targetReps,
				programTargetDurationSeconds: normalizedTargets.targetDurationSeconds,
				updatedAt: Date.now()
			});
		}

		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return true;
	}
});

export const remove = mutation({
	args: {
		id: v.id('performanceSets')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { set, template } = await assertOwnedProgramWorkoutExerciseSet(ctx, args.id, userId);
		const siblingRows = await ctx.db
			.query('performanceSets')
			.withIndex('by_performanceId_order', (q) => q.eq('performanceId', set.performanceId))
			.collect();
		if (siblingRows.length <= 1) {
			throw new Error('At least one set target is required');
		}
		await ctx.db.delete(set._id);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return args.id;
	}
});
