<script lang="ts">
	import { formatDate } from '$lib/ui/formatDate';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import type { Workout } from '$lib/jazz/types';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { now } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';
	import PerformanceSetSummary from '$lib/components/training-log/PerformanceSetSummary.svelte';
	import { Account } from '$lib/jazz/schema';
	import { AccountCoState } from 'jazz-tools/svelte';

	let { exerciseId, currentWorkout }: { exerciseId: string; currentWorkout?: Maybe<Workout> } =
		$props();

	const account = new AccountCoState(Account, {
		resolve: {
			root: {
				workouts: {
					$each: {
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
				}
			}
		}
	});

	const root = $derived(account.current.$isLoaded ? account.current.root : null);

	const performanceItems = $derived.by(() => {
		if (!root) {
			return [];
		}

		const maxDate = now(TIMEZONE).toDate();

		return root.workouts
			.flatMap((workout) =>
				workout.performanceGroups.flatMap((group) =>
					group.performances
						.filter(
							(performance) =>
								performance.exercise.$isLoaded &&
								performance.exercise.$jazz.id === exerciseId &&
								!(currentWorkout && workout.$jazz.id === currentWorkout.$jazz.id) &&
								(currentWorkout || workout.date <= maxDate)
						)
						.map((performance) => ({ performance, workout }))
				)
			)
			.toSorted((a, b) => b.workout.date.getTime() - a.workout.date.getTime());
	});
</script>

{#if performanceItems.length}
	<ScrollArea class="h-[50vh]">
		<ul class="divide-border flex flex-col gap-4 divide-y pt-4 pb-7">
			{#each performanceItems as { performance, workout } (performance.$jazz.id)}
				{@const sets = performance.performanceSets.$isLoaded
					? Array.from(performance.performanceSets).filter((s) => s.$isLoaded)
					: []}
				{#if sets.length}
					<li class="flex flex-col gap-3 pb-4">
						<div class="flex flex-col gap-1">
							<h4 class="text-base font-semibold">{formatDate(workout.date)}</h4>
							{#if performance.note}
								<p class="text-muted-foreground text-sm">{performance.note}</p>
							{/if}
						</div>
						<ul class="flex flex-col gap-2">
							{#each sets as set, i (set.$jazz.id)}
								<li class="flex w-full items-baseline gap-2">
									<PerformanceSetSummary {set} {performance} order={i + 1} />
								</li>
							{/each}
						</ul>
					</li>
				{/if}
			{/each}
		</ul>
	</ScrollArea>
{:else}
	<div class="my-7">
		<EmptyState title="No history yet">
			{#snippet description()}
				Log this exercise in a workout to start tracking your progress.
			{/snippet}
		</EmptyState>
	</div>
{/if}
