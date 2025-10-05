<script lang="ts">
	import { resolve } from '$app/paths';
	import Button from '$lib/shadcn/button/button.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import GoogleLogin from '$lib/components/app/GoogleLogin.svelte';
	import DevLogin from '$lib/components/app/DevLogin.svelte';
	import { dev } from '$app/environment';
</script>

<div class="flex h-dvh flex-col p-4">
	<Button variant="outline" size="icon" href={resolve('/')} aria-label="Back to home">
		<ArrowLeftIcon />
	</Button>
	<div class="flex grow flex-col items-center justify-center gap-4">
		<h1 class="text-center text-xl font-semibold">Sign in below</h1>
		<GoogleLogin />
		{#if dev}
			<DevLogin />
		{/if}
	</div>
</div>
