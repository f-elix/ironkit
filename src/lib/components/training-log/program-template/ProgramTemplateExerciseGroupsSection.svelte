<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateExerciseGroupCard from '$lib/components/training-log/program-template/ProgramTemplateExerciseGroupCard.svelte';
	import type { ProgramWorkoutGroup } from '$lib/components/training-log/program-template/program-template-editor.types';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		programWorkoutId,
		groups
	}: {
		programWorkoutId: Id<'programWorkouts'>;
		groups: ProgramWorkoutGroup[];
	} = $props();

	const client = useConvexClient();

	const toErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) {
			return error.message;
		}
		return fallback;
	};

	const addGroup = async () => {
		try {
			await client.mutation(api.programWorkoutGroups.create, {
				programWorkoutId,
				workoutOrder: groups.length
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not add group.'));
		}
	};

	let groupPendingDelete = $state<Id<'performanceGroups'> | undefined>(undefined);
	let groupDeleteDialogOpen = $state(false);

	const promptDeleteGroup = (groupId: Id<'performanceGroups'>) => {
		groupPendingDelete = groupId;
		groupDeleteDialogOpen = true;
	};

	const confirmRemoveGroup = async () => {
		if (!groupPendingDelete) {
			return;
		}
		try {
			await client.mutation(api.programWorkoutGroups.remove, { id: groupPendingDelete });
			groupDeleteDialogOpen = false;
			groupPendingDelete = undefined;
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not delete group.'));
		}
	};
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Exercise groups</h3>
		<Button variant="outline" size="sm" class="h-7 text-xs" onclick={addGroup}>
			<PlusIcon class="size-3.5" />
			Add exercise group
		</Button>
	</div>

	{#if groups.length}
		<div class="space-y-3">
			{#each groups as group (group._id)}
				<ProgramTemplateExerciseGroupCard {group} {programWorkoutId} onDeleteGroup={promptDeleteGroup} />
			{/each}
		</div>
	{:else}
		<div class="border-border/30 rounded-lg border border-dashed py-8 text-center">
			<p class="text-muted-foreground/50 text-xs">
				No groups yet. Add one to start building this workout.
			</p>
		</div>
	{/if}
</div>

<Dialog.Root bind:open={groupDeleteDialogOpen}>
	<Dialog.Content>
		<Dialog.Title>Delete exercise group</Dialog.Title>
		<Dialog.Description>
			Delete this group and all exercises in it? This cannot be undone.
		</Dialog.Description>
		<Dialog.Footer class="flex flex-row justify-end gap-2">
			<Button variant="secondary" onclick={() => (groupDeleteDialogOpen = false)}>Cancel</Button>
			<Button variant="destructive" onclick={confirmRemoveGroup}>Delete group</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
