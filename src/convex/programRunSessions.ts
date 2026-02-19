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

		const sourceProgramWorkout = await getProgramWorkoutWithDetails(ctx, nextSession.programWorkoutId);
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

		for (const sourceGroup of sourceProgramWorkout.groups.sort((a, b) => a.workoutOrder - b.workoutOrder)) {
			const performanceGroupId = await ctx.db.insert('performanceGroups', {
				userId,
				workoutId,
				programWorkoutId: undefined,
				label: sourceGroup.label,
				workoutOrder: sourceGroup.workoutOrder,
				updatedAt: Date.now()
			});

			for (const sourceExercise of sourceGroup.exercises.sort((a, b) => a.groupOrder - b.groupOrder)) {
				const performanceId = await ctx.db.insert('performances', {
					userId,
					performanceGroupId,
					exerciseId: sourceExercise.exerciseId,
					workoutId,
					programWorkoutId: undefined,
					groupOrder: sourceExercise.groupOrder,
					note: sourceExercise.note,
					weightUnit: sourceExercise.weightUnit,
					updatedAt: Date.now()
				});

				const defaultTargets = defaultSetTargetForExecution(
					sourceExercise.exercise?.executionType ?? 'reps'
				);
				const sourceSets = sourceExercise.exactSets.length
					? sourceExercise.exactSets
					: [
							{
								weight: undefined,
								reps: undefined,
								durationSeconds: undefined,
								programTargetReps: defaultTargets.targetReps,
								programTargetDurationSeconds: defaultTargets.targetDurationSeconds,
								note: undefined,
								performanceOrder: 0
							}
						];

				for (const sourceSet of sourceSets.sort((a, b) => a.performanceOrder - b.performanceOrder)) {
					await ctx.db.insert('performanceSets', {
						userId,
						performanceId,
						weight: sourceSet.weight,
						reps: sourceSet.reps,
						durationSeconds: sourceSet.durationSeconds,
						programTargetReps: sourceSet.programTargetReps,
						programTargetDurationSeconds: sourceSet.programTargetDurationSeconds,
						note: sourceSet.note,
						performanceOrder: sourceSet.performanceOrder,
						updatedAt: Date.now()
					});
				}
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
