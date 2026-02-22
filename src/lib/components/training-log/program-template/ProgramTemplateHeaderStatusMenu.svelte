<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';
	import { api } from '$convex/_generated/api';
	import { getProgramTemplateHeaderSaveContext } from '$lib/components/training-log/program-template/program-template-header-save.context.svelte';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import {
		PROGRAM_TEMPLATE_STATUS_OPTIONS,
		getProgramTemplateStatusBadgeVariant,
		type ProgramTemplateStatus
	} from '$lib/training-log/program-template-status';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		templateId,
		status
	}: {
		templateId: Id<'programTemplates'>;
		status: ProgramTemplateStatus;
	} = $props();

	const client = useConvexClient();
	const saveController = getProgramTemplateHeaderSaveContext();
	let selectedStatus = $derived(status);
	let isUpdating = $state(false);
	let statusBadgeVariant = $derived(getProgramTemplateStatusBadgeVariant(selectedStatus));

	const setStatus = async (next: ProgramTemplateStatus) => {
		if (isUpdating || selectedStatus === next) {
			return;
		}
		const previous = selectedStatus;
		selectedStatus = next;
		isUpdating = true;
		try {
			await saveController.run(async () => {
				await client.mutation(api.programTemplates.update, {
					id: templateId,
					status: next
				});
			});
		} catch (error) {
			selectedStatus = previous;
			toast.error(error instanceof Error ? error.message : 'Could not save template status.');
		} finally {
			isUpdating = false;
		}
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="shrink-0">
		<Badge variant={statusBadgeVariant} class="cursor-pointer capitalize select-none">
			{selectedStatus}
		</Badge>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#each PROGRAM_TEMPLATE_STATUS_OPTIONS as option (option.value)}
			<DropdownMenu.Item onSelect={() => setStatus(option.value)}>
				{#if selectedStatus === option.value}
					<CheckIcon class="size-4" />
				{:else}
					<span class="size-4"></span>
				{/if}
				{option.label}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
