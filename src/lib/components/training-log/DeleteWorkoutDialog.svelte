<script lang="ts">
	import type { Workout } from '$lib/db/types';
	import { Button, buttonVariants } from '$lib/shadcn/button';
	import * as Dialog from '$lib/shadcn/dialog';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	let { workout, open = $bindable() }: { workout: Workout; open: boolean } = $props();

	const client = useConvexClient();

	const onDelete = async () => {
		await client.mutation(api.workouts.remove, { id: workout._id });
		goto(resolve('/(app)/tools/training-log'));
	};
</script>

<Dialog.Root bind:open>
	<Dialog.Content>
		<Dialog.Title>Delete workout</Dialog.Title>
		<Dialog.Description>
			Are you sure you want to delete this workout? This action cannot be undone.
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Dialog.Close class={buttonVariants({ variant: 'secondary' })}>Cancel</Dialog.Close>
			<Button variant="destructive" onclick={onDelete}>Confirm</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
