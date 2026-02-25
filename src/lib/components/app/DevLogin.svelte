<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import { betterAuthClient } from '$lib/auth-client';

	const { onSuccess }: { onSuccess: () => void } = $props();

	const handleDevLogin = () => {
		betterAuthClient.signIn.email(
			{
				email: 'felix@ironkit.com',
				password: 'tester'
			},
			{
				onSuccess
			}
		);
	};
</script>

<div class="mx-auto flex w-full max-w-96 flex-col gap-4">
	<Button onclick={handleDevLogin} variant="outline" class="w-full">Dev Login</Button>
</div>
