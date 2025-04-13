export const FORMULAS = {
	epley: {
		calculate: (weight: number, reps: number) => weight * (1 + reps / 30),
		label: 'Epley',
		formula: '1RM = weight × (1 + reps / 30)',
		bestFor: 'Low to moderate reps (≤10), strength-focused work.',
		description:
			'Developed by Boyd Epley, this is one of the most commonly used formulas and is reliable for estimating maxes from moderate reps.'
	},
	brzycki: {
		calculate: (weight: number, reps: number) => weight * (36 / (37 - reps)),
		label: 'Brzycki',
		formula: '1RM = weight × (36 / (37 - reps))',
		bestFor: 'Lower rep ranges (≤10), conservative estimates.',
		description:
			'A well-known formula from Matt Brzycki. Slightly more conservative than Epley, often used in educational and coaching settings.'
	},
	lombardi: {
		calculate: (weight: number, reps: number) => weight * reps ** 0.1,
		label: 'Lombardi',
		formula: '1RM = weight × reps^0.10',
		bestFor: 'High reps, bodybuilding-style work.',
		description:
			'More optimistic at higher reps. Assumes endurance contributes significantly to max performance.'
	},
	mcglothin: {
		calculate: (weight: number, reps: number) => (100 * weight) / (101.3 - 2.67123 * reps),
		label: 'McGlothin',
		formula: '1RM = (100 × weight) / (101.3 - 2.67123 × reps)',
		bestFor: 'Low to mid reps (≤10), accurate across many populations.',
		description:
			'Designed to provide consistent results across a broad range of lifters, often closely matches real 1RMs.'
	},
	mayhew: {
		calculate: (weight: number, reps: number) =>
			(100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps)),
		label: 'Mayhew',
		formula: '1RM = (100 × weight) / (52.2 + 41.9 × e^(-0.055 × reps))',
		bestFor: 'Bench press estimates, tested on athletes.',
		description:
			'Originally derived from football players doing bench press, tends to slightly underestimate for experienced lifters.'
	},
	wathan: {
		calculate: (weight: number, reps: number) =>
			(100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps)),
		label: 'Wathan',
		formula: '1RM = (100 × weight) / (48.8 + 53.8 × e^(-0.075 × reps))',
		bestFor: 'More experienced lifters, useful across compound lifts.',
		description: 'Similar to Mayhew but often gives slightly higher estimates. A good all-arounder.'
	}
} as const;

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

	result.epley = round(FORMULAS.epley.calculate(weight, reps));
	result.brzycki = round(FORMULAS.brzycki.calculate(weight, reps));
	result.lombardi = round(FORMULAS.lombardi.calculate(weight, reps));
	result.mcglothin = round(FORMULAS.mcglothin.calculate(weight, reps));
	result.mayhew = round(FORMULAS.mayhew.calculate(weight, reps));
	result.wathan = round(FORMULAS.wathan.calculate(weight, reps));
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
