<script lang="ts">
	import * as Sheet from '$lib/shadcn/sheet';
	import CoefficientCalculator from '$routes/(app)/tools/coefficient-calculator/+page.svelte';
	import LoadPercentageCalculator from '$routes/(app)/tools/load-percentage-calculator/+page.svelte';
	import OneRepMaxCalculator from '$routes/(app)/tools/1rm-calculator/+page.svelte';
	import PlateCalculator from '$routes/(app)/tools/plate-calculator/+page.svelte';
	import WeightConverter from '$routes/(app)/tools/weight-converter/+page.svelte';
	import { tools } from '$lib/data/tools';

	let { toolHref }: { toolHref: Maybe<string> } = $props();

	const ToolComponents = {
		[tools.coefficientCalculator.href]: CoefficientCalculator,
		[tools.loadPercentageCalculator.href]: LoadPercentageCalculator,
		[tools.oneRepMaxCalculator.href]: OneRepMaxCalculator,
		[tools.plateCalculator.href]: PlateCalculator,
		[tools.weightConverter.href]: WeightConverter
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
