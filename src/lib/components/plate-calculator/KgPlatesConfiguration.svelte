<script lang="ts">
	import {
		ALL_PLATES,
		type KgPlateConfiguration
	} from '$lib/components/plate-calculator/plateCalculator';
	import { useId } from 'bits-ui';

	let {
		kgPlateConfiguration = [],
		onConfigurationChange
	}: {
		kgPlateConfiguration: KgPlateConfiguration;
		onConfigurationChange: (newConfig: KgPlateConfiguration) => void;
	} = $props();

	const increasePlateCount = (plate: number) => {
		const plateConfigurationItem = kgPlateConfiguration?.find((p) => p.plate === plate);
		if (plateConfigurationItem) {
			plateConfigurationItem.count++;
		} else {
			kgPlateConfiguration.push({
				id: useId(),
				plate,
				count: 1
			});
		}
		onConfigurationChange(kgPlateConfiguration);
	};
</script>

<div class="flex flex-wrap items-center gap-4 rounded-lg bg-muted/50 p-8">
	{#each ALL_PLATES as plate}
		<span class="flex flex-col items-center gap-1">
			<button
				class={[
					'flex size-16 items-center justify-center rounded-full text-xs',
					plate === 25 && 'bg-kg-plate-red',
					plate === 20 && 'bg-kg-plate-blue',
					plate === 15 && 'bg-kg-plate-yellow text-kg-plate-black',
					plate === 10 && 'bg-kg-plate-green text-kg-plate-black',
					plate === 5 && 'bg-kg-plate-white text-kg-plate-black',
					plate === 2.5 && 'bg-kg-plate-black',
					plate === 1.25 && 'bg-kg-plate-silver text-kg-plate-black',
					plate === 0.5 && 'bg-kg-plate-silver text-kg-plate-black',
					plate === 0.25 && 'bg-kg-plate-silver text-kg-plate-black'
				]}
				onclick={() => increasePlateCount(plate)}
			>
				{plate}kg
			</button>
			<span class="text-base">
				{kgPlateConfiguration?.find((p) => p.plate === plate)?.count ?? 0}x
			</span>
		</span>
	{/each}
</div>
