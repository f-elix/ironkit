<script lang="ts">
	import { type KgPlateConfiguration } from '$lib/plateCalculator';
	import { flip } from 'svelte/animate';
	import { expoOut } from 'svelte/easing';
	import { fly } from 'svelte/transition';

	let {
		kgPlateConfiguration = [],
		heavyCollars
	}: {
		kgPlateConfiguration: KgPlateConfiguration;
		heavyCollars: boolean;
	} = $props();

	let sortedKgPlateConfiguration = $derived(
		kgPlateConfiguration
			.toSorted((a, b) => b.plate - a.plate)
			.reduce(
				(acc, current) => {
					for (let i = 0; i < current.count; i++) {
						acc.push({ plate: current.plate, id: `${current.plate}-${i}` });
					}
					return acc;
				},
				[] as { plate: number; id: string }[]
			)
	);
</script>

<div class="mx-auto grid w-52 grid-stack">
	<div class="flex items-center">
		<div class="h-7 w-1 bg-zinc-500"></div>
		<div class="h-4 grow bg-zinc-400"></div>
	</div>
	<div class="flex items-center gap-1 pl-2">
		{#each sortedKgPlateConfiguration as { plate, id }, i (id)}
			<div
				in:fly|global={{
					x: 50,
					duration: 500,
					easing: expoOut,
					delay: i * 20
				}}
				out:fly={{
					x: 50,
					duration: 500,
					easing: expoOut
				}}
				animate:flip={{ duration: 200, easing: expoOut }}
				class={[
					'rounded-lg',
					plate === 25 && 'h-28 w-3 bg-kg-plate-red',
					plate === 20 && 'h-28 w-3 bg-kg-plate-blue',
					plate === 15 && 'h-24 w-3 bg-kg-plate-yellow',
					plate === 10 && 'h-20 w-3 bg-kg-plate-green',
					plate === 5 && 'h-16 w-3 bg-kg-plate-white',
					plate === 2.5 && 'h-12 w-3 bg-kg-plate-black',
					plate === 1.25 && 'h-8 w-2 bg-kg-plate-silver',
					plate === 0.5 && 'h-6 w-1 bg-kg-plate-silver',
					plate === 0.25 && 'h-4 w-1 bg-kg-plate-silver'
				]}
			></div>
		{/each}
		{#key kgPlateConfiguration}
			{#if heavyCollars}
				<div
					in:fly|global={{
						x: 50,
						duration: 500,
						easing: expoOut,
						delay: kgPlateConfiguration?.length * 20
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
