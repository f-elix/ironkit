import { getAuthUserId } from '@convex-dev/auth/server';
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';
import { assertOwnedProgramWorkout } from './programsCore';

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
		const groups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_programWorkoutId_order', (q) =>
				q.eq('programWorkoutId', args.programWorkoutId)
			)
			.collect();
		return groups.toSorted((a, b) => a.workoutOrder - b.workoutOrder);
	}
});

export const create = mutation({
	args: {
		programWorkoutId: v.id('programWorkouts'),
		workoutOrder: v.optional(v.number()),
		label: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { workout, template } = await assertOwnedProgramWorkout(
			ctx,
			args.programWorkoutId,
			userId
		);
		const groups = await ctx.db
			.query('performanceGroups')
			.withIndex('by_programWorkoutId_order', (q) => q.eq('programWorkoutId', workout._id))
			.collect();
		const lastGroup = groups.length ? groups[groups.length - 1] : undefined;
		const workoutOrder = args.workoutOrder ?? (lastGroup?.workoutOrder ?? -1) + 1;
		const groupId = await ctx.db.insert('performanceGroups', {
			userId,
			workoutId: undefined,
			programWorkoutId: workout._id,
			workoutOrder,
			label: args.label,
			updatedAt: Date.now()
		});
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return groupId;
	}
});

export const update = mutation({
	args: {
		id: v.id('performanceGroups'),
		workoutOrder: v.optional(v.number()),
		label: v.optional(v.string())
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { group, template } = await assertOwnedProgramWorkoutGroup(ctx, args.id, userId);
		await ctx.db.patch(group._id, {
			...(args.workoutOrder !== undefined && { workoutOrder: args.workoutOrder }),
			...(args.label !== undefined && { label: args.label }),
			updatedAt: Date.now()
		});
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return group._id;
	}
});

export const updateOrder = mutation({
	args: {
		updates: v.array(
			v.object({
				id: v.id('performanceGroups'),
				workoutOrder: v.number()
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
				const { group, template } = await assertOwnedProgramWorkoutGroup(ctx, update.id, userId);
				await ctx.db.patch(group._id, {
					workoutOrder: update.workoutOrder,
					updatedAt: Date.now()
				});
				await ctx.db.patch(template._id, { updatedAt: Date.now() });
			})
		);

		return true;
	}
});

export const remove = mutation({
	args: {
		id: v.id('performanceGroups')
	},
	handler: async (ctx, args) => {
		const userId = await getAuthUserId(ctx);
		if (!userId) {
			throw new Error('Not authenticated');
		}
		const { group, template } = await assertOwnedProgramWorkoutGroup(ctx, args.id, userId);
		const exercises = await ctx.db
			.query('performances')
			.withIndex('by_performanceGroupId', (q) => q.eq('performanceGroupId', group._id))
			.collect();
		await Promise.all(
			exercises
				.filter((row) => row.programWorkoutId === group.programWorkoutId)
				.map(async (exercise) => {
					const targets = await ctx.db
						.query('programWorkoutExerciseTargets')
						.withIndex('by_programWorkoutExerciseId', (q) =>
							q.eq('programWorkoutExerciseId', exercise._id)
						)
						.collect();
					await Promise.all(targets.map(async (target) => ctx.db.delete(target._id)));

					// Legacy cleanup: old templates may still have target rows in performanceSets.
					const sets = await ctx.db
						.query('performanceSets')
						.withIndex('by_performanceId_order', (q) => q.eq('performanceId', exercise._id))
						.collect();
					await Promise.all(sets.map(async (set) => ctx.db.delete(set._id)));
					await ctx.db.delete(exercise._id);
				})
		);
		await ctx.db.delete(group._id);
		await ctx.db.patch(template._id, { updatedAt: Date.now() });
		return args.id;
	}
});
