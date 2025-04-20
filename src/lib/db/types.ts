import type { schema } from '$triplit/schema';
import type { Entity } from '@triplit/client';

export type CollectionName = keyof typeof schema;

export type Workout = Entity<typeof schema, 'workouts'>;
export type PerformanceBlock = Entity<typeof schema, 'performanceBlocks'>;
export type Performance = Entity<typeof schema, 'performances'>;
export type Exercise = Entity<typeof schema, 'exercises'>;
export type MuscleGroup = Entity<typeof schema, 'muscleGroups'>;
