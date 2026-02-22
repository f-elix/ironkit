<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import type { Id } from '$convex/_generated/dataModel';
	import ExerciseSelection from './ExerciseSelection.svelte';
	import ExerciseInfoDialog from './ExerciseInfoDialog.svelte';
	import UnitSelector from '$lib/components/ui/UnitSelector.svelte';
	import ExerciseHistoryDialog from './ExerciseHistoryDialog.svelte';
	import * as Dialog from '$lib/shadcn/dialog';
	import { buttonVariants } from '$lib/shadcn/button';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Button from '$lib/shadcn/button/button.svelte';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { PerformanceWithRelations } from '$lib/db/types';

	let {
		performance,
		showDeleteButton,
		onDelete
	}: {
		performance: PerformanceWithRelations;
		showDeleteButton: boolean;
		onDelete: (performanceId: Id<'performances'>) => void | Promise<void>;
	} = $props();

	const client = useConvexClient();
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-baseline gap-2">
		<ExerciseSelection
			onExerciseAdded={async (exerciseId) => {
				await client.mutation(api.performances.update, {
					id: performance._id,
					exerciseId
				});
			}}
		>
			{#snippet trigger()}
				<Dialog.Trigger
					class={buttonVariants({
						variant: 'ghost',
						class: 'h-auto min-w-0 flex-1 justify-start p-1 text-left'
					})}
				>
					<span class="text-lg font-semibold whitespace-normal">
						{performance.exercise?.name ?? 'Select exercise'}
					</span>
				</Dialog.Trigger>
			{/snippet}
		</ExerciseSelection>
		{#if performance.exercise}
			<ExerciseInfoDialog exercise={performance.exercise}>
				{#snippet trigger()}
					<Dialog.Trigger
						class={buttonVariants({
							variant: 'ghost',
							size: 'icon',
							class: 'size-8 shrink-0'
						})}
						aria-label="Edit exercise details"
					>
						<Pencil class="size-4" />
					</Dialog.Trigger>
				{/snippet}
			</ExerciseInfoDialog>
		{/if}
		{#if showDeleteButton}
			<Button
				variant="ghost"
				size="icon"
				class="text-muted-foreground hover:text-destructive size-8"
				onclick={() => onDelete(performance._id)}
			>
				<Trash2 class="size-4" />
			</Button>
		{/if}
	</div>
	<div class="flex items-center gap-2">
		{#if performance.exercise}
			<ExerciseHistoryDialog exerciseId={performance.exerciseId} />
		{/if}
		<UnitSelector
			value={performance.weightUnit}
			onValueChange={(unit) => {
				client.mutation(api.performances.update, {
					id: performance._id,
					weightUnit: unit
				});
			}}
		/>
	</div>
</div>
