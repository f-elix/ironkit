// Round to 1 decimal place
const round = (value: number) => Math.floor(value);

export const calculateOneRepMax = (weight: Maybe<number>, reps: Maybe<number>) => {
	const result = {
		epley: 0,
		brzycki: 0,
		lombardi: 0,
		mcglothin: 0,
		mayhew: 0,
		wathan: 0,
		average: 0,
		min: 0,
		max: 0
	};

	if (!weight || !reps) {
		return result;
	}

	result.epley = round(weight * (1 + reps / 30));
	result.brzycki = round(weight * (36 / (37 - reps)));
	result.lombardi = round(weight * reps ** 0.1);
	result.mcglothin = round((100 * weight) / (101.3 - 2.67123 * reps));
	result.mayhew = round((100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)));
	result.wathan = round((100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)));
	result.average = round(
		(result.epley +
			result.brzycki +
			result.lombardi +
			result.mcglothin +
			result.mayhew +
			result.wathan) /
			6
	);
	result.min = round(
		Math.min(
			result.epley,
			result.brzycki,
			result.lombardi,
			result.mcglothin,
			result.mayhew,
			result.wathan
		)
	);
	result.max = round(
		Math.max(
			result.epley,
			result.brzycki,
			result.lombardi,
			result.mcglothin,
			result.mayhew,
			result.wathan
		)
	);

	return result;
};
