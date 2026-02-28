<script lang="ts">
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import * as DropdownMenu from '$lib/shadcn/dropdown-menu';
	import {
		PROGRAM_TEMPLATE_STATUS_OPTIONS,
		getProgramTemplateStatusBadgeVariant,
		type ProgramTemplateStatus
	} from '$lib/training-log/program-template-status';
	import CheckIcon from '@lucide/svelte/icons/check';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	let {
		templateId
	}: {
		templateId: string;
	} = $props();

	const templateState = new CoState(ProgramTemplate, () => templateId);
	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);
	const status = $derived(template?.status ?? 'draft');

	let statusBadgeVariant = $derived(getProgramTemplateStatusBadgeVariant(status));

	const setStatus = (next: ProgramTemplateStatus) => {
		if (status === next || !template) {
			return;
		}
		template.$jazz.set('status', next);
	};
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger class="shrink-0">
		<Badge variant={statusBadgeVariant} class="cursor-pointer capitalize select-none">
			{status}
		</Badge>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content align="end">
		{#each PROGRAM_TEMPLATE_STATUS_OPTIONS as option (option.value)}
			<DropdownMenu.Item onSelect={() => setStatus(option.value)}>
				{#if status === option.value}
					<CheckIcon class="size-4" />
				{:else}
					<span class="size-4"></span>
				{/if}
				{option.label}
			</DropdownMenu.Item>
		{/each}
	</DropdownMenu.Content>
</DropdownMenu.Root>
