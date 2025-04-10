import type { Component } from 'svelte';
import WeightIcon from '@lucide/svelte/icons/weight';
import { PAGE_tools_plate_calculator, PAGE_tools_weight_converter } from '$lib/ROUTES';
import PlatesIcon from '$lib/components/svg/PlatesIcon.svelte';

export type Tool = {
	href: string;
	title: string;
	Icon: Component;
};

export const tools: Record<string, Tool> = {
	weightConverter: {
		href: PAGE_tools_weight_converter,
		title: 'Kg/lbs converter',
		Icon: WeightIcon
	},
	plateCalculator: {
		href: PAGE_tools_plate_calculator,
		title: 'Plate calculator',
		Icon: PlatesIcon
	}
};
