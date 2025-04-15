import { syncedObservable } from '$lib/db/syncedObservable';
import type { WeightUnit } from '$lib/types';

export type PerformanceSet = {
	id: string;
	note?: string; // for RIR, RPE, AMRAPs, etc.
	weight: number;
	unit: WeightUnit;
	reps?: number;
	durationSeconds?: number;
};

export type Performance = {
	id: string;
	exerciseId: string;
	workoutId: string;
	date: string;
	sets: PerformanceSet[];
	note?: string;
};

export type PerformanceBlock = {
	id: string;
	label?: string; // Optional name for the block, like "Superset", "Arm circuit", etc.
	performanceIds: string[];
};

export type Workout = {
	id: string;
	title: string;
	date: string;
	note?: string;
	performanceBlocks: PerformanceBlock[];
	startTime?: string;
	endTime?: string;
	templateId?: string;
};

export type MuscleGroup = {
	id: string;
	name: string;
};

export type ExecutionType = 'reps' | 'time';

export type LoadType = 'weighted' | 'bodyweight' | 'assisted';

export type Exercise = {
	id: string;
	name: string;
	muscleGroupIds: string[];
	executionType: ExecutionType;
	loadType: LoadType;
};

export type TrainingLog = {
	workouts: Workout[];
	exercises: Exercise[];
	muscleGroups: MuscleGroup[];
	performances: Performance[];
};

export const workouts$ = syncedObservable<Workout[]>('trainingLog-workouts', []);

export const performances$ = syncedObservable<Performance[]>('trainingLog-performances', []);

export const exercises$ = syncedObservable<Exercise[]>('trainingLog-exercises', []);

export const muscleGroups$ = syncedObservable<MuscleGroup[]>('trainingLog-muscleGroups', []);
