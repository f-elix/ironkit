<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { PUBLIC_TEST_USER_EMAIL, PUBLIC_TEST_USER_PASSWORD } from '$env/static/public';
	import { authClient } from '$lib/auth-client';
	import Button from '$lib/shadcn/button/button.svelte';

	const login = async () => {
		const { data, error } = await authClient.signIn.email(
			{
				email: PUBLIC_TEST_USER_EMAIL,
				password: PUBLIC_TEST_USER_PASSWORD
			},
			{
				onSuccess: () => {
					goto(resolve('/'));
				}
			}
		);
		console.dir({ data, error });
	};
</script>

<Button onclick={login}>Dev Login</Button>
