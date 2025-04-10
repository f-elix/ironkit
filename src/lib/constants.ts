export const LIFT_TYPES = ['squat', 'bench', 'deadlift'] as const;

export const WEIGHT_UNITS = ['kg', 'lbs'] as const;
export const DEFAULT_WEIGHT_UNIT = 'kg' as const;

export const GENDER_CLASSES = ['male', 'female'] as const;
export const DEFAULT_GENDER_CLASS = 'male' as const;

export const COEFFICIENT_TYPES = ['Wilks', 'Dots', 'GL'] as const;

export const PLATES = {
	kg: [25, 20, 15, 10, 5, 2.5, 1.25],
	lbs: [45, 25, 10, 5, 2.5]
};
