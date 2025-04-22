import type { schema } from '$triplit/schema';
import type { Entity, QueryResult } from '@triplit/client';

export type CollectionName = keyof typeof schema;

export type Workout = Entity<typeof schema, 'workouts'>;
export type PerformanceGroup = Entity<typeof schema, 'performanceGroups'>;
export type Performance = Entity<typeof schema, 'performances'>;
export type Exercise = Entity<typeof schema, 'exercises'>;
export type PerformanceSet = Entity<typeof schema, 'performanceSets'>;

export type WorkoutWithRelations = QueryResult<
	typeof schema,
	{
		collectionName: 'workouts';
		include: {
			performanceGroups: {
				_extends: 'performanceGroups';
				include: {
					performances: { _extends: 'performances'; include: { exercise: true; sets: true } };
				};
			};
		};
	}
>;
