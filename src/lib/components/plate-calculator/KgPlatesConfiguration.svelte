<script lang="ts">
	import { ALL_PLATES, type KgPlateConfiguration } from '$lib/plateCalculator';
	import MinusIcon from '@lucide/svelte/icons/minus';

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
				plate,
				count: 1
			});
		}
		onConfigurationChange(kgPlateConfiguration);
	};

	const decreasePlateCount = (plate: number) => {
		const plateConfigurationItem = kgPlateConfiguration?.find((p) => p.plate === plate);
		if (plateConfigurationItem) {
			plateConfigurationItem.count--;
		}
		onConfigurationChange(kgPlateConfiguration);
	};
</script>

<div class="grid grid-flow-col grid-cols-3 grid-rows-3 gap-x-3 gap-y-4">
	{#each ALL_PLATES as plate}
		{@const count = kgPlateConfiguration?.find((p) => p.plate === plate)?.count ?? 0}
		<span class="flex items-center gap-1">
			<button
				class={[
					'flex size-12 items-center justify-center rounded-full text-xs',
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
			<span class="text-base font-semibold">
				{count}&times;
			</span>
			{#if count > 0}
				<button
					class="ml-1 rounded border border-current text-destructive"
					aria-label="Remove one"
					onclick={() => decreasePlateCount(plate)}
				>
					<MinusIcon class="size-4" />
				</button>
			{/if}
		</span>
	{/each}
</div>
