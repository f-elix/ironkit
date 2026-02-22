<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import ProgramTemplateExerciseSetRow from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetRow.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		exerciseTargetId,
		executionType,
		exactSets
	}: {
		exerciseTargetId: Id<'performances'>;
		executionType: 'reps' | 'time';
		exactSets: Doc<'programWorkoutExerciseTargets'>[];
	} = $props();

	const client = useConvexClient();
	const toErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) {
			return error.message;
		}
		return fallback;
	};
	let sortedSets = $derived(
		(exactSets ?? []).slice().toSorted((a, b) => a.targetOrder - b.targetOrder)
	);
	let targetExamples = $derived(
		executionType === 'reps'
			? 'Examples: 1 set + 8 reps, 3-4 sets + 10-15 reps'
			: 'Examples: 1 set + 60 sec, 3-4 sets + 30-45 sec'
	);

	const addSet = async () => {
		const last = sortedSets.at(-1);
		try {
			await client.mutation(api.programWorkoutExerciseSets.create, {
				programWorkoutExerciseId: exerciseTargetId,
				setOrder: (last?.targetOrder ?? -1) + 1,
				targetSetRange: '1',
				targetRepsRange: executionType === 'reps' ? '8' : undefined,
				targetDuration: executionType === 'time' ? '60 sec' : undefined
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not add set target.'));
		}
	};

	const updateSetValue = async (
		id: Id<'programWorkoutExerciseTargets'>,
		nextExecutionType: 'reps' | 'time',
		targetSetRange: string,
		targetValue: string
	) => {
		try {
			await client.mutation(api.programWorkoutExerciseSets.update, {
				id,
				targetSetRange,
				targetRepsRange: nextExecutionType === 'reps' ? targetValue : undefined,
				targetDuration: nextExecutionType === 'time' ? targetValue : undefined
			});
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update set target.'));
		}
	};

	const removeSet = async (id: Id<'programWorkoutExerciseTargets'>) => {
		try {
			await client.mutation(api.programWorkoutExerciseSets.remove, { id });
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not remove set target.'));
		}
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
