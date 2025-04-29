export const APP_TITLE = 'Ironkit';

export const TIMEZONE = 'America/New_York';

export const ANON_USER_ID = 'anon' as const;

export const DEFAULT_WORKOUT_TITLE = 'Untitled workout';

export const LIFT_TYPES = ['squat', 'bench', 'deadlift'] as const;

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export const DEFAULT_WEIGHT_UNIT = 'kg' as const;

export const GENDER_CLASSES = ['male', 'female'] as const;
export const DEFAULT_GENDER_CLASS = 'male' as const;

export const COEFFICIENT_TYPES = ['Wilks', 'Dots', 'GL'] as const;

export const EXERCISE_LOAD_TYPES = ['weighted', 'bodyweight'] as const;
export const DEFAULT_EXERCISE_LOAD_TYPE = 'weighted' as const;

export const EXERCISE_EXECUTION_TYPES = ['reps', 'time'] as const;
export const DEFAULT_EXERCISE_EXECUTION_TYPE = 'reps' as const;

export const PLATES = {
	kg: [25, 20, 15, 10, 5, 2.5, 1.25],
	lbs: [45, 25, 10, 5, 2.5]
};
