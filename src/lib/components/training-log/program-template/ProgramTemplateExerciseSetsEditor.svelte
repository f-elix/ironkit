<script lang="ts">
	import ProgramTemplateExerciseSetRow from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetRow.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { Performance } from '$lib/jazz/schema';
	import { CoState } from 'jazz-tools/svelte';

	let {
		performanceId,
		executionType
	}: {
		performanceId: string;
		executionType: 'reps' | 'time';
	} = $props();

	const performanceState = new CoState(Performance, () => performanceId);

	const performance = $derived(
		performanceState.current.$isLoaded ? performanceState.current : undefined
	);

	const exactSets = $derived(performance?.programTargets ?? []);
	const targetExamples = $derived(
		executionType === 'reps'
			? 'Examples: 1 set + 8 reps, 3-4 sets + 10-15 reps'
			: 'Examples: 1 set + 60 sec, 3-4 sets + 30-45 sec'
	);

	const addSet = () => {
		if (!performance) {
			return;
		}
		const current = performance.programTargets ?? [];
		performance.$jazz.set('programTargets', [
			...current,
			{
				targetSetRange: '1',
				targetRepsRange: executionType === 'reps' ? '8' : undefined,
				targetDuration: executionType === 'time' ? '60 sec' : undefined
			}
		]);
		performance.$jazz.set('updatedAt', new Date());
	};

	const updateSetValue = (
		index: number,
		nextExecutionType: 'reps' | 'time',
		targetSetRange: string,
		targetValue: string
	) => {
		if (!performance) {
			return;
		}
		const programTargets = performance.programTargets ?? [];
		programTargets[index] = {
			...programTargets[index],
			targetSetRange,
			targetRepsRange: nextExecutionType === 'reps' ? targetValue : undefined,
			targetDuration: nextExecutionType === 'time' ? targetValue : undefined
		};
		performance.$jazz.set('programTargets', programTargets);
		performance.$jazz.set('updatedAt', new Date());
	};

	const removeSet = (index: number) => {
		if (!performance?.programTargets) {
			return;
		}
		const current = performance.programTargets;
		performance.$jazz.set(
			'programTargets',
			current.filter((_, i) => i !== index)
		);
		performance.$jazz.set('updatedAt', new Date());
	};
</script>

<div class="border-border/20 ml-1 space-y-0 border-l pt-1 pl-3.5">
	<p class="text-muted-foreground/60 mb-2 text-[11px]">
		Enter a set count/range and a matching target range. {targetExamples}
	</p>
	{#each exactSets as setTarget, index (`${index}-${setTarget.targetSetRange}`)}
		<ProgramTemplateExerciseSetRow
			{setTarget}
			{executionType}
			order={index + 1}
			{index}
			onUpdate={updateSetValue}
			onRemove={removeSet}
			canRemove={exactSets.length > 1}
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
