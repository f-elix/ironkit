<script lang="ts">
	import Button from '$lib/shadcn/button/button.svelte';
	import { betterAuthClient } from '$lib/auth-client';
	import { PUBLIC_TEST_USER_EMAIL, PUBLIC_TEST_USER_PASSWORD } from '$env/static/public';

	const handleDevLogin = () => {
		betterAuthClient.signIn.email({
			email: PUBLIC_TEST_USER_EMAIL,
			password: PUBLIC_TEST_USER_PASSWORD
		});
	};
</script>

<div class="mx-auto flex w-full max-w-96 flex-col gap-4">
	<Button onclick={handleDevLogin} variant="outline" class="w-full">Dev Login</Button>
</div>
