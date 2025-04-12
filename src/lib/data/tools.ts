import type { Component } from 'svelte';
import WeightConverterIcon from '@lucide/svelte/icons/weight';
import {
	PAGE_tools_1rm_calculator,
	PAGE_tools_coefficient_calculator,
	PAGE_tools_plate_calculator,
	PAGE_tools_weight_converter
} from '$lib/ROUTES';
import PlateCalculatorIcon from '$lib/components/svg/PlatesIcon.svelte';
import CoefficientCalculatorIcon from '@lucide/svelte/icons/trophy';
import OneRepMaxCalculatorIcon from '@lucide/svelte/icons/target';

export type Tool = {
	href: string;
	title: string;
	Icon: Component;
};

export const tools: Record<string, Tool> = {
	weightConverter: {
		href: PAGE_tools_weight_converter,
		title: 'Kg/lbs converter',
		Icon: WeightConverterIcon
	},
	plateCalculator: {
		href: PAGE_tools_plate_calculator,
		title: 'Plate calculator',
		Icon: PlateCalculatorIcon
	},
	coefficientCalculator: {
		href: PAGE_tools_coefficient_calculator,
		title: 'Coefficient calculator',
		Icon: CoefficientCalculatorIcon
	},
	oneRepMaxCalculator: {
		href: PAGE_tools_1rm_calculator,
		title: '1rm calculator',
		Icon: OneRepMaxCalculatorIcon
	}
};
