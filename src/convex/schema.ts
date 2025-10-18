import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// Weight units: 'kg' | 'lbs'
// Gender classes: 'male' | 'female'
// Exercise load types: 'weighted' | 'bodyweight' | 'assisted'
// Exercise execution types: 'reps' | 'time'

export const weightUnit = v.union(v.literal('kg'), v.literal('lbs'));

export const genderClass = v.union(v.literal('male'), v.literal('female'));

export const exerciseLoadType = v.union(
	v.literal('weighted'),
	v.literal('bodyweight'),
	v.literal('assisted')
);

export const exerciseExecutionType = v.union(v.literal('reps'), v.literal('time'));

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
	}).index('by_userId', ['userId']),

	workouts: defineTable({
		...baseSchema(),
		title: v.string(),
		date: v.number(),
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(weightUnit)
	})
		.index('by_userId', ['userId'])
		.index('by_userId_date', ['userId', 'date']),

	performanceGroups: defineTable({
		...baseSchema(),
		workoutId: v.id('workouts'),
		label: v.optional(v.string()),
		workoutOrder: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_workoutId', ['workoutId'])
		.index('by_workoutId_order', ['workoutId', 'workoutOrder']),

	performances: defineTable({
		...baseSchema(),
		performanceGroupId: v.id('performanceGroups'),
		exerciseId: v.id('exercises'),
		workoutId: v.id('workouts'),
		groupOrder: v.number(),
		note: v.optional(v.string()),
		weightUnit: weightUnit
	})
		.index('by_userId', ['userId'])
		.index('by_performanceGroupId', ['performanceGroupId'])
		.index('by_exerciseId', ['exerciseId'])
		.index('by_workoutId', ['workoutId']),

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
		.index('by_performanceId_order', ['performanceId', 'performanceOrder'])
});
