<script lang="ts">
	import { formatDate } from '$lib/ui/formatDate';
	import { ScrollArea } from '$lib/shadcn/scroll-area';
	import Button from '$lib/shadcn/button/button.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import PastPerformanceSets from '$lib/components/training-log/PastPerformanceSets.svelte';
	import { Exercise } from '$lib/jazz/schema';
	import { CoState } from 'jazz-tools/svelte';
	import { today } from '@internationalized/date';
	import { TIMEZONE } from '$lib/constants';

	let { exerciseId }: { exerciseId: string } = $props();

	const exerciseState = new CoState(Exercise, () => exerciseId, {
		resolve: {
			performances: {
				$each: {
					$onError: 'catch'
				}
			}
		}
	});

	const PAGE_SIZE = 10;
	const exercise = $derived(exerciseState.current.$isLoaded ? exerciseState.current : null);
	let visibleCount = $state(PAGE_SIZE);

	$effect(() => {
		exerciseId;
		visibleCount = PAGE_SIZE;
	});

	const sortedPerformanceItems = $derived.by(() => {
		if (!exercise?.performances) {
			return [];
		}

		const todayDate = today(TIMEZONE).toDate(TIMEZONE);

		return exercise.performances
			.filter((performance) => performance.$isLoaded)
			.filter((performance) => {
				const workoutDate = performance.workoutDate;
				if (!workoutDate) {
					return false;
				}
				return workoutDate.getTime() < todayDate.getTime();
			})
			.toSorted((a, b) => (b.workoutDate?.getTime() ?? 0) - (a.workoutDate?.getTime() ?? 0));
	});

	const performanceItems = $derived(sortedPerformanceItems.slice(0, visibleCount));
	const hasMore = $derived(sortedPerformanceItems.length > performanceItems.length);

	const loadMore = () => {
		visibleCount += PAGE_SIZE;
	};
</script>

{#if performanceItems.length}
	<div class="space-y-3">
		<ScrollArea class="h-[50vh]">
			<ul class="divide-border flex flex-col gap-4 divide-y pt-4 pb-2">
				{#each performanceItems as performance (performance.$jazz.id)}
					<li class="flex flex-col gap-3 pb-4">
						<div class="flex flex-col gap-1">
							<h4 class="text-base font-semibold">{formatDate(performance.workoutDate)}</h4>
							{#if performance.note}
								<p class="text-muted-foreground text-sm">{performance.note}</p>
							{/if}
						</div>
						<PastPerformanceSets performanceId={performance.$jazz.id} />
					</li>
				{/each}
			</ul>
		</ScrollArea>
		{#if hasMore}
			<div class="flex justify-center pb-2">
				<Button variant="secondary" size="sm" onclick={loadMore}>Load more</Button>
			</div>
		{/if}
	</div>
{:else if exercise?.$isLoaded}
	<div class="my-7">
		<EmptyState title="No history yet">
			{#snippet description()}
				Log this exercise in a workout to start tracking your progress.
			{/snippet}
		</EmptyState>
	</div>
{:else}
	<div
		class="text-muted-foreground flex h-40 animate-pulse items-center justify-center text-center"
	>
		Loading history...
	</div>
{/if}
