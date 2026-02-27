<script lang="ts">
	import type { ResolvedPerformance, ProgramWorkoutExerciseTarget } from '$lib/jazz/types';
	import ProgramTemplateExerciseSetRow from '$lib/components/training-log/program-template/ProgramTemplateExerciseSetRow.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import { ProgramWorkoutExerciseTarget as ProgramWorkoutExerciseTargetSchema } from '$lib/jazz/schema';

	let {
		performance,
		executionType
	}: {
		performance: ResolvedPerformance;
		executionType: 'reps' | 'time';
	} = $props();

	const exactSets = $derived(performance.programWorkoutExerciseTargets ?? []);
	const targetExamples = $derived(
		executionType === 'reps'
			? 'Examples: 1 set + 8 reps, 3-4 sets + 10-15 reps'
			: 'Examples: 1 set + 60 sec, 3-4 sets + 30-45 sec'
	);

	const addSet = () => {
		if (!performance.programWorkoutExerciseTargets) {
			return;
		}
		const last = exactSets.at(-1);
		const newTarget = ProgramWorkoutExerciseTargetSchema.create({
			performance,
			targetOrder: (last?.targetOrder ?? -1) + 1,
			targetSetRange: '1',
			targetRepsRange: executionType === 'reps' ? '8' : undefined,
			targetDuration: executionType === 'time' ? '60 sec' : undefined,
			updatedAt: new Date()
		});

		performance.programWorkoutExerciseTargets.$jazz.push(newTarget);
		performance.$jazz.set('updatedAt', new Date());
	};

	const updateSetValue = (
		target: ProgramWorkoutExerciseTarget,
		nextExecutionType: 'reps' | 'time',
		targetSetRange: string,
		targetValue: string
	) => {
		target.$jazz.set('targetSetRange', targetSetRange);
		target.$jazz.set('targetRepsRange', nextExecutionType === 'reps' ? targetValue : undefined);
		target.$jazz.set('targetDuration', nextExecutionType === 'time' ? targetValue : undefined);
		target.$jazz.set('updatedAt', new Date());
	};

	const removeSet = (target: ProgramWorkoutExerciseTarget) => {
		if (!performance.programWorkoutExerciseTargets) {
			return;
		}
		performance.programWorkoutExerciseTargets.$jazz.remove((t) => t.$jazz.id === target.$jazz.id);
		performance.$jazz.set('updatedAt', new Date());
	};
</script>

<div class="border-border/20 ml-1 space-y-0 border-l pt-1 pl-3.5">
	<p class="text-muted-foreground/60 mb-2 text-[11px]">
		Enter a set count/range and a matching target range. {targetExamples}
	</p>
	{#each exactSets as setTarget (setTarget.$jazz.id)}
		<ProgramTemplateExerciseSetRow
			{setTarget}
			{executionType}
			order={setTarget.targetOrder ?? 0}
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
