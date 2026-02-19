<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Doc, Id } from '$convex/_generated/dataModel';
	import ProgramTemplateExerciseSetRow from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetRow.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
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
	let sortedSets = $derived((exactSets ?? []).slice().sort((a, b) => a.performanceOrder - b.performanceOrder));

	const addSet = async () => {
		const last = sortedSets.at(-1);
		await client.mutation(api.programWorkoutExerciseSets.create, {
			programWorkoutExerciseId: exerciseTargetId,
			setOrder: (last?.performanceOrder ?? -1) + 1,
			targetReps: executionType === 'reps' ? 8 : undefined,
			targetDurationSeconds: executionType === 'time' ? 60 : undefined
		});
	};

	const updateSetValue = async (id: Id<'performanceSets'>, nextExecutionType: 'reps' | 'time', value: number) => {
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

<div class="grid gap-2 md:col-span-3">
	<div class="bg-background/50 grid gap-1 rounded-md p-2 sm:bg-transparent sm:p-0">
		{#each sortedSets as setTarget, index (setTarget._id)}
			<ProgramTemplateExerciseSetRow
				{setTarget}
				{executionType}
				order={index + 1}
				showDivider={index > 0}
				onUpdate={updateSetValue}
				onRemove={removeSet}
				canRemove={sortedSets.length > 1}
			/>
		{/each}
	</div>
	<Button
		variant="secondary"
		size="sm"
		class="w-full sm:w-auto sm:justify-self-start"
		onclick={addSet}
	>
		Add set
	</Button>
</div>
