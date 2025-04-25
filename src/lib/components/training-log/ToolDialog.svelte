<script lang="ts">
	import * as Sheet from '$lib/shadcn/sheet';
	import CoefficientCalculator from '$routes/tools/coefficient-calculator/+page.svelte';
	import LoadPercentageCalculator from '$routes/tools/load-percentage-calculator/+page.svelte';
	import OneRepMaxCalculator from '$routes/tools/1rm-calculator/+page.svelte';
	import PlateCalculator from '$routes/tools/plate-calculator/+page.svelte';
	import WeightConverter from '$routes/tools/weight-converter/+page.svelte';
	import {
		PAGE_tools_coefficient_calculator,
		PAGE_tools_load_percentage_calculator,
		PAGE_tools_1rm_calculator,
		PAGE_tools_plate_calculator,
		PAGE_tools_weight_converter
	} from '$lib/ROUTES';

	let { toolHref }: { toolHref: Maybe<string> } = $props();

	const ToolComponents = {
		[PAGE_tools_coefficient_calculator]: CoefficientCalculator,
		[PAGE_tools_load_percentage_calculator]: LoadPercentageCalculator,
		[PAGE_tools_1rm_calculator]: OneRepMaxCalculator,
		[PAGE_tools_plate_calculator]: PlateCalculator,
		[PAGE_tools_weight_converter]: WeightConverter
	};

	let ToolComponent = $derived(
		toolHref ? ToolComponents[toolHref as keyof typeof ToolComponents] : null
	);
</script>

<Sheet.Root
	open={!!toolHref}
	onOpenChange={(open) => {
		if (!open) {
			history.back();
		}
	}}
>
	<Sheet.Content side="right" class="flex w-[95vw] flex-col p-0 pt-10">
		{#if ToolComponent}
			<ToolComponent />
		{/if}
	</Sheet.Content>
</Sheet.Root>
