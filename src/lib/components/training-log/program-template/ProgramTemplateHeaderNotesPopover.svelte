<script lang="ts">
	import * as Popover from '$lib/shadcn/popover';
	import { Textarea } from '$lib/shadcn/textarea';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import { CoState } from 'jazz-tools/svelte';
	import { ProgramTemplate } from '$lib/jazz/schema';

	let {
		templateId
	}: {
		templateId: string;
	} = $props();

	const templateState = new CoState(ProgramTemplate, () => templateId);
	const template = $derived(templateState.current.$isLoaded ? templateState.current : undefined);
	const notes = $derived(template?.notes ?? '');

	const handleInput = (value: string) => {
		if (!template) {
			return;
		}
		template.$jazz.set('notes', value.trim());
	};
</script>

<Popover.Root>
	<Popover.Trigger class="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
		<StickyNoteIcon class="size-4" />
	</Popover.Trigger>
	<Popover.Content class="w-72" align="end">
		<div class="grid gap-2">
			<span class="text-muted-foreground text-xs font-medium">Program notes</span>
			<Textarea
				rows={4}
				placeholder="Training block goals, periodization notes..."
				bind:value={() => notes, (v) => handleInput(v)}
			/>
		</div>
	</Popover.Content>
</Popover.Root>
