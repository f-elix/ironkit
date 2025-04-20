import { type Collection, Schema as S } from '@triplit/client';
import {
	ANON_USER_ID,
	DEFAULT_GENDER_CLASS,
	DEFAULT_WEIGHT_UNIT,
	DEFAULT_WORKOUT_TITLE,
	GENDER_CLASSES,
	WEIGHT_UNITS
} from '$lib/constants';

const baseOwnedCollectionSchema = () => ({
	id: S.Id(),
	userId: S.String({ default: ANON_USER_ID }),
	updatedAt: S.Date({ default: S.Default.now() })
});

const authenticatedOnly = () => {
	return {
		authenticated: {
			read: {
				filter: [['userId', '=', '$token.sub'] as const]
			},
			insert: {
				filter: [['userId', '=', '$token.sub'] as const]
			},
			update: {
				filter: [['userId', '=', '$token.sub'] as const]
			},
			postUpdate: {
				filter: [['userId', '=', '$token.sub'] as const]
			},
			delete: {
				filter: [['userId', '=', '$token.sub'] as const]
			}
		}
	} satisfies Collection['permissions'];
};

/**
 * Define your schema here. After:
 * - Pass your schema to your Triplit client
 * - Push your schema to your Triplit server with 'triplit schema push'
 *
 * For more information about schemas, see the docs: https://www.triplit.dev/docs/schemas
 */
export const schema = S.Collections({
	weightConverter: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			unit: S.String({ enum: WEIGHT_UNITS, default: DEFAULT_WEIGHT_UNIT }),
			round: S.Boolean({ default: false })
		}),
		permissions: authenticatedOnly()
	},
	coefficientCalculator: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			genderClass: S.String({ enum: GENDER_CLASSES, default: DEFAULT_GENDER_CLASS }),
			totalUnit: S.String({ enum: WEIGHT_UNITS, default: DEFAULT_WEIGHT_UNIT }),
			bodyweightUnit: S.String({ enum: WEIGHT_UNITS, default: DEFAULT_WEIGHT_UNIT })
		}),
		permissions: authenticatedOnly()
	},
	loadPercentageCalculator: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			unit: S.String({ enum: WEIGHT_UNITS, default: DEFAULT_WEIGHT_UNIT }),
			round: S.Boolean({ default: false })
		}),
		permissions: authenticatedOnly()
	},
	plateCalculator: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			barWeight: S.Number({ default: 20 }),
			heavyCollars: S.Boolean({ default: false }),
			allowNonStandardConfig: S.Boolean({ default: false })
		}),
		permissions: authenticatedOnly()
	},
	workouts: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			title: S.String({ default: DEFAULT_WORKOUT_TITLE }),
			date: S.Date({ default: S.Default.now() }),
			notes: S.Optional(S.String())
		}),
		relationships: {
			performanceBlocks: S.RelationMany('performanceBlocks', {
				where: [['workoutId', '=', '$id']]
			})
		},
		permissions: authenticatedOnly()
	},
	performanceBlocks: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			workoutId: S.String(),
			label: S.Optional(S.String()),
			order: S.Number()
		}),
		relationships: {
			workout: S.RelationById('workouts', '$workoutId'),
			performances: S.RelationMany('performances', {
				where: [['performanceBlockId', '=', '$id']]
			})
		},
		permissions: authenticatedOnly()
	},
	performances: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			performanceBlockId: S.String(),
			exerciseId: S.String(),
			date: S.Date(),
			note: S.Optional(S.String()),
			order: S.Number()
		}),
		relationships: {
			performanceBlock: S.RelationById('performanceBlocks', '$performanceBlockId'),
			exercise: S.RelationById('exercises', '$exerciseId'),
			sets: S.RelationMany('performanceSets', {
				where: [['performanceId', '=', '$id']]
			})
		},
		permissions: authenticatedOnly()
	},
	performanceSets: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			performanceId: S.String(),
			weight: S.Number(),
			unit: S.String({ enum: WEIGHT_UNITS, default: 'lbs' }),
			reps: S.Optional(S.Number()),
			durationSeconds: S.Optional(S.Number()),
			note: S.Optional(S.String()),
			order: S.Number()
		}),
		relationships: {
			performance: S.RelationById('performances', '$performanceId')
		},
		permissions: authenticatedOnly()
	},
	muscleGroups: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			name: S.String()
		}),
		permissions: authenticatedOnly()
	},
	exercises: {
		schema: S.Schema({
			...baseOwnedCollectionSchema(),
			muscleGroupIds: S.String(),
			name: S.String(),
			executionType: S.String({ enum: ['reps', 'time'] }),
			loadType: S.String({ enum: ['weighted', 'bodyweight', 'assisted'] })
		}),
		relationships: {
			muscleGroups: S.RelationMany('muscleGroups', {
				where: [['id', 'in', '$muscleGroupIds']]
			})
		},
		permissions: authenticatedOnly()
	}
});
