<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let {
		workout,
		open = $bindable(),
		title = 'Delete workout',
		description = 'Are you sure you want to delete this workout? This action cannot be undone.',
		confirmLabel = 'Confirm',
		isDeleting = false,
		onConfirmDelete
	}: {
		workout?: Workout;
		open: boolean;
		title?: string;
		description?: string;
		confirmLabel?: string;
		isDeleting?: boolean;
		onConfirmDelete?: () => Promise<void> | void;
	} = $props();

	const client = useConvexClient();

	const onDelete = async () => {
		if (onConfirmDelete) {
			await onConfirmDelete();
			open = false;
			return;
		}
		if (!workout) {
			return;
		}
		await client.mutation(api.workouts.remove, { id: workout._id });
		open = false;
		goto(resolve('/(app)/tools/training-log'));
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>{title}</Dialog.Title>
		<Dialog.Description>{description}</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete} disabled={isDeleting}>
				{isDeleting ? 'Deleting...' : confirmLabel}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
