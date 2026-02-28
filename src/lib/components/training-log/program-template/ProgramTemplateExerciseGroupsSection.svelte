<script lang="ts">
	import ProgramTemplateExerciseGroupCard from '$lib/components/training-log/program-template/ProgramTemplateExerciseGroupCard.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramWorkout, PerformanceGroup } from '$lib/jazz/schema';
	import { deleteCoValues } from 'jazz-tools';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';

	const editorState = getProgramTemplateEditorContext();
	const selectedWorkoutId = $derived(editorState.selectedWorkoutId);

	const workoutState = new CoState(ProgramWorkout, () => selectedWorkoutId, {
		resolve: {
			performanceGroups: {
				$each: {
					performances: {
						$each: {
							exercise: true,
							performanceSets: { $each: true }
						}
					}
				}
			}
		}
	});
	const workout = $derived(workoutState.current.$isLoaded ? workoutState.current : undefined);
	const groups = $derived(workout?.performanceGroups.filter((g) => g.$isLoaded) ?? []);

	const addGroup = () => {
		const w = workout;
		if (!w || !w.$isLoaded) {
			return;
		}
		const newGroup = PerformanceGroup.create({
			workoutId: undefined,
			programWorkoutId: selectedWorkoutId,
			label: undefined,
			workoutOrder: groups.length,
			performances: []
		});
		w.performanceGroups.$jazz.push(newGroup);
	};

	let groupPendingDelete = $state<string | undefined>(undefined);
	let groupDeleteDialogOpen = $state(false);

	const promptDeleteGroup = (groupId: string) => {
		groupPendingDelete = groupId;
		groupDeleteDialogOpen = true;
	};

	const confirmRemoveGroup = async () => {
		if (!groupPendingDelete || !workout) {
			return;
		}
		await deleteCoValues(PerformanceGroup, groupPendingDelete, {
			resolve: {
				performances: {
					$each: true
				}
			}
		});
		groupDeleteDialogOpen = false;
		groupPendingDelete = undefined;
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
			{#each groups as group (group.$jazz.id)}
				<ProgramTemplateExerciseGroupCard {group} onDeleteGroup={promptDeleteGroup} />
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
