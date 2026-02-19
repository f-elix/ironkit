import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

type ProgramCtx = MutationCtx | QueryCtx;

const assertExactlyOneParent = (
	workoutId?: Id<'workouts'>,
	programWorkoutId?: Id<'programWorkouts'>
) => {
	const hasWorkoutParent = workoutId !== undefined;
	const hasProgramWorkoutParent = programWorkoutId !== undefined;
	if (hasWorkoutParent === hasProgramWorkoutParent) {
		throw new Error('Invalid parent context');
	}
};

export const getSingleActiveRun = async (ctx: ProgramCtx, userId: string) => {
	return ctx.db
		.query('programRuns')
		.withIndex('by_userId_status', (q) => q.eq('userId', userId).eq('status', 'active'))
		.first();
};

export const ensureNoOtherActiveRun = async (
	ctx: ProgramCtx,
	userId: string,
	excludeRunId?: Id<'programRuns'>
) => {
	const activeRun = await getSingleActiveRun(ctx, userId);
	if (activeRun && activeRun._id !== excludeRunId) {
		throw new Error('Another active run already exists');
	}
};

export const getOrderedRunSessions = async (ctx: ProgramCtx, programRunId: Id<'programRuns'>) => {
	const sessions = await ctx.db
		.query('programRunSessions')
		.withIndex('by_programRunId', (q) => q.eq('programRunId', programRunId))
		.collect();
	const sessionsWithOrder = await Promise.all(
		sessions.map(async (session) => ({
			session,
			programWorkout: await ctx.db.get(session.programWorkoutId)
		}))
	);
	return sessionsWithOrder
		.sort((a, b) => {
			const aWeek = a.programWorkout?.weekNumber ?? Number.MAX_SAFE_INTEGER;
			const bWeek = b.programWorkout?.weekNumber ?? Number.MAX_SAFE_INTEGER;
			if (aWeek !== bWeek) {
				return aWeek - bWeek;
			}
			const aSlot = a.programWorkout?.slotOrder ?? Number.MAX_SAFE_INTEGER;
			const bSlot = b.programWorkout?.slotOrder ?? Number.MAX_SAFE_INTEGER;
			if (aSlot !== bSlot) {
				return aSlot - bSlot;
			}
			return a.session._creationTime - b.session._creationTime;
		})
		.map((item) => item.session);
};

export const getNextOpenRunSession = async (ctx: ProgramCtx, programRunId: Id<'programRuns'>) => {
	const sessions = await getOrderedRunSessions(ctx, programRunId);
	return (
		sessions.find(
			(session) => session.workoutId === undefined && session.skippedAt === undefined
		) ?? null
	);
};

export const recomputeRunCompletion = async (ctx: MutationCtx, programRunId: Id<'programRuns'>) => {
	const run = await ctx.db.get(programRunId);
	if (!run) {
		return;
	}
	if (run.status === 'canceled' || run.status === 'archived') {
		return;
	}

	const nextOpenSession = await getNextOpenRunSession(ctx, programRunId);
	if (!nextOpenSession && run.status !== 'completed') {
		await ctx.db.patch(programRunId, {
			status: 'completed',
			endedAt: Date.now(),
			updatedAt: Date.now()
		});
	}
};

export const assertOwnedProgramTemplate = async (
	ctx: ProgramCtx,
	programTemplateId: Id<'programTemplates'>,
	userId: string
) => {
	const template = await ctx.db.get(programTemplateId);
	if (!template || template.userId !== userId) {
		throw new Error('Program template not found');
	}
	return template;
};

export const assertOwnedProgramWorkout = async (
	ctx: ProgramCtx,
	programWorkoutId: Id<'programWorkouts'>,
	userId: string
) => {
	const workout = await ctx.db.get(programWorkoutId);
	if (!workout) {
		throw new Error('Program workout not found');
	}
	const template = await assertOwnedProgramTemplate(ctx, workout.programTemplateId, userId);
	return { workout, template };
};

export const assertOwnedProgramRun = async (
	ctx: ProgramCtx,
	programRunId: Id<'programRuns'>,
	userId: string
) => {
	const run = await ctx.db.get(programRunId);
	if (!run || run.userId !== userId) {
		throw new Error('Program run not found');
	}
	return run;
};

export const assertOwnedProgramRunSession = async (
	ctx: ProgramCtx,
	programRunSessionId: Id<'programRunSessions'>,
	userId: string
) => {
	const session = await ctx.db.get(programRunSessionId);
	if (!session) {
		throw new Error('Program run session not found');
	}
	const run = await assertOwnedProgramRun(ctx, session.programRunId, userId);
	return { session, run };
};

export const getProgramWorkoutWithDetails = async (
	ctx: ProgramCtx,
	programWorkoutId: Id<'programWorkouts'>
) => {
	const workout = await ctx.db.get(programWorkoutId);
	if (!workout) {
		return null;
	}

	const groups = await ctx.db
		.query('performanceGroups')
		.withIndex('by_programWorkoutId_order', (q) => q.eq('programWorkoutId', programWorkoutId))
		.collect();

	const groupsWithExercises = await Promise.all(
		groups
			.sort((a, b) => a.workoutOrder - b.workoutOrder)
			.map(async (group) => {
				assertExactlyOneParent(group.workoutId, group.programWorkoutId);
				if (group.programWorkoutId !== programWorkoutId) {
					throw new Error('Group parent mismatch');
				}

				const performances = await ctx.db
					.query('performances')
					.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
					.collect();

				const exercisesWithDetails = await Promise.all(
					performances
						.filter((item) => item.programWorkoutId === programWorkoutId)
						.sort((a, b) => a.groupOrder - b.groupOrder)
						.map(async (item) => {
							assertExactlyOneParent(item.workoutId, item.programWorkoutId);
							if (item.programWorkoutId !== programWorkoutId) {
								throw new Error('Exercise parent mismatch');
							}
							const sets = await ctx.db
								.query('performanceSets')
								.withIndex('by_performanceId_order', (q) => q.eq('performanceId', item._id))
								.collect();
							return {
								...item,
								exercise: await ctx.db.get(item.exerciseId),
								exactSets: sets.sort((a, b) => a.performanceOrder - b.performanceOrder)
							};
						})
				);

				return {
					...group,
					exercises: exercisesWithDetails
				};
			})
	);

	return {
		...workout,
		groups: groupsWithExercises
	};
};
