<script lang="ts">
	import { PAGE__ROOT } from '$lib/ROUTES';
	import Button from '$lib/shadcn/button/button.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';
	import GoogleLogin from '$lib/components/app/GoogleLogin.svelte';
</script>

<div class="flex h-dvh flex-col p-4">
	<Button variant="outline" size="icon" href={PAGE__ROOT} aria-label="Back to home">
		<ArrowLeftIcon />
	</Button>
	<div class="flex grow flex-col items-center justify-center gap-4">
		<h1 class="text-center text-xl font-semibold">Sign in below</h1>
		<GoogleLogin />
	</div>
</div>
