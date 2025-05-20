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

<div class="grid-stack mx-auto grid w-52">
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
					plate === 25 && 'bg-kg-plate-red h-28 w-3',
					plate === 20 && 'bg-kg-plate-blue h-28 w-3',
					plate === 15 && 'bg-kg-plate-yellow h-24 w-3',
					plate === 10 && 'bg-kg-plate-green h-20 w-3',
					plate === 5 && 'bg-kg-plate-white h-16 w-3',
					plate === 2.5 && 'bg-kg-plate-black h-12 w-3',
					plate === 1.25 && 'bg-kg-plate-silver h-8 w-2',
					plate === 0.5 && 'bg-kg-plate-silver h-6 w-1',
					plate === 0.25 && 'bg-kg-plate-silver h-4 w-1'
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
