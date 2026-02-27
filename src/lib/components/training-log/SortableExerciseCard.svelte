<script lang="ts">
	import { createSortable } from '@dnd-kit/svelte/sortable';
	import { CoState } from 'jazz-tools/svelte';
	import { PerformanceGroup as PerformanceGroupSchema } from '$lib/jazz/schema';
	import ExerciseCardContent from '$lib/components/training-log/ExerciseCardContent.svelte';
	import { getPerformanceGroupLabel } from '$lib/training-log/performance-group.utils';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import { cn } from '$lib/shadcn/utils';
	import * as Collapsible from '$lib/shadcn/collapsible';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		performanceGroupId,
		index,
		isExpanded,
		onToggle,
		onNext,
		onRemoveGroup
	}: {
		performanceGroupId: string;
		index: number;
		isExpanded: boolean;
		onToggle: () => void;
		onNext?: () => void;
		onRemoveGroup?: () => void;
	} = $props();

	const performanceGroupState = new CoState(PerformanceGroupSchema, () => performanceGroupId, {
		resolve: {
			performances: {
				$each: {
					exercise: true,
					performanceSets: { $each: true }
				}
			}
		}
	});

	const performanceGroup = $derived(performanceGroupState.current);
	const performances = $derived(
		performanceGroup.$isLoaded ? performanceGroup.performances.filter((p) => p.$isLoaded) : []
	);

	const {
		attach: attachRef,
		attachHandle: attachHandleRef,
		isDragging
	} = $derived(
		createSortable({
			id: performanceGroupId,
			index
		})
	);

	let label = $derived(
		getPerformanceGroupLabel(
			performances.length,
			performanceGroup?.$isLoaded ? performanceGroup.label : undefined
		)
	);

	const completedSets = $derived(
		performances.flatMap((p) => {
			const executionType = p.exercise.executionType;
			const sets = p.performanceSets;
			return sets.filter(
				(s) =>
					(executionType === 'reps' && s.reps != null && s.reps > 0) ||
					(executionType === 'time' && s.durationSeconds != null && s.durationSeconds > 0)
			);
		}).length
	);
	const totalSets = $derived(performances.flatMap((p) => p.performanceSets).length);
	const progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);
</script>

<li
	class={cn(
		'group relative overflow-hidden rounded-xl border transition-[scale,background-color,border-color] duration-200',
		isDragging ? 'border-primary bg-card scale-[1.02]' : 'border-border bg-card hover:bg-card/80'
	)}
	{@attach attachRef}
>
	<!-- Progress bar background -->
	{#if totalSets > 0}
		<div class="bg-muted absolute inset-x-0 top-0 h-1">
			<div class="bg-primary h-full transition-all duration-500" style="width: {progress}%"></div>
		</div>
	{/if}

	<Collapsible.Root open={isExpanded} onOpenChange={onToggle}>
		<!-- Main card header - always visible -->
		<Collapsible.Trigger class="w-full text-left">
			<div class="flex w-full items-center gap-3 p-4">
				<!-- Drag handle -->
				<div
					{@attach attachHandleRef}
					class="flex cursor-grab flex-col gap-0.5 py-2 opacity-30 transition-opacity group-hover:opacity-100"
				>
					<div class="h-0.5 w-4 rounded-full bg-current"></div>
					<div class="h-0.5 w-4 rounded-full bg-current"></div>
				</div>

				<!-- Exercise info -->
				<div class="min-w-0 flex-1">
					{#if label && performances.length > 1}
						<span class="text-muted-foreground text-xs font-medium">
							{label}
						</span>
					{/if}

					{#if performances.length === 1}
						<div class="text-base font-semibold whitespace-normal">
							{performances[0].exercise.name || 'Select exercise'}
						</div>
					{:else}
						<div class="flex flex-col gap-0.5">
							{#each performances as perf, i}
								<div class="flex items-baseline gap-1.5 text-sm font-medium">
									<span
										class="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded text-xs"
									>
										{i + 1}
									</span>
									<span class="whitespace-normal">
										{perf.exercise.name || 'Select exercise'}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Right side: stats and chevron -->
				<div class="ml-auto flex shrink-0 items-center gap-2">
					{#if totalSets > 0}
						<div class="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1">
							<span
								class={[
									'font-mono text-sm font-bold tabular-nums',
									completedSets === totalSets && 'text-primary'
								]}
							>
								{completedSets}
							</span>
							<span class="text-muted-foreground">/</span>
							<span class="text-muted-foreground font-mono text-sm tabular-nums">{totalSets}</span>
						</div>
					{/if}

					<div
						class={[
							'bg-muted flex size-10 items-center justify-center rounded-full transition-transform duration-300',
							isExpanded && 'rotate-180'
						]}
					>
						<ChevronDown class="text-muted-foreground size-5" />
					</div>
				</div>
			</div>
		</Collapsible.Trigger>

		<!-- Expanded content -->
		{#if isExpanded && performanceGroup?.$isLoaded}
			<div transition:slide={{ duration: 200, easing: cubicOut }}>
				<div class="border-border border-t">
					<ExerciseCardContent {performanceGroup} {performances} {onRemoveGroup} {onNext} />
				</div>
			</div>
		{/if}
	</Collapsible.Root>
</li>
