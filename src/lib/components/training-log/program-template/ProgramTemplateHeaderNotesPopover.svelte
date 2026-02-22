<script lang="ts">
	import type { Id } from '$convex/_generated/dataModel';
	import { api } from '$convex/_generated/api';
	import { getProgramTemplateHeaderSaveContext } from '$lib/components/training-log/program-template/program-template-header-save.context.svelte';
	import * as Popover from '$lib/shadcn/popover';
	import { Textarea } from '$lib/shadcn/textarea';
	import StickyNoteIcon from '@lucide/svelte/icons/sticky-note';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let {
		templateId,
		notes
	}: {
		templateId: Id<'programTemplates'>;
		notes?: string;
	} = $props();

	const client = useConvexClient();
	const saveController = getProgramTemplateHeaderSaveContext();
	let draftNotes = $state(notes ?? '');
	let lastSavedNotes = $state((notes ?? '').trim());
	let isDirty = $state(false);

	$effect(() => {
		const incoming = notes ?? '';
		if (!isDirty) {
			draftNotes = incoming;
			lastSavedNotes = incoming.trim();
		}
	});

	const hasChanges = () => draftNotes.trim() !== lastSavedNotes;

	const save = async () => {
		if (!hasChanges()) {
			isDirty = false;
			return;
		}
		const nextNotes = draftNotes.trim();
		try {
			await saveController.run(async () => {
				await client.mutation(api.programTemplates.update, {
					id: templateId,
					notes: nextNotes
				});
			});
			draftNotes = nextNotes;
			lastSavedNotes = nextNotes;
			isDirty = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Could not save template notes.');
		}
	};

	const handleInput = (value: string) => {
		draftNotes = value;
		isDirty = true;
		saveController.queueDebounced('template-notes', {
			shouldSave: hasChanges,
			save
		});
	};

	const flushSave = () => {
		saveController.flushDebounced('template-notes', {
			shouldSave: hasChanges,
			save
		});
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
				value={draftNotes}
				oninput={(e) => handleInput(e.currentTarget.value)}
				onblur={flushSave}
			/>
		</div>
	</Popover.Content>
</Popover.Root>
