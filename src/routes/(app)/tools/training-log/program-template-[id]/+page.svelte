<script lang="ts">
	import { page } from '$app/state';
	import type { Id } from '$convex/_generated/dataModel';
	import ProgramTemplateEditor from '$lib/components/training-log/program-template/ProgramTemplateEditor.svelte';

	const templateId = page.params.id as Id<'programTemplates'>;
</script>

<ProgramTemplateEditor {templateId} />
