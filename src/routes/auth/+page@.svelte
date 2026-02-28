<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/svg/Logo.svelte';
	import GoogleLogin from '$lib/components/app/GoogleLogin.svelte';
	import { useIsAuthenticated } from 'jazz-tools/svelte';
	import { dev } from '$app/environment';
	import DevLogin from '$lib/components/app/DevLogin.svelte';

	const isAuthenticated = useIsAuthenticated();

	// Redirect to home if already authenticated
	$effect(() => {
		if (isAuthenticated.current) {
			goto(resolve('/'));
		}
	});
</script>

{#if !isAuthenticated.current}
	<div class="flex h-dvh flex-col items-center justify-center p-4">
		<div class="flex flex-col items-center gap-6">
			<div class="w-32">
				<Logo />
			</div>
			<h1 class="text-2xl font-bold">Welcome to Ironkit</h1>
			<p class="text-muted-foreground text-center">Sign in to start tracking your workouts</p>
			<GoogleLogin />
			{#if dev}
				<DevLogin />
			{/if}
		</div>
	</div>
{/if}
