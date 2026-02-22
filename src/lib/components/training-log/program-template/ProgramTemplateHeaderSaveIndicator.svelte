<script lang="ts">
	import { getProgramTemplateHeaderSaveContext } from '$lib/components/training-log/program-template/program-template-header-save.context.svelte';
	import CheckIcon from '@lucide/svelte/icons/check';
	import LoaderIcon from '@lucide/svelte/icons/loader';

	const saveController = getProgramTemplateHeaderSaveContext();
	let saveStatus = $derived(saveController.status);
</script>

<div class="flex h-5 w-14 items-center justify-end">
	{#if saveStatus === 'saving'}
		<span class="text-muted-foreground flex items-center gap-1 text-[11px]">
			<LoaderIcon class="size-3 animate-spin" />
			<span>Saving</span>
		</span>
	{:else if saveStatus === 'saved'}
		<span class="flex items-center gap-1 text-[11px] text-emerald-400">
			<CheckIcon class="size-3" />
			<span>Saved</span>
		</span>
	{/if}
</div>
