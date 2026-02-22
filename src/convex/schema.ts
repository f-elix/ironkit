import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const weightUnit = v.union(v.literal('kg'), v.literal('lbs'));

export const genderClass = v.union(v.literal('male'), v.literal('female'));

export const exerciseLoadType = v.union(
	v.literal('weighted'),
	v.literal('bodyweight'),
	v.literal('assisted')
);

export const exerciseExecutionType = v.union(v.literal('reps'), v.literal('time'));

export const programTemplateStatus = v.union(v.literal('draft'), v.literal('archived'));

export const programRunStatus = v.union(
	v.literal('active'),
	v.literal('paused'),
	v.literal('completed'),
	v.literal('canceled'),
	v.literal('archived')
);

const baseSchema = () => ({
	userId: v.string(),
	updatedAt: v.number()
});

export default defineSchema({
	weightConverter: defineTable({
		...baseSchema(),
		unit: weightUnit,
		round: v.boolean()
	}).index('by_userId', ['userId']),

	coefficientCalculator: defineTable({
		...baseSchema(),
		genderClass: genderClass,
		totalUnit: weightUnit,
		bodyweightUnit: weightUnit
	}).index('by_userId', ['userId']),

	loadPercentageCalculator: defineTable({
		...baseSchema(),
		unit: weightUnit,
		round: v.boolean()
	}).index('by_userId', ['userId']),

	plateCalculator: defineTable({
		...baseSchema(),
		barWeight: v.number(),
		heavyCollars: v.boolean(),
		allowNonStandardConfig: v.boolean()
	}).index('by_userId', ['userId']),

	exercises: defineTable({
		...baseSchema(),
		name: v.string(),
		executionType: exerciseExecutionType,
		loadType: exerciseLoadType,
		muscleGroups: v.array(v.string())
	}).index('by_userId_name', ['userId', 'name']),

	workouts: defineTable({
		...baseSchema(),
		title: v.string(),
		date: v.number(),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(weightUnit),
		programRunId: v.optional(v.id('programRuns')),
		programRunSessionId: v.optional(v.id('programRunSessions')),
		sourceProgramWorkoutId: v.optional(v.id('programWorkouts'))
	})
		.index('by_userId', ['userId'])
		.index('by_userId_date', ['userId', 'date']),

	performanceGroups: defineTable({
		...baseSchema(),
		workoutId: v.optional(v.id('workouts')),
		programWorkoutId: v.optional(v.id('programWorkouts')),
		label: v.optional(v.string()),
		workoutOrder: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_workoutId', ['workoutId'])
		.index('by_workoutId_order', ['workoutId', 'workoutOrder'])
		.index('by_programWorkoutId', ['programWorkoutId'])
		.index('by_programWorkoutId_order', ['programWorkoutId', 'workoutOrder']),

	performances: defineTable({
		...baseSchema(),
		performanceGroupId: v.id('performanceGroups'),
		exerciseId: v.id('exercises'),
		workoutId: v.optional(v.id('workouts')),
		programWorkoutId: v.optional(v.id('programWorkouts')),
		groupOrder: v.number(),
		note: v.optional(v.string()),
		programTargets: v.optional(
			v.array(
				v.object({
					targetSetRange: v.string(),
					targetRepsRange: v.optional(v.string()),
					targetDuration: v.optional(v.string())
				})
			)
		),
		weightUnit: weightUnit
	})
		.index('by_userId', ['userId'])
		.index('by_performanceGroupId', ['performanceGroupId'])
		.index('by_exerciseId', ['exerciseId'])
		.index('by_workoutId', ['workoutId'])
		.index('by_programWorkoutId', ['programWorkoutId']),

	performanceSets: defineTable({
		...baseSchema(),
		performanceId: v.id('performances'),
		weight: v.optional(v.number()),
		reps: v.optional(v.number()),
		durationSeconds: v.optional(v.number()),
		note: v.optional(v.string()),
		performanceOrder: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_performanceId', ['performanceId'])
		.index('by_performanceId_order', ['performanceId', 'performanceOrder']),

	programWorkoutExerciseTargets: defineTable({
		...baseSchema(),
		programWorkoutExerciseId: v.id('performances'),
		targetSetRange: v.string(),
		targetRepsRange: v.optional(v.string()),
		targetDuration: v.optional(v.string()),
		targetOrder: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_programWorkoutExerciseId', ['programWorkoutExerciseId'])
		.index('by_programWorkoutExerciseId_order', ['programWorkoutExerciseId', 'targetOrder']),

	programTemplates: defineTable({
		...baseSchema(),
		name: v.string(),
		notes: v.optional(v.string()),
		totalWeeks: v.number(),
		status: programTemplateStatus
	})
		.index('by_userId', ['userId'])
		.index('by_userId_status', ['userId', 'status']),

	programWorkouts: defineTable({
		...baseSchema(),
		programTemplateId: v.id('programTemplates'),
		weekNumber: v.number(),
		slotOrder: v.number(),
		trackKey: v.string(),
		label: v.optional(v.string()),
		notes: v.optional(v.string())
	})
		.index('by_programTemplateId', ['programTemplateId'])
		.index('by_programTemplateId_week_slot', ['programTemplateId', 'weekNumber', 'slotOrder'])
		.index('by_programTemplateId_track_week', ['programTemplateId', 'trackKey', 'weekNumber']),

	programRuns: defineTable({
		...baseSchema(),
		programTemplateId: v.id('programTemplates'),
		status: programRunStatus,
		startedAt: v.number(),
		endedAt: v.optional(v.number())
	})
		.index('by_userId', ['userId'])
		.index('by_userId_status', ['userId', 'status'])
		.index('by_userId_startedAt', ['userId', 'startedAt'])
		.index('by_programTemplateId', ['programTemplateId']),

	programRunSessions: defineTable({
		...baseSchema(),
		programRunId: v.id('programRuns'),
		programWorkoutId: v.id('programWorkouts'),
		workoutId: v.optional(v.id('workouts')),
		skippedAt: v.optional(v.number())
	})
		.index('by_programRunId', ['programRunId'])
		.index('by_workoutId', ['workoutId'])
		.index('by_programWorkoutId', ['programWorkoutId'])
});
