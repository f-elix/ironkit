<script lang="ts">
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { Label } from '$lib/shadcn/label';
	import DefaultNumberInput from '$lib/components/ui/DefaultNumberInput.svelte';
	import { calculateOneRepMax, FORMULAS } from '$lib/oneRepMaxCalculator';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';

	const data = $state<{
		weight: Maybe<number>;
		reps: Maybe<number>;
	}>({
		weight: null,
		reps: null
	});

	let oneRepMax = $derived(calculateOneRepMax(data.weight, data.reps));
</script>

{#snippet mainResult(label: string, value: number)}
	<div class="flex flex-col items-center gap-2 text-center text-xl leading-none">
		<dt class="text-sm capitalize">
			{label}
		</dt>
		<dd class="font-bold">{value}</dd>
	</div>
{/snippet}

<ToolLayout>
	{#snippet output()}
		<div class="flex flex-col gap-4">
			<p class="text-sm text-muted-foreground">The following formulas are used:</p>
			<dl class="grid grid-cols-3 gap-x-10 gap-y-5">
				{#each Object.entries(FORMULAS) as [key, formula]}
					<div class="flex flex-col items-center gap-2 text-center text-sm leading-none">
						<dt class="flex items-center gap-1">
							<span class="text-sm capitalize text-muted-foreground">{formula.label}</span>
							<HintBadge>
								<div class="flex flex-col gap-1">
									<h2 class="text-base font-bold">{formula.label}</h2>
									<p class="text-sm">{formula.description}</p>
									<h3 class="text-base font-bold">Best for</h3>
									<p class="text-sm">{formula.bestFor}</p>
									<h3 class="text-base font-bold">Formula</h3>
									<p class="text-sm">{formula.formula}</p>
								</div>
							</HintBadge>
						</dt>
						<dd>{oneRepMax[key as keyof typeof oneRepMax]}</dd>
					</div>
				{/each}
			</dl>
		</div>
		<div class="mt-6 rounded-sm border bg-muted p-4 first-line:rounded-sm">
			<dl class="grid grid-cols-3 gap-x-10 gap-y-5">
				{@render mainResult('Min', oneRepMax.min)}
				{@render mainResult('Average', oneRepMax.average)}
				{@render mainResult('Max', oneRepMax.max)}
			</dl>
		</div>
	{/snippet}
	{#snippet settings()}
		<div class="flex items-baseline justify-center gap-2">
			{@render inputWrapper('Weight', 'weight')}
			<div class="text-2xl font-medium">&times;</div>
			{@render inputWrapper('Reps', 'reps')}
		</div>
	{/snippet}
</ToolLayout>

{#snippet inputWrapper(label: string, value: keyof typeof data)}
	<div class="flex items-center gap-2 pt-4">
		<Label class="relative flex w-20 flex-col gap-2">
			<span class="absolute bottom-full left-0 text-sm font-normal">
				{label}
			</span>
			<DefaultNumberInput bind:value={data[value]} showClearButton />
		</Label>
	</div>
{/snippet}
