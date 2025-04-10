import { calculateGL } from '$lib/coefficients/calculateGL';
import type { CoefficientType, GenderClass, WeightUnit } from '$lib/types';
import { lbsToKg } from '$lib/weight-units';
import { dots, wilks } from 'powerlifting-formulas';

export const calculateCoefficient = ({
	coeffecientType,
	total,
	totalUnit,
	bodyweight,
	bodyweightUnit,
	genderClass
}: {
	coeffecientType: CoefficientType;
	total: number;
	totalUnit: WeightUnit;
	bodyweight: number;
	bodyweightUnit: WeightUnit;
	genderClass: GenderClass;
}) => {
	const bodyweightInKg = bodyweightUnit === 'kg' ? bodyweight : lbsToKg(bodyweight);
	const totalInKg = totalUnit === 'kg' ? total : lbsToKg(total);
	let coefficient = 0;
	if (coeffecientType === 'Dots') {
		coefficient = dots(bodyweightInKg, totalInKg, genderClass, 'kg');
	}
	if (coeffecientType === 'GL') {
		coefficient = calculateGL(bodyweightInKg, totalInKg, genderClass);
	}
	if (coeffecientType === 'Wilks') {
		coefficient = wilks(bodyweightInKg, totalInKg, genderClass, 'kg');
	}
	return Math.max(0, coefficient);
};
