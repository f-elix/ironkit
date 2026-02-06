<script lang="ts">
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import Logo from '$lib/components/svg/Logo.svelte';
	import GoogleLoginConvex from '$lib/components/app/GoogleLoginConvex.svelte';

	const auth = useAuth();

	// Redirect to home if already authenticated
	$effect(() => {
		if (auth.isAuthenticated) {
			goto(resolve('/'));
		}
	});
</script>

{#if !auth.isAuthenticated}
	<div class="flex h-dvh flex-col items-center justify-center p-4">
		<div class="flex flex-col items-center gap-6">
			<div class="w-32">
				<Logo />
			</div>
			<h1 class="text-2xl font-bold">Welcome to Ironkit</h1>
			<p class="text-muted-foreground text-center">Sign in to start tracking your workouts</p>
			<GoogleLoginConvex />
		</div>
	</div>
{/if}
