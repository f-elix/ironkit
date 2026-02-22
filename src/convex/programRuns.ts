import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import {
	assertOwnedProgramRun,
	assertOwnedProgramTemplate,
	ensureNoOtherActiveRun,
	getNextOpenRunSession,
	getOrderedRunSessions,
	getProgramWorkoutWithDetails
} from './programsCore';

export const listRuns = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return [];
		}
		const runs = await ctx.db
			.query('programRuns')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.collect();
		return runs.toSorted((a, b) => b.startedAt - a.startedAt);
	}
});

export const getById = query({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		const template = await ctx.db.get(run.programTemplateId);
		const sessions = await getOrderedRunSessions(ctx, run._id);

		const sessionsWithDetails = await Promise.all(
			sessions.map(async (session) => {
				const programWorkout = await ctx.db.get(session.programWorkoutId);
				const workout = session.workoutId ? await ctx.db.get(session.workoutId) : null;
				return {
					...session,
					programWorkout: programWorkout
						? {
								weekNumber: programWorkout.weekNumber,
								slotOrder: programWorkout.slotOrder,
								trackKey: programWorkout.trackKey,
								label: programWorkout.label
							}
						: null,
					workout: workout
						? {
								_id: workout._id,
								title: workout.title,
								date: workout.date
							}
						: null
				};
			})
		);

		return {
			...run,
			template,
			sessions: sessionsWithDetails
		};
	}
});

export const getActiveRun = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const activeRun = await ctx.db
			.query('programRuns')
			.withIndex('by_userId_status', (q) => q.eq('userId', userId).eq('status', 'active'))
			.first();
		if (!activeRun) {
			return null;
		}
		const nextSession = await getNextOpenRunSession(ctx, activeRun._id);
		return {
			...activeRun,
			nextSession
		};
	}
});

export const getActiveRunWithDetails = query({
	args: {},
	handler: async (ctx) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		const activeRun = await ctx.db
			.query('programRuns')
			.withIndex('by_userId', (q) => q.eq('userId', userId))
			.filter((q) => q.or(q.eq(q.field('status'), 'active'), q.eq(q.field('status'), 'paused')))
			.first();
		if (!activeRun) {
			return null;
		}

		const template = await ctx.db.get(activeRun.programTemplateId);
		if (!template) {
			return null;
		}

		const sessions = await ctx.db
			.query('programRunSessions')
			.withIndex('by_programRunId', (q) => q.eq('programRunId', activeRun._id))
			.collect();

		const completedSessions = sessions.filter((s) => s.workoutId || s.skippedAt).length;
		const totalSessions = sessions.length;

		const nextSession = await getNextOpenRunSession(ctx, activeRun._id);
		let nextSessionDetails = null;
		if (nextSession) {
			const programWorkout = await ctx.db.get(nextSession.programWorkoutId);
			if (programWorkout) {
				nextSessionDetails = {
					weekNumber: programWorkout.weekNumber,
					label: programWorkout.label,
					trackKey: programWorkout.trackKey
				};
			}
		}

		return {
			run: activeRun,
			template,
			nextSession: nextSession
				? {
						...nextSession,
						...nextSessionDetails
					}
				: null,
			totalSessions,
			completedSessions
		};
	}
});

export const getNextPlannedSession = query({
	args: {
		programRunId: v.optional(v.id('programRuns'))
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			return null;
		}
		let runId = args.programRunId;
		if (!runId) {
			const activeRun = await ctx.db
				.query('programRuns')
				.withIndex('by_userId_status', (q) => q.eq('userId', userId).eq('status', 'active'))
				.first();
			if (!activeRun) {
				return null;
			}
			runId = activeRun._id;
		}
		await assertOwnedProgramRun(ctx, runId, userId);
		const session = await getNextOpenRunSession(ctx, runId);
		if (!session) {
			return null;
		}
		const programWorkout = await getProgramWorkoutWithDetails(ctx, session.programWorkoutId);
		return {
			...session,
			programWorkout
		};
	}
});

export const activateTemplate = mutation({
	args: {
		programTemplateId: v.id('programTemplates')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}

		await ensureNoOtherActiveRun(ctx, userId);

		const template = await assertOwnedProgramTemplate(ctx, args.programTemplateId, userId);
		const programWorkouts = await ctx.db
			.query('programWorkouts')
			.withIndex('by_programTemplateId', (q) => q.eq('programTemplateId', template._id))
			.collect();
		const orderedProgramWorkouts = programWorkouts.toSorted(
			(a, b) => a.weekNumber - b.weekNumber || a.slotOrder - b.slotOrder
		);
		if (!orderedProgramWorkouts.length) {
			throw new Error('Cannot activate template without workouts');
		}

		const runId = await ctx.db.insert('programRuns', {
			userId,
			programTemplateId: template._id,
			status: 'active',
			startedAt: Date.now(),
			updatedAt: Date.now()
		});

		await Promise.all(
			orderedProgramWorkouts.map(async (programWorkout) =>
				ctx.db.insert('programRunSessions', {
					userId,
					programRunId: runId,
					programWorkoutId: programWorkout._id,
					workoutId: undefined,
					skippedAt: undefined,
					updatedAt: Date.now()
				})
			)
		);

		return runId;
	}
});

export const pauseRun = mutation({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		if (run.status !== 'active') {
			throw new Error('Only active runs can be paused');
		}
		await ctx.db.patch(run._id, {
			status: 'paused',
			updatedAt: Date.now()
		});
		return run._id;
	}
});

export const resumeRun = mutation({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		if (run.status !== 'paused') {
			throw new Error('Only paused runs can be resumed');
		}
		await ensureNoOtherActiveRun(ctx, userId, run._id);
		await ctx.db.patch(run._id, {
			status: 'active',
			endedAt: undefined,
			updatedAt: Date.now()
		});
		return run._id;
	}
});

export const cancelRun = mutation({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		if (run.status !== 'active' && run.status !== 'paused') {
			throw new Error('Only active or paused runs can be canceled');
		}
		await ctx.db.patch(run._id, {
			status: 'canceled',
			endedAt: Date.now(),
			updatedAt: Date.now()
		});
		return run._id;
	}
});

export const archiveRun = mutation({
	args: {
		id: v.id('programRuns')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const run = await assertOwnedProgramRun(ctx, args.id, userId);
		if (run.status === 'active') {
			throw new Error('Pause or cancel an active run before archiving');
		}
		await ctx.db.patch(run._id, {
			status: 'archived',
			endedAt: run.endedAt ?? Date.now(),
			updatedAt: Date.now()
		});
		return run._id;
	}
});
