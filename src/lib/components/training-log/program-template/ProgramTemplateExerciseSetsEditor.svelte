<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import ProgramTemplateExerciseSetRow from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetRow.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { useConvexClient } from 'convex-svelte';

	let {
		exerciseTargetId,
		executionType,
		exactSets,
		onUpdate,
		onRemove
	}: {
		exerciseTargetId: Id<'performances'>;
		executionType: 'reps' | 'time';
		exactSets: Doc<'performanceSets'>[];
		onUpdate?: (
			id: Id<'performanceSets'>,
			executionType: 'reps' | 'time',
			value: number
		) => Promise<void> | void;
		onRemove?: (id: Id<'performanceSets'>) => Promise<void> | void;
	} = $props();

	const client = useConvexClient();
	let sortedSets = $derived(
		(exactSets ?? []).slice().sort((a, b) => a.performanceOrder - b.performanceOrder)
	);

	const addSet = async () => {
		const last = sortedSets.at(-1);
		await client.mutation(api.programWorkoutExerciseSets.create, {
			programWorkoutExerciseId: exerciseTargetId,
			setOrder: (last?.performanceOrder ?? -1) + 1,
			targetReps: executionType === 'reps' ? 8 : undefined,
			targetDurationSeconds: executionType === 'time' ? 60 : undefined
		});
	};

	const updateSetValue = async (
		id: Id<'performanceSets'>,
		nextExecutionType: 'reps' | 'time',
		value: number
	) => {
		if (onUpdate) {
			await onUpdate(id, nextExecutionType, value);
			return;
		}
		await client.mutation(api.programWorkoutExerciseSets.update, {
			id,
			targetReps: nextExecutionType === 'reps' ? value : undefined,
			targetDurationSeconds: nextExecutionType === 'time' ? value : undefined
		});
	};

	const removeSet = async (id: Id<'performanceSets'>) => {
		if (onRemove) {
			await onRemove(id);
			return;
		}
		await client.mutation(api.programWorkoutExerciseSets.remove, { id });
	};
</script>

<div class="border-border/20 ml-1 space-y-0 border-l pl-3.5 pt-1">
	{#each sortedSets as setTarget, index (setTarget._id)}
		<ProgramTemplateExerciseSetRow
			{setTarget}
			{executionType}
			order={index + 1}
			onUpdate={updateSetValue}
			onRemove={removeSet}
			canRemove={sortedSets.length > 1}
		/>
	{/each}
	<Button
		variant="ghost"
		size="sm"
		class="text-muted-foreground mt-0.5 h-7 text-xs"
		onclick={addSet}
	>
		<PlusIcon class="size-3.5" />
		Add set
	</Button>
</div>
