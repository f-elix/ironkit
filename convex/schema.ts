import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

// Weight units: 'kg' | 'lbs'
// Gender classes: 'male' | 'female'
// Exercise load types: 'weighted' | 'bodyweight' | 'assisted'
// Exercise execution types: 'reps' | 'time'

export default defineSchema({
	...authTables,

	weightConverter: defineTable({
		userId: v.id('users'),
		unit: v.string(), // 'kg' | 'lbs'
		round: v.boolean(),
		updatedAt: v.number()
	}).index('by_userId', ['userId']),

	coefficientCalculator: defineTable({
		userId: v.id('users'),
		genderClass: v.string(), // 'male' | 'female'
		totalUnit: v.string(), // 'kg' | 'lbs'
		bodyweightUnit: v.string(), // 'kg' | 'lbs'
		updatedAt: v.number()
	}).index('by_userId', ['userId']),

	loadPercentageCalculator: defineTable({
		userId: v.id('users'),
		unit: v.string(), // 'kg' | 'lbs'
		round: v.boolean(),
		updatedAt: v.number()
	}).index('by_userId', ['userId']),

	plateCalculator: defineTable({
		userId: v.id('users'),
		barWeight: v.number(),
		heavyCollars: v.boolean(),
		allowNonStandardConfig: v.boolean(),
		updatedAt: v.number()
	}).index('by_userId', ['userId']),

	exercises: defineTable({
		userId: v.id('users'),
		name: v.string(),
		executionType: v.string(), // 'reps' | 'time'
		loadType: v.string(), // 'weighted' | 'bodyweight' | 'assisted'
		muscleGroups: v.array(v.string()),
		updatedAt: v.number()
	}).index('by_userId', ['userId']),

	workouts: defineTable({
		userId: v.id('users'),
		title: v.string(),
		date: v.number(), // timestamp
		notes: v.optional(v.string()),
		bodyweight: v.optional(v.number()),
		bodyweightUnit: v.optional(v.string()), // 'kg' | 'lbs'
		updatedAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_userId_date', ['userId', 'date']),

	performanceGroups: defineTable({
		userId: v.id('users'),
		workoutId: v.id('workouts'),
		label: v.optional(v.string()),
		workoutOrder: v.number(),
		updatedAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_workoutId', ['workoutId'])
		.index('by_workoutId_order', ['workoutId', 'workoutOrder']),

	performances: defineTable({
		userId: v.id('users'),
		performanceGroupId: v.id('performanceGroups'),
		exerciseId: v.id('exercises'),
		workoutId: v.id('workouts'),
		groupOrder: v.number(),
		note: v.optional(v.string()),
		weightUnit: v.string(), // 'kg' | 'lbs'
		updatedAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_performanceGroupId', ['performanceGroupId'])
		.index('by_exerciseId', ['exerciseId'])
		.index('by_workoutId', ['workoutId']),

	performanceSets: defineTable({
		userId: v.id('users'),
		performanceId: v.id('performances'),
		weight: v.optional(v.number()),
		reps: v.optional(v.number()),
		durationSeconds: v.optional(v.number()),
		note: v.optional(v.string()),
		performanceOrder: v.number(),
		updatedAt: v.number()
	})
		.index('by_userId', ['userId'])
		.index('by_performanceId', ['performanceId'])
		.index('by_performanceId_order', ['performanceId', 'performanceOrder'])
});
