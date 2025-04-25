<script lang="ts">
	import { page } from '$app/state';
	import { PAGE_tools_training_log, PAGE_tools_training_log_exercises } from '$lib/ROUTES';
	import { expoOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';

	const navItems = [
		{
			label: 'Workouts',
			href: PAGE_tools_training_log
		},
		{
			label: 'Exercises',
			href: PAGE_tools_training_log_exercises
		}
	];

	let { children } = $props();

	const [send, receive] = crossfade({ duration: 500, easing: expoOut });
</script>

<nav class="grid grid-cols-2 gap-2 px-4" data-root-transition="skip">
	{#each navItems as item}
		{@const active = page.url.pathname === item.href}
		<a href={item.href} class="relative rounded-md px-4 py-2 text-center">
			{#if active}
				<div
					class="absolute inset-0 rounded-md bg-muted"
					in:send={{ key: 'nav-link-bg' }}
					out:receive={{ key: 'nav-link-bg' }}
				/>
			{/if}
			<span class="relative z-10">
				{item.label}
			</span>
		</a>
	{/each}
</nav>
<div class="mt-4 flex grow flex-col">
	{@render children()}
</div>
