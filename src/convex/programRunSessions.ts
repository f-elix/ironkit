import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { DEFAULT_WEIGHT_UNIT } from '../lib/constants';
import {
	assertOwnedProgramRun,
	assertOwnedProgramRunSession,
	getNextOpenRunSession,
	getOrderedRunSessions,
	getProgramWorkoutWithDetails,
	recomputeRunCompletion
} from './programsCore';
import { defaultSetTargetForExecution } from './programValidation';

type ProgramCtx = MutationCtx | QueryCtx;

const buildProgramTargetsSnapshot = (
	executionType: 'reps' | 'time',
	sourceTargets: Array<{
		targetSetRange: string;
		targetRepsRange?: string;
		targetDuration?: string;
	}>,
	defaultTargets: ReturnType<typeof defaultSetTargetForExecution>
) => {
	const targets: Array<{
		targetSetRange: string;
		targetRepsRange?: string;
		targetDuration?: string;
	}> = [];
	for (const sourceTarget of sourceTargets) {
		const targetValue =
			executionType === 'reps'
				? sourceTarget.targetRepsRange?.trim()
				: sourceTarget.targetDuration?.trim();
		if (!targetValue) {
			continue;
		}
		const targetSetRange = sourceTarget.targetSetRange.trim() || defaultTargets.targetSetRange;
		targets.push({
			targetSetRange,
			targetRepsRange: executionType === 'reps' ? targetValue : undefined,
			targetDuration: executionType === 'time' ? targetValue : undefined
		});
	}

	if (targets.length) {
		return targets;
	}

	return [
		{
			targetSetRange: defaultTargets.targetSetRange,
			targetRepsRange: defaultTargets.targetRepsRange,
			targetDuration: defaultTargets.targetDuration
		}
	];
};

const getRunSessionWithDetails = async (
	ctx: ProgramCtx,
	programRunSessionId: Id<'programRunSessions'>
) => {
	const session = await ctx.db.get(programRunSessionId);
	if (!session) {
		return null;
	}
	const programWorkout = await getProgramWorkoutWithDetails(ctx, session.programWorkoutId);
	return {
		...session,
		programWorkout
	};
};

export const listByRun = query({
	args: {
		programRunId: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		await assertOwnedProgramRun(ctx, args.programRunId, userId);
		return getOrderedRunSessions(ctx, args.programRunId);
	}
});

export const getById = query({
	args: {
		id: v.id('programRunSessions')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		await assertOwnedProgramRunSession(ctx, args.id, userId);
		return getRunSessionWithDetails(ctx, args.id);
	}
});

export const startNextAsWorkout = mutation({
	args: {
		programRunId: v.id('programRuns'),
		date: v.optional(v.number()),
		title: v.optional(v.string()),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(v.union(v.literal('kg'), v.literal('lbs')))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.programRunId, userId);
		if (run.status !== 'active') {
			throw new Error('Run must be active to start a session');
		}
		const nextSession = await getNextOpenRunSession(ctx, run._id);
		if (!nextSession) {
			throw new Error('No open session available');
		}

		const sourceProgramWorkout = await getProgramWorkoutWithDetails(
			ctx,
			nextSession.programWorkoutId
		);
		if (!sourceProgramWorkout) {
			throw new Error('Program workout not found');
		}

		const title =
			args.title?.trim() ||
			sourceProgramWorkout.label ||
			`Week ${sourceProgramWorkout.weekNumber} ${sourceProgramWorkout.trackKey}`;
		const workoutId = await ctx.db.insert('workouts', {
			userId,
			title,
			date: args.date ?? Date.now(),
			notes: args.notes,
			bodyweight: args.bodyweight,
			bodyweightUnit: args.bodyweightUnit ?? DEFAULT_WEIGHT_UNIT,
			programRunId: run._id,
			programRunSessionId: nextSession._id,
			sourceProgramWorkoutId: sourceProgramWorkout._id,
			updatedAt: Date.now()
		});

		for (const sourceGroup of sourceProgramWorkout.groups.toSorted(
			(a, b) => a.workoutOrder - b.workoutOrder
		)) {
			const performanceGroupId = await ctx.db.insert('performanceGroups', {
				userId,
				workoutId,
				programWorkoutId: undefined,
				label: sourceGroup.label,
				workoutOrder: sourceGroup.workoutOrder,
				updatedAt: Date.now()
			});

			for (const sourceExercise of sourceGroup.exercises.toSorted(
				(a, b) => a.groupOrder - b.groupOrder
			)) {
				const defaultTargets = defaultSetTargetForExecution(
					sourceExercise.exercise?.executionType ?? 'reps'
				);
				const executionType = sourceExercise.exercise?.executionType ?? 'reps';
				const orderedSourceTargets = sourceExercise.exactSets
					.slice()
					.toSorted((a, b) => a.targetOrder - b.targetOrder);
				const programTargets = buildProgramTargetsSnapshot(
					executionType,
					orderedSourceTargets,
					defaultTargets
				);

				const performanceId = await ctx.db.insert('performances', {
					userId,
					performanceGroupId,
					exerciseId: sourceExercise.exerciseId,
					workoutId,
					programWorkoutId: undefined,
					groupOrder: sourceExercise.groupOrder,
					note: sourceExercise.note,
					programTargets,
					weightUnit: sourceExercise.weightUnit,
					updatedAt: Date.now()
				});

				await ctx.db.insert('performanceSets', {
					userId,
					performanceId,
					weight: undefined,
					reps: undefined,
					durationSeconds: undefined,
					note: undefined,
					performanceOrder: 0,
					updatedAt: Date.now()
				});
			}
		}

		await ctx.db.patch(nextSession._id, {
			workoutId,
			updatedAt: Date.now()
		});
		await ctx.db.patch(run._id, { updatedAt: Date.now() });
		await recomputeRunCompletion(ctx, run._id);

		return {
			workoutId,
			programRunSessionId: nextSession._id
		};
	}
});

export const skipNext = mutation({
	args: {
		programRunId: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.programRunId, userId);
		if (run.status !== 'active') {
			throw new Error('Run must be active to skip a session');
		}
		const nextSession = await getNextOpenRunSession(ctx, run._id);
		if (!nextSession) {
			throw new Error('No open session available');
		}
		await ctx.db.patch(nextSession._id, {
			skippedAt: Date.now(),
			updatedAt: Date.now()
		});
		await ctx.db.patch(run._id, { updatedAt: Date.now() });
		await recomputeRunCompletion(ctx, run._id);
		return nextSession._id;
	}
});
