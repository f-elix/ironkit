<script lang="ts">
	import { dev } from '$app/environment';
	import { page } from '$app/state';
	import { PAGE__ROOT } from '$lib/ROUTES';
	import Button from '$lib/shadcn/button/button.svelte';

	const showError = dev || page.url.searchParams.get('showError') === '1';
</script>

<div class="flex h-dvh flex-col items-center justify-center gap-1 p-4">
	<h1 class="text-2xl font-bold">Error {page.status}</h1>
	<h2 class="text-lg font-medium">Page not found</h2>
	<Button href={PAGE__ROOT} class="mt-4">Go to home</Button>
	{#if showError}
		<pre class="bg-muted mt-4 w-full overflow-scroll rounded-md p-4 text-sm">{JSON.stringify(
				page.error,
				null,
				2
			)}
		</pre>
	{/if}
</div>
