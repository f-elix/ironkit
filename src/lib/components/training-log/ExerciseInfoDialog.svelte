<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/file-plus';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import LargeRadioButtons from '$lib/components/ui/LargeRadioButtons.svelte';
	import MuscleGroupSelection from '$lib/components/training-log/MuscleGroupSelection.svelte';
	import { triplit } from '$lib/db/triplit';
	import type { Exercise } from '$lib/db/types';
	import type { Snippet } from 'svelte';
	import { userId } from '$lib/db/userId';
	import {
		DEFAULT_EXERCISE_EXECUTION_TYPE,
		DEFAULT_EXERCISE_LOAD_TYPE,
		EXERCISE_EXECUTION_TYPES,
		EXERCISE_LOAD_TYPES
	} from '$lib/constants';
	import { exerciseLoadType } from '$lib/db/exerciseLoadType';

	let {
		exercise,
		trigger,
		name = exercise?.name,
		onExerciseCreated,
		triggerSize = 'default'
	}: {
		exercise?: Exercise;
		trigger?: Snippet;
		name?: string;
		triggerSize?: 'default' | 'sm';
		onExerciseCreated?: (exercise: Exercise) => void;
	} = $props();

	let open = $state(false);

	const title = exercise ? 'Edit exercise' : 'Create exercise';
	const buttonText = exercise ? 'Save changes' : 'Create';

	let executionType = $state<(typeof EXERCISE_EXECUTION_TYPES)[number]>(
		exercise?.executionType ?? DEFAULT_EXERCISE_EXECUTION_TYPE
	);
	let loadType = $state<(typeof EXERCISE_LOAD_TYPES)[number]>(
		exerciseLoadType(exercise) ?? DEFAULT_EXERCISE_LOAD_TYPE
	);
	let muscleGroups = $state<string[]>(Array.from(exercise?.muscleGroups ?? []) ?? []);

	const resetState = () => {
		name = '';
		muscleGroups = [];
		executionType = DEFAULT_EXERCISE_EXECUTION_TYPE;
		loadType = DEFAULT_EXERCISE_LOAD_TYPE;
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
		if (!o && !exercise) {
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
				class: [
					'bg-muted/50 h-auto w-full items-center justify-center text-base whitespace-normal ring-inset',
					triggerSize === 'default' ? 'py-8' : 'py-2'
				]
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
	<Dialog.Content>
		<Dialog.Title>{title}</Dialog.Title>
		<form class="flex flex-col gap-6" onsubmit={onSave}>
			<label>
				<span class="sr-only">Exercise name</span>
				<Input type="text" placeholder="Exercise name" bind:value={name} />
			</label>
			<LargeRadioButtons
				label="Execution type"
				items={EXERCISE_EXECUTION_TYPES.map((type) => ({
					value: type,
					label: type
				}))}
				value={executionType}
				onValueChange={(v) => {
					executionType = v;
				}}
			/>
			<LargeRadioButtons
				label="Load type"
				items={EXERCISE_LOAD_TYPES.map((type) => ({
					value: type,
					label: type
				}))}
				value={loadType}
				onValueChange={(v) => {
					loadType = v;
				}}
			/>
			<MuscleGroupSelection bind:value={muscleGroups} />
			<Button type="submit">{buttonText}</Button>
		</form>
	</Dialog.Content>
</Dialog.Root>
