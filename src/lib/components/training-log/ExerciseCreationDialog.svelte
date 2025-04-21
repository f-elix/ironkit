<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/square-plus';
	import { Button } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import capitalize from 'just-capitalize';
	import LargeRadioButtons from '$lib/components/ui/LargeRadioButtons.svelte';
	import * as Select from '$lib/shadcn/select';
	import Label from '$lib/shadcn/label/label.svelte';

	let { title }: { title: string } = $props();

	let open = $state(false);

	const onSave = () => {
		open = false;
	};

	const executionTypes = ['reps', 'time'] as const;
	const loadTypes = ['weighted', 'bodyweight', 'assisted'] as const;

	let executionType = $state<(typeof executionTypes)[number]>('reps');
	let loadType = $state<(typeof loadTypes)[number]>('weighted');
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class="w-full flex-col items-center justify-center py-12 text-base font-semibold [&_svg]:size-6"
				{...props}
			>
				<span>Create new exercise "<span class="font-normal">{title}</span>"</span>
				<PlusIcon />
			</Button>
		{/snippet}
	</Dialog.Trigger>
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title class="text-left">Create new exercise</Dialog.Title>
		<form class="flex flex-col gap-6" onsubmit={onSave}>
			<label>
				<span class="sr-only">Exercise name</span>
				<Input
					type="text"
					placeholder="Exercise name"
					bind:value={() => capitalize(title), (v) => (title = v)}
				/>
			</label>
			<LargeRadioButtons
				label="Execution type"
				items={executionTypes.map((type) => ({
					value: type,
					label: type
				}))}
				value={executionType}
				onValueChange={(v) => {
					executionType = v;
				}}
			/>
			<Label class="flex items-center gap-6">
				<span class="whitespace-nowrap">Load type</span>
				<Select.Root type="single" bind:value={loadType}>
					<Select.Trigger class="capitalize">
						{loadType}
					</Select.Trigger>
					<Select.Content>
						<Select.Group>
							{#each loadTypes as loadType (loadType)}
								<Select.Item value={loadType} label={loadType} class="capitalize"
									>{loadType}</Select.Item
								>
							{/each}
						</Select.Group>
					</Select.Content>
				</Select.Root>
			</Label>
			<!-- @TODO Add muscle group selection/creation -->
			<Button type="submit">Create</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
