<script lang="ts">
	import PlusIcon from '@lucide/svelte/icons/file-plus';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import Input from '$lib/shadcn/input/input.svelte';
	import LargeRadioButtons from '$lib/components/ui/LargeRadioButtons.svelte';
	import MuscleGroupSelection from '$lib/components/training-log/MuscleGroupSelection.svelte';
	import type { Exercise } from '$lib/jazz/types';
	import type { Snippet } from 'svelte';
	import {
		DEFAULT_EXERCISE_EXECUTION_TYPE,
		DEFAULT_EXERCISE_LOAD_TYPE,
		EXERCISE_EXECUTION_TYPES,
		EXERCISE_LOAD_TYPES
	} from '$lib/constants';
	import { Exercise as ExerciseSchema, IronkitAccount } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';

	let {
		exercise,
		trigger,
		name,
		onExerciseCreated,
		triggerSize = 'default'
	}: {
		exercise?: Exercise;
		trigger?: Snippet;
		name?: string;
		triggerSize?: 'default' | 'sm';
		onExerciseCreated?: (exerciseId: string) => void;
	} = $props();

	const account = new AccountCoState(IronkitAccount, {
		resolve: {
			root: {
				exercises: { $each: true }
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	let open = $state(false);

	const title = $derived(exercise ? 'Edit exercise' : 'Create exercise');
	const buttonText = $derived(exercise ? 'Save changes' : 'Create');

	let exerciseName = $derived(name ?? exercise?.name ?? '');
	let executionType = $derived(exercise?.executionType ?? DEFAULT_EXERCISE_EXECUTION_TYPE);
	let loadType = $derived(exercise?.loadType ?? DEFAULT_EXERCISE_LOAD_TYPE);
	let muscleGroups = $derived(exercise?.muscleGroups ?? []);

	const onSave = async () => {
		if (!root) {
			return;
		}

		if (exercise) {
			exercise.$jazz.set('name', exerciseName);
			exercise.$jazz.set('executionType', executionType);
			exercise.$jazz.set('loadType', loadType);
			exercise.$jazz.set('muscleGroups', muscleGroups);
		} else {
			const newExercise = ExerciseSchema.create({
				name: exerciseName,
				executionType: executionType,
				loadType: loadType,
				muscleGroups: muscleGroups
			});
			root.exercises.$jazz.push(newExercise);
			onExerciseCreated?.(newExercise.$jazz.id);
		}
		open = false;
	};
</script>

<Dialog.Root bind:open>
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
				<Input type="text" placeholder="Exercise name" bind:value={exerciseName} />
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
