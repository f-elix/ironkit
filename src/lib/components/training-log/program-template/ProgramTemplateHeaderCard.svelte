<script lang="ts">
	import { api } from '$convex/_generated/api';
	import type { Doc } from '$convex/_generated/dataModel';
	import type {
		ProgramTemplateDraft,
		ProgramTemplateStatus
	} from '$lib/components/training-log/program-template/program-template-editor.types';
	import Badge from '$lib/shadcn/badge/badge.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import Input from '$lib/shadcn/input/input.svelte';
	import Label from '$lib/shadcn/label/label.svelte';
	import { Textarea } from '$lib/shadcn/textarea';
	import { useConvexClient } from 'convex-svelte';
	import { toast } from 'svelte-sonner';

	let { template }: { template: Doc<'programTemplates'> } = $props();

	const client = useConvexClient();

	let draft = $state<ProgramTemplateDraft>({});
	let isSaving = $state(false);

	let nameValue = $derived(draft.name ?? template.name);
	let notesValue = $derived(draft.notes ?? template.notes ?? '');
	let totalWeeksValue = $derived(draft.totalWeeks ?? template.totalWeeks);
	let statusValue = $derived((draft.status ?? template.status) as ProgramTemplateStatus);

	const normalizePositiveInt = (value: number, fallback = 1) => {
		if (!Number.isFinite(value)) {
			return fallback;
		}
		return Math.max(1, Math.floor(value));
	};

	const toErrorMessage = (error: unknown, fallback: string) => {
		if (error instanceof Error && error.message) {
			return error.message;
		}
		return fallback;
	};

	const setDraftField = <K extends keyof ProgramTemplateDraft>(
		field: K,
		value: ProgramTemplateDraft[K]
	) => {
		draft = {
			...draft,
			[field]: value
		};
	};

	let savePayload = $derived({
		name: nameValue.trim() || 'Untitled program',
		notes: notesValue.trim(),
		totalWeeks: normalizePositiveInt(totalWeeksValue, 1),
		status: statusValue
	});

	let hasUnsavedChanges = $derived.by(() => {
		return (
			savePayload.name !== (template.name.trim() || 'Untitled program') ||
			savePayload.notes !== (template.notes ?? '').trim() ||
			savePayload.totalWeeks !== normalizePositiveInt(template.totalWeeks, 1) ||
			savePayload.status !== template.status
		);
	});

	const saveTemplate = async (statusOverride?: ProgramTemplateStatus) => {
		if (isSaving) {
			return;
		}
		const payload = {
			...savePayload,
			status: statusOverride ?? savePayload.status
		};
		if (!hasUnsavedChanges && statusOverride === undefined) {
			toast.message('No template changes to save.');
			return;
		}
		isSaving = true;
		try {
			await client.mutation(api.programTemplates.update, {
				id: template._id,
				...payload
			});
			draft = payload;
			toast.success('Template saved.');
		} catch (error) {
			toast.error(toErrorMessage(error, 'Could not update template.'));
		} finally {
			isSaving = false;
		}
	};

	const switchStatus = async (status: ProgramTemplateStatus) => {
		setDraftField('status', status);
		await saveTemplate(status);
	};
</script>

<section class="from-card via-card/95 to-muted/40 rounded-2xl border bg-linear-to-br p-4 shadow-sm">
	<div class="flex flex-col gap-4">
		<div class="flex flex-wrap items-start justify-between gap-3">
			<div class="space-y-1">
				<p class="text-muted-foreground text-xs font-medium tracking-wide uppercase">
					Program template
				</p>
				<h1 class="text-2xl leading-tight font-semibold">
					{nameValue.trim() || 'Untitled program'}
				</h1>
			</div>
			<Badge variant={statusValue === 'archived' ? 'secondary' : 'default'}>{statusValue}</Badge>
		</div>

		<div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
			<Label class="grid gap-1.5">
				<span class="text-xs font-medium">Name</span>
				<Input
					value={nameValue}
					oninput={(event) => {
						setDraftField('name', event.currentTarget.value);
					}}
				/>
			</Label>
			<Label class="grid gap-1.5">
				<span class="text-xs font-medium">Total weeks</span>
				<Input
					type="number"
					min="1"
					value={totalWeeksValue}
					oninput={(event) => {
						setDraftField('totalWeeks', normalizePositiveInt(event.currentTarget.valueAsNumber, 1));
					}}
				/>
			</Label>
			<Label class="grid gap-1.5 md:col-span-2 xl:col-span-2">
				<span class="text-xs font-medium">Notes</span>
				<Textarea
					rows={2}
					value={notesValue}
					oninput={(event) => {
						setDraftField('notes', event.currentTarget.value);
					}}
				/>
			</Label>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			<Button
				variant="default"
				onclick={() => {
					saveTemplate();
				}}
				disabled={isSaving || !hasUnsavedChanges}
			>
				{isSaving ? 'Saving...' : 'Save template'}
			</Button>
			<Button
				variant={statusValue === 'draft' ? 'default' : 'outline'}
				onclick={() => switchStatus('draft')}
				disabled={isSaving}
			>
				Set Draft
			</Button>
			<Button
				variant={statusValue === 'archived' ? 'secondary' : 'outline'}
				onclick={() => switchStatus('archived')}
				disabled={isSaving}
			>
				Archive
			</Button>
		</div>
	</div>
</section>
