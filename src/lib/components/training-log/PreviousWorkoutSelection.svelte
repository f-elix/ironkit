<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { Combobox } from 'bits-ui';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import CaretDoubleUp from '@lucide/svelte/icons/chevrons-up';
	import CaretDoubleDown from '@lucide/svelte/icons/chevrons-down';
	import { formatDate } from '$lib/ui/formatDate';
	import Label from '$lib/shadcn/label/label.svelte';
	import type { Workout } from '$lib/jazz/types';

	let {
		workouts = [],
		selectedWorkout = $bindable()
	}: { workouts: Workout[]; selectedWorkout?: Maybe<Workout> } = $props();

	let items = $derived(
		workouts.map((workout) => ({
			value: workout.$jazz.id,
			label: `${workout.title} - ${formatDate(new Date(workout.date))}`
		}))
	);

	let searchValue = $state('');

	let filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue?.toLowerCase() ?? ''))
	);
</script>

{#if workouts?.length}
	<Combobox.Root
		type="single"
		onOpenChange={(o) => {
			if (!o) {
				searchValue = '';
			}
		}}
		onValueChange={(value) => {
			searchValue = '';
			selectedWorkout = workouts.find((workout) => workout.$jazz.id === value);
		}}
	>
		<Label class="flex flex-col items-start gap-2">
			<span class="text-sm font-medium">Use previous workout as template</span>
			<div class="relative w-full">
				<Combobox.Input
					oninput={(e) => (searchValue = e.currentTarget.value)}
					class="border-border-input placeholder:text-foreground-alt/50 bg-background focus:ring-foreground focus:ring-offset-background inline-flex h-10 w-full truncate rounded-sm border px-2 text-base transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden sm:text-sm"
					placeholder="Search workouts"
					aria-label="Search workouts"
					clearOnDeselect
				/>
				<Combobox.Trigger class="absolute end-3 top-1/2 size-6 -translate-y-1/2">
					<ChevronDown class="text-muted-foreground size-6" />
				</Combobox.Trigger>
			</div>
		</Label>
		<Combobox.Portal>
			<Combobox.Content
				class="border-muted bg-background shadow-popover data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 max-h-(--bits-combobox-content-available-height) w-(--bits-combobox-anchor-width) min-w-(--bits-combobox-anchor-width) rounded-xl border px-1 py-3 outline-hidden select-none data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
				sideOffset={10}
			>
				<Combobox.ScrollUpButton class="flex w-full items-center justify-center py-1">
					<CaretDoubleUp class="size-3" />
				</Combobox.ScrollUpButton>
				<Combobox.Viewport class="p-1">
					{#each filteredItems as item, i (i + item.value)}
						<Combobox.Item
							class="data-highlighted:bg-muted flex h-10 w-full items-center rounded-sm py-3 pr-1.5 pl-5 text-sm capitalize outline-hidden select-none"
							value={item.value}
							label={item.label}
						>
							{#snippet children({ selected })}
								{item.label}
								{#if selected}
									<div class="ml-auto">
										<Check />
									</div>
								{/if}
							{/snippet}
						</Combobox.Item>
					{:else}
						<span class="block px-5 py-2 text-sm text-muted-foreground text-center">
							No results found.
						</span>
					{/each}
				</Combobox.Viewport>
				<Combobox.ScrollDownButton class="flex w-full items-center justify-center py-1">
					<CaretDoubleDown class="size-3" />
				</Combobox.ScrollDownButton>
			</Combobox.Content>
		</Combobox.Portal>
	</Combobox.Root>
{/if}
