<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/file-plus';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import capitalize from 'just-capitalize';
	import LargeRadioButtons from '$lib/components/ui/LargeRadioButtons.svelte';
	import * as Select from '$lib/shadcn/select';
	import Label from '$lib/shadcn/label/label.svelte';
	import MuscleGroupSelection from '$lib/components/training-log/MuscleGroupSelection.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { Exercise } from '$lib/db/types';
	import type { Snippet } from 'svelte';
	import { userId } from '$lib/db/userId';

	let {
		exercise,
		trigger,
		name = exercise?.name,
		onExerciseCreated
	}: {
		exercise?: Exercise;
		trigger?: Snippet;
		name?: string;
		onExerciseCreated?: (exercise: Exercise) => void;
	} = $props();

	let open = $state(false);

	const title = exercise ? 'Edit exercise' : 'Create exercise';
	const buttonText = exercise ? 'Save changes' : 'Create';

	const executionTypes = ['reps', 'time'] as const;
	const loadTypes = ['weighted', 'bodyweight', 'assisted'] as const;

	let executionType = $state<(typeof executionTypes)[number]>(exercise?.executionType ?? 'reps');
	let loadType = $state<(typeof loadTypes)[number]>(exercise?.loadType ?? 'weighted');
	let muscleGroups = $state<string[]>(Array.from(exercise?.muscleGroups ?? []) ?? []);

	const resetState = () => {
		name = '';
		muscleGroups = [];
		executionType = 'reps';
		loadType = 'weighted';
	};

	const onSave = async () => {
		if (exercise) {
			await triplit.update('exercises', exercise.id, {
				name: name ?? '',
				executionType: executionType,
				loadType: loadType,
				muscleGroups: new Set(muscleGroups)
			});
		} else {
			const newExercise = await triplit.insert('exercises', {
				userId: userId(),
				name: name ?? '',
				executionType: executionType,
				loadType: loadType,
				muscleGroups: muscleGroups
			});
			onExerciseCreated?.(newExercise);
		}
		open = false;
		resetState();
	};
</script>

<Dialog.Root
	bind:open
	onOpenChange={(o) => {
		if (!o) {
			resetState();
		}
	}}
>
	{#if trigger}
		{@render trigger()}
	{:else}
		<Dialog.Trigger
			class={buttonVariants({
				variant: 'outline',
				size: 'lg',
				class: 'w-full items-center justify-center bg-muted/50 py-8 text-base ring-inset'
			})}
		>
			<span>
				Create exercise
				{#if name}
					"<span class="font-normal">{name}</span>"
				{/if}
			</span>
			<PlusIcon />
		</Dialog.Trigger>
	{/if}
	<Dialog.Content class="w-[90vw] max-w-2xl">
		<Dialog.Title>{title}</Dialog.Title>
		<form class="flex flex-col gap-6" onsubmit={onSave}>
			<label>
				<span class="sr-only">Exercise name</span>
				<Input
					type="text"
					placeholder="Exercise name"
					bind:value={() => capitalize(name ?? ''), (v) => (name = v)}
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
			<Label class="flex flex-col items-start gap-2">
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
			<MuscleGroupSelection bind:value={muscleGroups} />
			<Button type="submit">{buttonText}</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
