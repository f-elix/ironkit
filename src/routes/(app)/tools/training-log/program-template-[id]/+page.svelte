<script lang="ts">
	import { page } from '$app/state';
	import ProgramTemplateEditor from '$lib/components/training-log/program-template/ProgramTemplateEditor.svelte';

	const templateId = $derived(page.params.id!);
</script>

{#key templateId}
	<ProgramTemplateEditor {templateId} />
{/key}
