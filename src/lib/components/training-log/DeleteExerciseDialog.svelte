<script lang="ts">
	import * as Dialog from '$lib/shadcn/dialog';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import type { Exercise } from '$lib/jazz/types';
	import { Exercise as ExerciseSchema } from '$lib/jazz/schema';
	import { deleteCoValues } from 'jazz-tools';

	let { exercise }: { exercise: Exercise } = $props();

	let open = $state(false);

	const onDelete = async () => {
		const exerciseId = exercise.$jazz.id;
		await deleteCoValues(ExerciseSchema, exerciseId);
		open = false;
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Trigger
		class={buttonVariants({ variant: 'destructive', size: 'icon', class: 'size-7' })}
		aria-label="Delete exercise"
	>
		<TrashIcon />
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Title>Delete exercise</Dialog.Title>
		<Dialog.Description>Are you sure you want to delete this exercise?</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
