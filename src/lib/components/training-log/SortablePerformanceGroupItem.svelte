<script lang="ts">
	import { useSortable } from '@dnd-kit-svelte/svelte/sortable';
	import { Accordion } from 'bits-ui';
	import PerformanceGroupSummary from '$lib/components/training-log/PerformanceGroupSummary.svelte';
	import PerformanceGroup from '$lib/components/training-log/PerformanceGroup.svelte';
	import type { Id } from '$convex/_generated/dataModel';

	let {
		performanceGroupId,
		index,
		isSelected,
		dragDisabled
	}: {
		performanceGroupId: Id<'performanceGroups'>;
		index: number;
		isSelected: boolean;
		dragDisabled: boolean;
	} = $props();

	const { ref, isDragging } = useSortable({
		id: performanceGroupId,
		index: () => index,
		disabled: () => dragDisabled
	});
</script>

<li
	class={[
		'flex rounded-lg border shadow-sm',
		isDragging.current && 'ring-accent-foreground ring-1'
	]}
	{@attach ref}
>
	<Accordion.Item value={performanceGroupId} class="grow">
		{#if !isSelected}
			<Accordion.Trigger class="bg-card hover:bg-accent/80 w-full rounded-lg p-3 transition-colors">
				<PerformanceGroupSummary {performanceGroupId} />
			</Accordion.Trigger>
		{/if}
		<Accordion.Content forceMount>
			{#snippet child({ props, open })}
				{#if open}
					<!-- Forcemount so that `displayNote` inside the group is reset -->
					<div {...props}>
						<PerformanceGroup {performanceGroupId} />
					</div>
				{/if}
			{/snippet}
		</Accordion.Content>
	</Accordion.Item>
</li>
