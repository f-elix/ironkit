<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateExerciseGroupCard from '$lib/components/training-log/program-template/ProgramTemplateExerciseGroupCard.svelte';
	import type {
		GroupExerciseUpdate,
		ProgramWorkoutGroup
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';

	let {
		groups,
		onAddGroup,
		onUpdateGroupLabel,
		onPromptDeleteGroup,
		onAddExerciseToGroup,
		onUpdateExercise,
		onRemoveExercise,
		onUpdateSetTarget
	}: {
		groups: ProgramWorkoutGroup[];
		onAddGroup: () => Promise<void> | void;
		onUpdateGroupLabel: (groupId: Id<'performanceGroups'>, label: string) => Promise<void> | void;
		onPromptDeleteGroup: (groupId: Id<'performanceGroups'>) => void;
		onAddExerciseToGroup: (
			groupId: Id<'performanceGroups'>,
			exerciseId: Id<'exercises'>
		) => Promise<void> | void;
		onUpdateExercise: (
			exerciseTargetId: Id<'performances'>,
			updates: GroupExerciseUpdate
		) => Promise<void> | void;
		onRemoveExercise: (exerciseTargetId: Id<'performances'>) => Promise<void> | void;
		onUpdateSetTarget: (
			setId: Id<'performanceSets'>,
			executionType: 'reps' | 'time',
			value: number
		) => Promise<void> | void;
	} = $props();
</script>

<div class="space-y-3">
	<div class="flex items-center justify-between">
		<h3 class="text-sm font-semibold">Exercise groups</h3>
		<Button variant="outline" size="sm" class="h-7 text-xs" onclick={onAddGroup}>
			<PlusIcon class="size-3.5" />
			Add exercise group
		</Button>
	</div>

	{#if groups.length}
		<div class="space-y-3">
			{#each groups as group (group._id)}
				<ProgramTemplateExerciseGroupCard
					{group}
					{onUpdateGroupLabel}
					{onPromptDeleteGroup}
					{onAddExerciseToGroup}
					{onUpdateExercise}
					{onRemoveExercise}
					{onUpdateSetTarget}
				/>
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
