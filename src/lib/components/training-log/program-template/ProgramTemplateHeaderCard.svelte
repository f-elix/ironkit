<script lang="ts">
	import ProgramTemplateHeaderNotesPopover from '$lib/components/training-log/program-template/ProgramTemplateHeaderNotesPopover.svelte';
	import ProgramTemplateHeaderRunAction from '$lib/components/training-log/program-template/ProgramTemplateHeaderRunAction.svelte';
	import ProgramTemplateHeaderStatusMenu from '$lib/components/training-log/program-template/ProgramTemplateHeaderStatusMenu.svelte';
	import { getProgramTemplateEditorContext } from '$lib/components/training-log/program-template/program-template-editor.context.svelte.js';
	import Input from '$lib/shadcn/input/input.svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';
	import { CoState } from 'jazz-tools/svelte';

	const editorState = getProgramTemplateEditorContext();

	const templateState = new CoState(ProgramTemplate, () => editorState.templateId);
	let template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const handleNameChange = (value: string) => {
		if (!template) {
			return;
		}
		const name = value.trim() || 'Untitled program';
		template.$jazz.set('name', name);
	};

	const handleTotalWeeksChange = (value: number) => {
		if (!template) {
			return;
		}
		const totalWeeks = normalizePositiveInt(value, 1);
		template.$jazz.set('totalWeeks', totalWeeks);
	};
</script>

{#if template}
	<header
		class="border-border/40 bg-card/30 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 backdrop-blur-sm"
	>
		<input
			type="text"
			value={template.name ?? ''}
			class="placeholder:text-muted-foreground min-w-0 flex-1 basis-40 bg-transparent text-base font-semibold outline-none"
			placeholder="Program name"
			oninput={(e) => handleNameChange(e.currentTarget.value)}
		/>

		<div class="flex items-center gap-3">
			<div class="flex items-center gap-1.5">
				<Input
					type="number"
					min="1"
					value={template.totalWeeks ?? 1}
					class="h-7 w-12 text-center text-xs tabular-nums"
					oninput={(e) => handleTotalWeeksChange(e.currentTarget.valueAsNumber)}
				/>
				<span class="text-muted-foreground text-xs">wk</span>
			</div>

			<ProgramTemplateHeaderStatusMenu templateId={template.$jazz.id} />

			<ProgramTemplateHeaderRunAction status={template.status} />

			<ProgramTemplateHeaderNotesPopover templateId={template.$jazz.id} />
		</div>
	</header>
{/if}
