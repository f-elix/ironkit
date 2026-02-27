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

export const normalizeSetRangeTargetsForExecution = (
	executionType: ExecutionType,
	targetSetRange?: string,
	targetRepsRange?: string,
	targetDuration?: string
) => {
	const normalizedTargetSetRange = (targetSetRange ?? '').trim() || '1';
	const normalizedTargetRepsRange = (targetRepsRange ?? '').trim();
	const normalizedTargetDuration = (targetDuration ?? '').trim();

	if (executionType === 'reps') {
		if (!normalizedTargetRepsRange) {
			throw new Error('Rep target range is required');
		}
		return {
			targetSetRange: normalizedTargetSetRange,
			targetRepsRange: normalizedTargetRepsRange,
			targetDuration: undefined
		};
	}

	if (!normalizedTargetDuration) {
		throw new Error('Duration target is required');
	}
	return {
		targetSetRange: normalizedTargetSetRange,
		targetRepsRange: undefined,
		targetDuration: normalizedTargetDuration
	};
};

export const defaultSetTargetForExecution = (executionType: ExecutionType) => {
	return executionType === 'reps'
		? {
				targetSetRange: '1',
				targetRepsRange: undefined,
				targetDuration: undefined
			}
		: {
				targetSetRange: '1',
				targetRepsRange: undefined,
				targetDuration: undefined
			};
};
