export type BarWeight = 20 | 25;

export type KgPlateConfigurationItem = {
	plate: number;
	count: number;
};

export type KgPlateConfiguration = KgPlateConfigurationItem[];

export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] as const;
export const MAX_WEIGHT = 600;
export const COLLARS_WEIGHT = 5;

export const getActualBarWeight = ({
	barWeight,
	heavyCollars
}: {
	barWeight: BarWeight;
	heavyCollars: boolean;
}) => {
	return barWeight + (heavyCollars ? COLLARS_WEIGHT : 0);
};

export const weightToKgPlatesConfiguration = (
	weight: Maybe<number>,
	{
		barWeight = 20,
		heavyCollars = false
	}: {
		barWeight: 20 | 25;
		heavyCollars: boolean;
	}
) => {
	if (!weight || isNaN(weight)) {
		return [];
	}

	const actualBarWeight = getActualBarWeight({ barWeight, heavyCollars });

	if (weight < actualBarWeight || weight > MAX_WEIGHT) {
		return [];
	}

	if (weight === actualBarWeight) {
		return [{ plate: 0, count: 0 }] as KgPlateConfiguration;
	}

	// Remove bar weight
	const barlessWeight = weight - actualBarWeight;

	// divide by 2 to get single side plate weight
	const singleSidePlateWeight = barlessWeight / 2;

	// If the weight is not divisible by the smallest increment, return an empty array
	const smallestPlate = ALL_PLATES[ALL_PLATES.length - 1];
	if (singleSidePlateWeight % smallestPlate !== 0) {
		return [];
	}

	let currentWeight = singleSidePlateWeight;
	let currentPlateIndex = 0;
	let currentPlate = ALL_PLATES[currentPlateIndex];

	const kgPlateConfiguration: KgPlateConfiguration = [];

	while (currentWeight > 0) {
		if (currentWeight >= currentPlate) {
			const lastUsedPlate = kgPlateConfiguration[kgPlateConfiguration.length - 1];
			if (lastUsedPlate && lastUsedPlate.plate === currentPlate) {
				lastUsedPlate.count++;
			} else {
				kgPlateConfiguration.push({ plate: currentPlate, count: 1 });
			}
			currentWeight -= currentPlate;
		} else {
			currentPlate = ALL_PLATES[currentPlateIndex++];
		}
	}

	return kgPlateConfiguration;
};

export const kgPlateConfigurationWeight = (kgPlateConfiguration: KgPlateConfiguration) => {
	return kgPlateConfiguration.reduce((acc, curr) => acc + curr.plate * curr.count * 2, 0);
};
