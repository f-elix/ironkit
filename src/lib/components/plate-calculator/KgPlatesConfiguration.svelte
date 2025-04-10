<script lang="ts">
	import { useId } from 'bits-ui';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let { weight, heavyCollars }: { weight: number; heavyCollars: boolean } = $props();

	const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5, 0.25] as const;
	const BAR_WEIGHT = 20;
	const COLLARS_WEIGHT = 5;
	const MAX_WEIGHT = 600;

	let actualBarWeight = $derived(BAR_WEIGHT + (heavyCollars ? COLLARS_WEIGHT : 0));
	let plateConfiguration = $derived.by(() => {
		if (weight < actualBarWeight || weight > MAX_WEIGHT) {
			return [];
		}

		if (weight === actualBarWeight) {
			return [{ plate: 0, id: useId() }];
		}

		// Remove bar weight
		let barlessWeight = weight - actualBarWeight;

		// divide by 2 to get single side plate weight
		const singleSidePlateWeight = barlessWeight / 2;

		// If the weight is not divisible by the smallest increment, return an empty array
		const smallestPlate = PLATES[PLATES.length - 1];
		if (singleSidePlateWeight % smallestPlate !== 0) {
			return [];
		}

		let currentWeight = singleSidePlateWeight;
		let currentPlateIndex = 0;
		let currentPlate = PLATES[currentPlateIndex];
		let plates: { id: string; plate: number }[] = [];

		while (currentWeight > 0) {
			if (currentWeight >= currentPlate) {
				plates.push({ plate: currentPlate, id: useId() });
				currentWeight -= currentPlate;
			} else {
				currentPlateIndex++;
				currentPlate = PLATES[currentPlateIndex];
			}
		}

		return plates;
	});

	let plateCounts = $derived(
		plateConfiguration.reduce(
			(acc, { plate }) => {
				const last = acc[acc.length - 1];
				if (last && last.plate === plate) {
					last.count++;
				} else {
					acc.push({ plate, count: 1, id: useId() });
				}
				return acc;
			},
			[] as { plate: number; count: number; id: string }[]
		)
	);

	let errorMessage = $derived.by(() => {
		if (weight === 0 || !weight || isNaN(weight)) {
			return 'Enter a weight';
		} else if (weight > MAX_WEIGHT) {
			return `Maximum weight is ${MAX_WEIGHT}kg`;
		} else if (weight < actualBarWeight) {
			return `Minimum weight is ${actualBarWeight}kg`;
		}
		return null;
	});
</script>

<div
	class="flex min-h-60 flex-col place-items-center items-center justify-center gap-6 overflow-hidden rounded-lg border p-4"
>
	{#if plateConfiguration.length > 0}
		<div class="grid-stack mx-auto grid w-52">
			<div class="flex items-center">
				<div class="h-7 w-1 bg-zinc-500"></div>
				<div class="h-4 grow bg-zinc-400"></div>
			</div>
			<div class="flex items-center gap-1 pl-2">
				{#each plateConfiguration as { plate, id }, i (id)}
					{#if plate !== 0}
						<div
							in:fly|global={{ x: 50, duration: 500, easing: expoOut, delay: i * 20 }}
							class={[
								'rounded-lg',
								plate === 25 && 'bg-kg-plate-red h-32 w-3',
								plate === 20 && 'bg-kg-plate-blue h-32 w-3',
								plate === 15 && 'bg-kg-plate-yellow h-28 w-3',
								plate === 10 && 'bg-kg-plate-green h-24 w-3',
								plate === 5 && 'bg-kg-plate-white h-20 w-3',
								plate === 2.5 && 'bg-kg-plate-black h-16 w-3',
								plate === 1.25 && 'bg-kg-plate-silver h-12 w-2',
								plate === 0.5 && 'bg-kg-plate-silver h-8 w-1',
								plate === 0.25 && 'bg-kg-plate-silver h-6 w-1'
							]}
						></div>
					{/if}
				{/each}
				{#key plateConfiguration}
					{#if heavyCollars}
						<div
							in:fly|global={{
								x: 50,
								duration: 500,
								easing: expoOut,
								delay: plateConfiguration.length * 20
							}}
							class="relative h-12 w-6 rounded-lg bg-zinc-500"
						>
							<div class="absolute bottom-full left-1/2 flex -translate-x-0.5 flex-col items-start">
								<div class="flex items-center">
									<div class="h-1 w-4 bg-zinc-500"></div>
									<div class="size-3 rounded-full bg-black"></div>
								</div>
								<div class="-mt-2 h-2 w-1 bg-zinc-500"></div>
							</div>
						</div>
					{/if}
				{/key}
			</div>
		</div>
		<p class="flex h-10 flex-wrap items-center gap-4">
			{#each plateCounts as { plate, count, id }, i (id)}
				{#if plate !== 0}
					<span
						in:fly|global={{ x: 20, duration: 500, easing: expoOut, delay: i * 55 }}
						class="flex items-center gap-1 text-xs"
					>
						<span
							class={[
								'flex size-10 items-center justify-center rounded-full',
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
						>
							{plate}kg
						</span>
						<span>{count}x</span>
					</span>
				{/if}
			{/each}
		</p>
	{:else if errorMessage}
		<p class="text-center text-muted-foreground">
			{errorMessage}
		</p>
	{/if}
</div>
