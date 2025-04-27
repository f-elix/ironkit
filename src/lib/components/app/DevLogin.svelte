<script lang="ts">
	import { PUBLIC_TEST_USER_EMAIL, PUBLIC_TEST_USER_PASSWORD } from '$env/static/public';
	import { supabase } from '$lib/db/supabase';
	import Button from '$lib/shadcn/button/button.svelte';

	const login = async () => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: PUBLIC_TEST_USER_EMAIL,
			password: PUBLIC_TEST_USER_PASSWORD
		});
		console.dir({ data, error });
	};
</script>

<Button onclick={login}>Dev Login</Button>
