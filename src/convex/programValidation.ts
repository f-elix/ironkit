import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

type ProgramCtx = MutationCtx | QueryCtx;
type ExecutionType = 'reps' | 'time';

export const assertOwnedExercise = async (
	ctx: ProgramCtx,
	exerciseId: Id<'exercises'>,
	userId: string
) => {
	const exercise = await ctx.db.get(exerciseId);
	if (!exercise || exercise.userId !== userId) {
		throw new Error('Exercise not found');
	}
	return exercise;
};

export const normalizePositiveInteger = (value: number, fieldName: string) => {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${fieldName} must be greater than 0`);
	}
	return Math.max(1, Math.floor(value));
};

export const normalizeSetTargetForExecution = (
	executionType: ExecutionType,
	targetReps?: number,
	targetDurationSeconds?: number
) => {
	if (executionType === 'reps') {
		if (targetDurationSeconds !== undefined) {
			throw new Error('Duration target is not allowed for rep-based exercises');
		}
		if (targetReps == null) {
			throw new Error('Reps target is required for rep-based exercises');
		}
		return {
			targetReps: normalizePositiveInteger(targetReps, 'Reps target'),
			targetDurationSeconds: undefined
		};
	}

	if (targetReps !== undefined) {
		throw new Error('Reps target is not allowed for time-based exercises');
	}
	if (targetDurationSeconds == null) {
		throw new Error('Duration target is required for time-based exercises');
	}
	return {
		targetReps: undefined,
		targetDurationSeconds: normalizePositiveInteger(targetDurationSeconds, 'Duration target')
	};
};

export const defaultSetTargetForExecution = (executionType: ExecutionType) => {
	return executionType === 'reps'
		? {
				targetReps: 8,
				targetDurationSeconds: undefined
			}
		: {
				targetReps: undefined,
				targetDurationSeconds: 60
			};
};
