<script lang="ts">
	import { pushState } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import DeleteWorkoutDialog from '$lib/components/training-log/DeleteWorkoutDialog.svelte';
	import ToolDialog from '$lib/components/training-log/ToolDialog.svelte';
	import { tools, type Tool } from '$lib/data/tools';
	import type { Workout } from '$lib/db/types';
	import { buttonVariants } from '$lib/shadcn/button';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import EllipsisVertical from '@lucide/svelte/icons/ellipsis-vertical';
	import TrashIcon from '@lucide/svelte/icons/trash-2';
	import { cn } from '$lib/shadcn/utils';

	let { workout, class: className }: { workout: Workout; class?: string } = $props();

	let deleteDialogOpen = $state(false);

	const onDeleteWorkout = () => {
		deleteDialogOpen = true;
	};

	const toolItems = Object.values(tools).filter(
		(tool) => tool.href !== resolve('/(app)/tools/training-log')
	);

	const onToolItemClick = (tool: Tool) => {
		pushState('', {
			toolHref: tool.href
		});
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger
		class={cn(buttonVariants({ variant: 'outline', size: 'icon' }), className)}
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
				<TrashIcon class="text-destructive" />
				Delete workout
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>

<DeleteWorkoutDialog bind:open={deleteDialogOpen} {workout} />

<ToolDialog toolHref={page.state.toolHref} />
