import type { schema } from '$triplit/schema';
import type { Entity } from '@triplit/client';

export type CollectionName = keyof typeof schema;

export type Workout = Entity<typeof schema, 'workouts'>;
