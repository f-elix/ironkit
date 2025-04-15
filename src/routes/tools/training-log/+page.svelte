<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
</script>

<div class="grow px-4">
	<div
		class="flex h-full flex-col items-center justify-center gap-2 rounded-sm border border-dashed p-4 shadow-sm"
	>
		<h2 class="text-center text-2xl font-bold">No workouts yet</h2>
		<p class="mx-auto max-w-64 text-center leading-5 text-muted-foreground">
			Click the button below to create your first workout
		</p>
		<Button class="mt-6">Log workout</Button>
	</div>
</div>
