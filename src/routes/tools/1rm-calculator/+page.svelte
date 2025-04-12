<script lang="ts">
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { Label } from '$lib/shadcn/label';
	import DefaultNumberInput from '$lib/components/ui/DefaultNumberInput.svelte';
	import { calculateOneRepMax } from '$lib/components/1rm-calculator/oneRepMaxCalculator';
	import { Separator } from '$lib/shadcn/separator';

	const data = $state<{
		weight: Maybe<number>;
		reps: Maybe<number>;
	}>({
		weight: null,
		reps: null
	});

	let oneRepMax = $derived(calculateOneRepMax(data.weight, data.reps));

	const FORMULAS = ['epley', 'brzycki', 'lombardi', 'mcglothin', 'mayhew', 'wathan'] as const;
</script>

{#snippet formulaResult(label: string, value: number)}
	<div class="flex flex-col items-center gap-2 text-center text-xl leading-none">
		<dt class="text-sm capitalize text-muted-foreground">
			{label}
		</dt>
		<dd class="font-bold">{value}</dd>
	</div>
{/snippet}

<ToolLayout>
	{#snippet output()}
		<!-- Output all the one rep max values for each formula -->
		<div class="rounded-sm border p-5">
			<dl class="grid grid-cols-3 gap-x-10 gap-y-5">
				{#each FORMULAS as formula}
					{@render formulaResult(formula, oneRepMax[formula])}
				{/each}
				<Separator class="col-span-3" />
				{@render formulaResult('Min', oneRepMax.min)}
				{@render formulaResult('Average', oneRepMax.average)}
				{@render formulaResult('Max', oneRepMax.max)}
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
		<Label class="relative flex w-20 flex-col">
			<span class="absolute bottom-full left-0 text-sm font-normal text-muted-foreground">
				{label}
			</span>
			<DefaultNumberInput bind:value={data[value]} showClearButton />
		</Label>
	</div>
{/snippet}
