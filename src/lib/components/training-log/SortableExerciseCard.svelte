<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseCardContent from '$lib/components/training-log/ExerciseCardContent.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { cn } from '$lib/shadcn/utils';
	import * as Collapsible from '$lib/shadcn/collapsible';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';

	let {
		performanceGroup,
		index,
		isExpanded,
		onToggle,
		onDelete
	}: {
		performanceGroup: { _id: Id<'performanceGroups'> };
		index: number;
		isExpanded: boolean;
		onToggle: () => void;
		onDelete?: () => void;
	} = $props();

	const { ref, isDragging } = useSortable({
		id: performanceGroup._id,
		index: () => index
	});

	const query = useQuery(api.performanceGroups.getById, { id: performanceGroup._id });
	const group = $derived(query.data);
	const performances = $derived(group?.performances ?? []);

	let label = $derived.by(() => {
		if (group?.label) {
			return group.label;
		}
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

	let completedSets = $derived(
		performances.flatMap((p) => {
			const executionType = p.exercise?.executionType ?? 'reps';
			return (p.sets ?? []).filter(
				(s) =>
					(executionType === 'reps' && s.reps != null && s.reps > 0) ||
					(executionType === 'time' && s.durationSeconds != null && s.durationSeconds > 0)
			);
		}).length
	);
	let totalSets = $derived(performances.flatMap((p) => p.sets ?? []).length);
	let progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);
</script>

<li
	class={cn(
		'group relative overflow-hidden rounded-xl border transition-[transform,background-color,border-color] duration-200',
		isDragging.current
			? 'border-primary bg-card z-10 scale-[1.02]'
			: 'border-border bg-card hover:bg-card/80'
	)}
	{@attach ref}
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
					class="flex cursor-grab flex-col gap-0.5 opacity-30 transition-opacity group-hover:opacity-100"
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
							{performances[0]?.exercise?.name ?? 'Select exercise'}
						</div>
					{:else}
						<div class="flex flex-col gap-0.5">
							{#each performances as perf, i}
								<div class="flex items-center gap-1.5 text-sm font-medium">
									<span
										class="bg-muted text-muted-foreground flex size-4 shrink-0 items-center justify-center rounded text-xs"
									>
										{i + 1}
									</span>
									<span class="whitespace-normal">{perf.exercise?.name ?? 'Select exercise'}</span>
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
		{#if isExpanded && group}
			<div transition:slide={{ duration: 200, easing: cubicOut }}>
				<div class="border-border border-t">
					<ExerciseCardContent performanceGroup={group} {performances} />
				</div>

				<!-- Delete action -->
				{#if onDelete}
					<div class="border-border border-t px-4 py-3">
						<button
							class="text-destructive hover:bg-destructive/10 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors"
							onclick={onDelete}
						>
							<Trash2 class="size-4" />
							Remove
						</button>
					</div>
				{/if}
			</div>
		{/if}
	</Collapsible.Root>
</li>
