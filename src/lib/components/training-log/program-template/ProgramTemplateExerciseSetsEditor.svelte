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
			targetSetRange: string,
			targetValue: string
		) => Promise<void> | void;
		onRemove?: (id: Id<'performanceSets'>) => Promise<void> | void;
	} = $props();

	const client = useConvexClient();
	let sortedSets = $derived(
		(exactSets ?? []).slice().toSorted((a, b) => a.performanceOrder - b.performanceOrder)
	);
	let targetExamples = $derived(
		executionType === 'reps'
			? 'Examples: 1 set + 8 reps, 3-4 sets + 10-15 reps'
			: 'Examples: 1 set + 60 sec, 3-4 sets + 30-45 sec'
	);

	const addSet = async () => {
		const last = sortedSets.at(-1);
		await client.mutation(api.programWorkoutExerciseSets.create, {
			programWorkoutExerciseId: exerciseTargetId,
			setOrder: (last?.performanceOrder ?? -1) + 1,
			targetSetRange: '1',
			targetRepsRange: executionType === 'reps' ? '8' : undefined,
			targetDuration: executionType === 'time' ? '60 sec' : undefined
		});
	};

	const updateSetValue = async (
		id: Id<'performanceSets'>,
		nextExecutionType: 'reps' | 'time',
		targetSetRange: string,
		targetValue: string
	) => {
		if (onUpdate) {
			await onUpdate(id, nextExecutionType, targetSetRange, targetValue);
			return;
		}
		await client.mutation(api.programWorkoutExerciseSets.update, {
			id,
			targetSetRange,
			targetRepsRange: nextExecutionType === 'reps' ? targetValue : undefined,
			targetDuration: nextExecutionType === 'time' ? targetValue : undefined
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

<div class="border-border/20 ml-1 space-y-0 border-l pt-1 pl-3.5">
	<p class="text-muted-foreground/60 mb-2 text-[11px]">
		Enter a set count/range and a matching target range. {targetExamples}
	</p>
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
		Add target range
	</Button>
</div>
