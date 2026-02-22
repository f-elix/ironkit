<script lang="ts">
	import { api } from '$convex/_generated/api';
	import ProgramTemplateHeaderMetadataEditor from '$lib/components/training-log/program-template/ProgramTemplateHeaderMetadataEditor.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import { setProgramTemplateHeaderSaveContext } from '$lib/components/training-log/program-template/program-template-header-save.context.svelte';
	import { useQuery } from 'convex-svelte';

	const editorState = getProgramTemplateEditorContext();
	setProgramTemplateHeaderSaveContext();
	const templateQuery = useQuery(api.programTemplates.getById, () => ({
		id: editorState.templateId
	}));
	let template = $derived(templateQuery.data ?? null);
</script>

{#if template}
	<ProgramTemplateHeaderMetadataEditor {template} />
{:else}
	<header
		class="border-border/40 bg-card/30 flex h-14 items-center rounded-xl border px-4 py-2.5 backdrop-blur-sm"
	>
		<div class="bg-muted/40 h-4 w-40 animate-pulse rounded"></div>
	</header>
{/if}
