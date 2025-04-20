import { GENDER_CLASSES, WEIGHT_UNITS, COEFFICIENT_TYPES } from '$lib/constants';

export type WeightUnit = (typeof WEIGHT_UNITS)[number];

export type GenderClass = (typeof GENDER_CLASSES)[number];

export type CoefficientType = (typeof COEFFICIENT_TYPES)[number];
