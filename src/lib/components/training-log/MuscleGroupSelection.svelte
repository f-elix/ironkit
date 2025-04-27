<script lang="ts">
	import Check from '@lucide/svelte/icons/check';
	import { muscleGroups } from '$lib/data/muscleGroups';
	import { Badge } from '$lib/shadcn/badge';
	import X from '@lucide/svelte/icons/x';
	import { Combobox } from 'bits-ui';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import CaretDoubleUp from '@lucide/svelte/icons/chevrons-up';
	import CaretDoubleDown from '@lucide/svelte/icons/chevrons-down';
	import { scale } from 'svelte/transition';
	import { expoOut } from 'svelte/easing';
	import { flip } from 'svelte/animate';

	let { value = $bindable() }: { value?: string[] } = $props();

	const items = muscleGroups.map((muscleGroup) => ({
		value: muscleGroup.id,
		label: muscleGroup.name
	}));

	let searchValue = $state('');

	const filteredItems = $derived(
		searchValue === ''
			? items
			: items.filter((item) => item.label.toLowerCase().includes(searchValue?.toLowerCase() ?? ''))
	);
</script>

<fieldset class="space-y-2">
	<legend class="text-sm font-medium">Muscle Groups</legend>
	<Combobox.Root
		type="multiple"
		onOpenChange={(o) => {
			if (!o) {
				searchValue = '';
			}
		}}
		onValueChange={() => {
			searchValue = '';
		}}
		bind:value
	>
		<div class="relative">
			<Combobox.Input
				oninput={(e) => (searchValue = e.currentTarget.value)}
				class="border-border-input placeholder:text-foreground-alt/50 inline-flex h-10 w-full truncate rounded-sm border bg-background px-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-foreground focus:ring-offset-2 focus:ring-offset-background sm:text-sm"
				placeholder="Search muscle groups"
				aria-label="Search muscle groups"
				clearOnDeselect
			/>
			<Combobox.Trigger class="absolute end-3 top-1/2 size-6 -translate-y-1/2">
				<ChevronDown class="size-6 text-muted-foreground" />
			</Combobox.Trigger>
		</div>
		<Combobox.Portal>
			<Combobox.Content
				class="z-50 max-h-[var(--bits-combobox-content-available-height)] w-[var(--bits-combobox-anchor-width)] min-w-[var(--bits-combobox-anchor-width)] select-none rounded-xl border border-muted bg-background px-1 py-3 shadow-popover outline-none data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
				sideOffset={10}
			>
				<Combobox.ScrollUpButton class="flex w-full items-center justify-center py-1">
					<CaretDoubleUp class="size-3" />
				</Combobox.ScrollUpButton>
				<Combobox.Viewport class="p-1">
					{#each filteredItems as item, i (i + item.value)}
						<Combobox.Item
							class="flex h-10 w-full select-none items-center rounded-sm py-3 pl-5 pr-1.5 text-sm capitalize outline-none data-[highlighted]:bg-muted"
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
	<ul class="flex flex-wrap gap-2">
		{#each value ?? [] as muscleGroup (muscleGroup)}
			{@const label = muscleGroups.find((mg) => mg.id === muscleGroup)?.name}
			<li
				transition:scale={{ duration: 250, easing: expoOut }}
				animate:flip={{ duration: 250, easing: expoOut }}
			>
				<Badge variant="secondary">
					{label}
					<button
						type="button"
						class="-mr-2 ml-2 grid size-6 place-items-center rounded-full bg-foreground"
						onclick={() => {
							value = value?.filter((mg) => mg !== muscleGroup);
						}}
						aria-label="Remove muscle group"
					>
						<X class="size-4 text-background" />
					</button>
				</Badge>
			</li>
		{/each}
	</ul>
</fieldset>
