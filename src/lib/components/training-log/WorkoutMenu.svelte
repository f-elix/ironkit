<script lang="ts">
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import type { Workout } from '$lib/db/types';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { workout }: { workout: Workout } = $props();

	let deleteDialogOpen = $state(false);

	const onDeleteWorkout = () => {
		deleteDialogOpen = true;
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={buttonVariants({ variant: 'outline', size: 'icon' })}
		aria-label="Workout menu"
	>
		<EllipsisVertical />
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item class="text-destructive" onSelect={onDeleteWorkout}>
				<TrashIcon />
				Delete workout
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteWorkoutDialog bind:open={deleteDialogOpen} {workout} />
