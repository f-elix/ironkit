<script lang="ts">
	import KgPlatesConfiguration from '$lib/components/plate-calculator/KgPlatesConfiguration.svelte';
	import HintBadge from '$lib/components/ui/HintBadge.svelte';
	import { Switch } from '$lib/shadcn/switch';
	import { Label } from '$lib/shadcn/label';
	import LargeWeightInput from '$lib/components/ui/LargeWeightInput.svelte';
	import KgPlatesRepresentation from '$lib/components/plate-calculator/KgPlatesRepresentation.svelte';
	import {
		getActualBarWeight,
		kgPlateConfigurationWeight,
		MAX_WEIGHT,
		weightToKgPlatesConfiguration,
		type KgPlateConfiguration
	} from '$lib/plateCalculator';
	import { buttonVariants } from '$lib/shadcn/button';
	import ToolLayout from '$lib/components/app/ToolLayout.svelte';
	import { useQuery } from '@triplit/svelte';
	import { triplit } from '$lib/db/triplit';
	import { userId } from '$lib/db/userId';

	const query = useQuery(triplit, triplit.query('plateCalculator'));
	let plateCalculator = $derived(query.results?.[0]);
	let heavyCollars = $derived(plateCalculator?.heavyCollars ?? false);
	let barWeight = $derived(plateCalculator?.barWeight ?? 20);
	let allowNonStandardConfig = $derived(plateCalculator?.allowNonStandardConfig ?? false);

	const barWeightGroup = $state({
		set current(v) {
			triplit.insert('plateCalculator', {
				...plateCalculator,
				userId: plateCalculator?.userId ?? userId(),
				barWeight: v
			});
		},
		get current() {
			return barWeight;
		}
	});

	let weight = $state<Maybe<number>>();

	let userKgPlateConfiguration = $state<KgPlateConfiguration>([]);
	let kgPlateConfiguration = $derived(
		allowNonStandardConfig
			? userKgPlateConfiguration
			: weightToKgPlatesConfiguration(weight, {
					barWeight,
					heavyCollars
				})
	);

	let message = $derived.by(() => {
		const actualBarWeight = getActualBarWeight({ barWeight: 20, heavyCollars });
		if (weight === 0 || !weight || isNaN(weight)) {
			return 'Enter a weight below or tap the plates to add them';
		} else if (weight > MAX_WEIGHT) {
			return `Maximum weight is ${MAX_WEIGHT}kg`;
		} else if (weight < actualBarWeight) {
			return `Minimum weight is ${actualBarWeight}kg`;
		} else if (!kgPlateConfiguration?.length) {
			return 'Invalid weight';
		}
		return null;
	});
</script>

<ToolLayout>
	{#snippet output()}
		<div class="grid h-32 place-items-center rounded-lg border bg-secondary px-4">
			{#if kgPlateConfiguration?.length > 0}
				<KgPlatesRepresentation {kgPlateConfiguration} {heavyCollars} />
			{:else if message}
				<p class="px-4 text-center leading-5 text-muted-foreground">
					{message}
				</p>
			{/if}
		</div>
	{/snippet}
	{#snippet input()}
		<LargeWeightInput
			id="weight"
			label="Weight"
			value={weight}
			unit="kg"
			oninput={(e) => {
				allowNonStandardConfig = false;
				weight = e.currentTarget.valueAsNumber;
			}}
		/>
	{/snippet}
	{#snippet settings()}
		<div class="mx-auto flex max-w-80 flex-col gap-4">
			<KgPlatesConfiguration
				{kgPlateConfiguration}
				onConfigurationChange={(newConfig) => {
					userKgPlateConfiguration = newConfig;
					weight =
						kgPlateConfigurationWeight(newConfig) + getActualBarWeight({ barWeight, heavyCollars });
				}}
			/>
			<div class="flex w-full items-center justify-between gap-3">
				<span class="flex items-center gap-1">
					<Label for="allow-non-standard-configuration">Allow non-standard configuration</Label>
					<HintBadge
						text="If enabled, you will be able to add plates in a non-standard way. If disabled, the plate configuration will always be valid, even if it means adding another plate than the one you selected."
					/>
				</span>
				<Switch
					id="allow-non-standard-configuration"
					checked={allowNonStandardConfig}
					onCheckedChange={(v) => {
						triplit.insert('plateCalculator', {
							...plateCalculator,
							userId: plateCalculator?.userId ?? userId(),
							allowNonStandardConfig: v
						});
					}}
				/>
			</div>
			<div class="flex w-full items-center justify-between gap-3">
				<span class="flex items-center gap-1">
					<Label for="heavy-collars">With competition collars</Label>
					<HintBadge
						text="Competition collars weight 2.5kg each (5kg total), so using them will alter the plate configuration."
					/>
				</span>
				<Switch
					id="heavy-collars"
					checked={heavyCollars}
					onCheckedChange={(v) => {
						triplit.insert('plateCalculator', {
							...plateCalculator,
							userId: plateCalculator?.userId ?? userId(),
							heavyCollars: v
						});
					}}
				/>
			</div>
			<fieldset>
				<div class="flex items-center justify-between gap-2">
					<legend class="text-sm font-medium">Bar weight</legend>
					<div class="flex items-center justify-center gap-1">
						{#each [20, 25] as weight}
							<label>
								<input
									type="radio"
									value={weight}
									class="peer sr-only"
									bind:group={barWeightGroup.current}
								/>
								<span
									class="border border-muted-foreground/50 ring-ring ring-offset-2 peer-checked:border-primary peer-checked:bg-accent peer-focus-visible:ring-2 {buttonVariants(
										{
											variant: 'ghost',
											size: 'sm',
											class: 'h-8 w-10 cursor-pointer p-1 capitalize'
										}
									)}"
								>
									{weight}
								</span>
							</label>
						{/each}
						<div class="text-muted-foreground">Kg</div>
					</div>
				</div>
			</fieldset>
		</div>
	{/snippet}
</ToolLayout>
