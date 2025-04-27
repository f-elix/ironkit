<script lang="ts">
	import WorkoutInfoDialog from '$lib/components/training-log/WorkoutInfoDialog.svelte';
	import { Button } from '$lib/shadcn/button';
	import { PlusIcon } from '@lucide/svelte';
</script>

<WorkoutInfoDialog>
	{#snippet trigger({ props })}
		<Button {...props} size="lg">
			<PlusIcon />
			New workout
		</Button>
	{/snippet}
</WorkoutInfoDialog>
