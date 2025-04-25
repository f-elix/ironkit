<script lang="ts">
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import ToolDialog from '$lib/components/training-log/ToolDialog.svelte';
	import { tools, type Tool } from '$lib/data/tools';
	import type { Workout } from '$lib/db/types';
	import { PAGE_tools_training_log } from '$lib/ROUTES';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import TrashIcon from '@lucide/svelte/icons/trash-2';

	let { workout }: { workout: Workout } = $props();

	let deleteDialogOpen = $state(false);

	const onDeleteWorkout = () => {
		deleteDialogOpen = true;
	};

	const toolItems = Object.values(tools).filter((tool) => tool.href !== PAGE_tools_training_log);

	const onToolItemClick = (tool: Tool) => {
		pushState('', {
			toolHref: tool.href
		});
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
			{#each toolItems as tool}
				<DropdownMenu.Item onSelect={() => onToolItemClick(tool)}>
					<tool.Icon />
					{tool.title}
				</DropdownMenu.Item>
			{/each}
		</DropdownMenu.Group>
		<DropdownMenu.Separator />
		<DropdownMenu.Group>
			<DropdownMenu.Item class="text-destructive" onSelect={onDeleteWorkout}>
				<TrashIcon />
				Delete workout
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteWorkoutDialog bind:open={deleteDialogOpen} {workout} />

<ToolDialog toolHref={page.state.toolHref} />
