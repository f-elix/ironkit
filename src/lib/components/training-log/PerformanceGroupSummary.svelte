<script lang="ts">
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { DEFAULT_EXERCISE_EXECUTION_TYPE, DEFAULT_EXERCISE_LOAD_TYPE } from '$lib/constants';

	import type { Id } from '$convex/_generated/dataModel';

	let { performanceGroupId }: { performanceGroupId: Id<'performanceGroups'> } = $props();

	const query = useQuery(api.performanceGroups.getById, { id: performanceGroupId });

	let performanceGroup = $derived(query.data);
	let label = $derived(performanceGroup?.label);
	let performances = $derived(performanceGroup?.performances ?? []);

	// Auto-generate group type badge based on exercise count
	let autoGroupType = $derived.by(() => {
		const count = performances.length;
		if (count === 2) {
			return 'Superset';
		}
		if (count === 3) {
			return 'Triset';
		}
		if (count >= 4) {
			return 'Circuit';
		}
		return null;
	});

	// Use custom label if provided, otherwise use auto-generated type
	let displayBadge = $derived(label || autoGroupType);

	// Check if this is a multi-exercise group
	let isMultiExercise = $derived(performances.length > 1);

	// Filter valid sets for a performance
	const filterValidSets = (sets: (typeof performances)[number]['sets']) =>
		sets?.filter(
			(set) =>
				(set.weight && set.weight > 0) ||
				(set.reps && set.reps > 0) ||
				(set.durationSeconds && set.durationSeconds > 0)
		) ?? [];

	// Compute rounds by zipping sets across performances by index
	let rounds = $derived.by(() => {
		// Get filtered sets for each performance
		const performanceSets = performances.map((p) => ({
			performance: p,
			sets: filterValidSets(p.sets)
		}));

		// Find max number of sets across all performances
		const maxSets = Math.max(...performanceSets.map((p) => p.sets.length), 0);

		// Create rounds by grouping sets at the same index
		return Array.from({ length: maxSets }, (_, roundIndex) =>
			performanceSets
				.map(({ performance, sets }) => ({
					performance,
					set: sets[roundIndex]
				}))
				.filter((item) => item.set != null)
		);
	});

	// Helper to format set details
	const formatSetDetails = (
		set: NonNullable<(typeof performances)[number]['sets']>[number],
		performance: (typeof performances)[number]
	) => {
		const exercise = performance.exercise;
		const executionType = exercise?.executionType ?? DEFAULT_EXERCISE_EXECUTION_TYPE;
		const loadType = exercise?.loadType ?? DEFAULT_EXERCISE_LOAD_TYPE;
		const weightUnit = performance.weightUnit;
		const workout = performance.workout;
		const bodyweight = workout?.bodyweight ?? 0;
		const bodyweightUnit = workout?.bodyweightUnit ?? 'lbs';

		const reps = set.reps ?? 0;
		const duration = set.durationSeconds ?? 0;
		const weight = set.weight ?? 0;

		let repsPart = '';
		if (executionType === 'reps') {
			repsPart = `${reps}`;
		} else if (executionType === 'time') {
			repsPart = `${duration} sec.`;
		}

		let weightPart = '';
		if (loadType === 'bodyweight') {
			weightPart = `bodyweight (${bodyweight} ${bodyweightUnit})`;
			if (weight > 0) {
				weightPart += ` + ${weight} ${weightUnit}`;
			} else if (weight < 0) {
				weightPart += ` - ${Math.abs(weight)} ${weightUnit}`;
			}
		} else {
			weightPart = `${weight} ${weightUnit}`;
		}

		return `${repsPart} × ${weightPart}`;
	};
</script>

<div class="flex w-full flex-col items-start gap-3 py-2 text-left whitespace-normal">
	{#if displayBadge && isMultiExercise}
		<Badge variant="secondary" class="text-xs">{displayBadge}</Badge>
	{/if}

	{#if isMultiExercise}
		<!-- Multi-exercise: round-based layout showing execution order -->
		<ol class="flex w-full flex-col gap-3">
			{#each rounds as round, roundIndex}
				<li class="flex items-start gap-2">
					<!-- Round number -->
					<div
						class="bg-foreground text-background grid size-5 shrink-0 place-items-center rounded-full text-sm font-bold"
					>
						{roundIndex + 1}
					</div>
					<!-- Sets in this round -->
					<div class="border-foreground/50 flex w-full flex-col gap-1 rounded border p-2 text-sm">
						{#each round as { performance, set } (set._id)}
							{@const exercise = performance.exercise}
							<div class="flex items-baseline justify-between gap-2">
								<span class="font-medium">{exercise?.name}</span>
								<span class="text-muted-foreground shrink-0">
									{formatSetDetails(set, performance)}
								</span>
							</div>
							{#if set.note}
								<p class="text-muted-foreground text-xs">{set.note}</p>
							{/if}
						{/each}
					</div>
				</li>
			{/each}
		</ol>
	{:else}
		<!-- Single exercise: show full details -->
		{#each performances as performance (performance._id)}
			{@const exercise = performance.exercise}
			{@const sets = filterValidSets(performance.sets)}
			{@const note = performance.note}
			<div class="flex w-full flex-col gap-3">
				<div>
					<p class="text-base font-semibold">
						{exercise?.name}
					</p>
					{#if note}
						<p class="text-muted-foreground text-sm whitespace-normal">{note}</p>
					{/if}
				</div>
				{#if sets.length}
					<ol class="flex flex-col gap-1.5">
						{#each sets as set, i (set._id)}
							<li>
								<PerformanceSetSummary {set} {performance} order={i + 1} />
							</li>
						{/each}
					</ol>
				{/if}
			</div>
		{/each}
	{/if}
</div>
