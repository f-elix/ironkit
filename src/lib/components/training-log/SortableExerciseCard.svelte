<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseCardContent from './ExerciseCardContent.svelte';
	import ChevronDown from '@lucide/svelte/icons/chevron-down';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { cn } from '$lib/shadcn/utils';
	import * as Collapsible from '$lib/shadcn/collapsible';

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
		performances.flatMap((p) => p.sets ?? []).filter((s) => s.reps != null && s.reps > 0).length
	);
	let totalSets = $derived(performances.flatMap((p) => p.sets ?? []).length);
	let progress = $derived(totalSets > 0 ? (completedSets / totalSets) * 100 : 0);
</script>

<div
	class={cn(
		'group relative overflow-hidden rounded-xl border transition-all duration-200',
		isDragging.current
			? 'border-primary bg-card z-10 scale-[1.02] opacity-100 shadow-lg'
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
		<Collapsible.Trigger>
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
					<div class="flex items-center gap-2">
						{#if label}
							<span class="text-muted-foreground truncate text-sm font-medium">{label}</span>
						{/if}
					</div>

					{#if performances.length === 1}
						<h3 class="truncate text-lg font-semibold">
							{performances[0]?.exercise?.name ?? 'Select exercise'}
						</h3>
					{:else}
						<div class="flex flex-wrap items-center gap-x-2 gap-y-1">
							{#each performances as perf, i}
								<span class="text-lg font-semibold">
									{perf.exercise?.name ?? 'Select exercise'}{i < performances.length - 1 ? ',' : ''}
								</span>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Delete button -->
				{#if onDelete}
					<button
						class="text-muted-foreground hover:text-destructive flex size-8 items-center justify-center rounded-full transition-colors"
						onclick={(e) => {
							e.stopPropagation();
							onDelete();
						}}
					>
						<Trash2 class="size-4" />
					</button>
				{/if}

				<!-- Stats badge -->
				{#if totalSets > 0}
					<div class="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1">
						<span
							class="font-mono text-sm font-bold tabular-nums"
							class:text-primary={completedSets === totalSets}
						>
							{completedSets}
						</span>
						<span class="text-muted-foreground">/</span>
						<span class="text-muted-foreground font-mono text-sm tabular-nums">{totalSets}</span>
					</div>
				{/if}

				<!-- Expand chevron -->
				<div
					class="bg-muted flex size-10 shrink-0 items-center justify-center rounded-full transition-transform duration-300"
					class:rotate-180={isExpanded}
				>
					<ChevronDown class="text-muted-foreground size-5" />
				</div>
			</div>
		</Collapsible.Trigger>

		<!-- Expanded content -->
		<Collapsible.Content>
			{#if group}
				<div class="border-border border-t">
					<ExerciseCardContent performanceGroup={group} {performances} />
				</div>
			{/if}
		</Collapsible.Content>
	</Collapsible.Root>
</div>
