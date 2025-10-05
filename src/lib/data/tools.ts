import type { Component } from 'svelte';
import WeightConverterIcon from '@lucide/svelte/icons/weight';
import PlateCalculatorIcon from '$lib/components/svg/PlatesIcon.svelte';
import CoefficientCalculatorIcon from '@lucide/svelte/icons/trophy';
import OneRepMaxCalculatorIcon from '@lucide/svelte/icons/target';
import LoadPercentageCalculatorIcon from '@lucide/svelte/icons/percent';
import TrainingLogIcon from '@lucide/svelte/icons/notebook-pen';
import { resolve } from '$app/paths';

export type Tool = {
	href: string;
	title: string;
	Icon: Component;
};

export const tools: Record<string, Tool> = {
	weightConverter: {
		href: resolve('/(app)/tools/weight-converter'),
		title: 'Kg/lbs converter',
		Icon: WeightConverterIcon
	},
	plateCalculator: {
		href: resolve('/(app)/tools/plate-calculator'),
		title: 'Plate calculator',
		Icon: PlateCalculatorIcon
	},
	coefficientCalculator: {
		href: resolve('/(app)/tools/coefficient-calculator'),
		title: 'Coefficient calculator',
		Icon: CoefficientCalculatorIcon
	},
	oneRepMaxCalculator: {
		href: resolve('/(app)/tools/1rm-calculator'),
		title: '1rm calculator',
		Icon: OneRepMaxCalculatorIcon
	},
	loadPercentageCalculator: {
		href: resolve('/(app)/tools/load-percentage-calculator'),
		title: 'Load percentage calculator',
		Icon: LoadPercentageCalculatorIcon
	},
	trainingLog: {
		href: resolve('/(app)/tools/training-log'),
		title: 'Training log',
		Icon: TrainingLogIcon
	}
};
