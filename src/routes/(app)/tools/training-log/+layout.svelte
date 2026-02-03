<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { expoOut } from 'svelte/easing';
	import { crossfade } from 'svelte/transition';
	import * as Sidebar from '$lib/shadcn/sidebar';
	import DumbbellIcon from '@lucide/svelte/icons/dumbbell';
	import ListIcon from '@lucide/svelte/icons/list';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import AddWorkout from '$lib/components/training-log/AddWorkout.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

	const navItems = [
		{
			label: 'Workouts',
			href: '/tools/training-log',
			icon: DumbbellIcon
		},
		{
			label: 'Exercises',
			href: '/tools/training-log/exercises',
			icon: ListIcon
		}
	] as const;

	let { children } = $props();

	const [send, receive] = crossfade({ duration: 500, easing: expoOut });

	// This is used to conditionally apply the view transition name to the training log layout
	// so that it doesn't have a view transition when the page is loaded and when going away from the training log
	let isTrainingLogNav = $state(false);
	beforeNavigate((nav) => {
		isTrainingLogNav = nav.to?.url.pathname.includes(resolve('/(app)/tools/training-log')) ?? false;
	});

	// Check if we're on a workout detail page
	let isWorkoutDetailPage = $derived(page.url.pathname.includes('/workout-'));
</script>

<!-- Desktop Layout with Sidebar -->
<div class="hidden md:contents">
	<Sidebar.Provider>
		<Sidebar.Root variant="inset" class="border-r-0">
			<Sidebar.Header class="border-b p-2">
				<div class="flex items-center gap-4">
					<Button variant="outline" size="icon" href={resolve('/')} aria-label="Back to home">
						<ArrowLeftIcon />
					</Button>
					<h2 class="text-lg font-semibold">Training Log</h2>
				</div>
			</Sidebar.Header>
			<Sidebar.Content>
				<!-- Navigation -->
				<Sidebar.Group>
					<Sidebar.GroupContent>
						<Sidebar.Menu>
							{#each navItems as item}
								{@const Icon = item.icon}
								{@const isActive =
									item.href === '/tools/training-log'
										? page.url.pathname === resolve(item.href) || isWorkoutDetailPage
										: page.url.pathname === resolve(item.href)}
								<Sidebar.MenuItem>
									<Sidebar.MenuButton {isActive}>
										{#snippet child({ props })}
											<a href={resolve(item.href)} {...props}>
												<Icon class="size-4" />
												<span>{item.label}</span>
											</a>
										{/snippet}
									</Sidebar.MenuButton>
								</Sidebar.MenuItem>
							{/each}
						</Sidebar.Menu>
					</Sidebar.GroupContent>
				</Sidebar.Group>
			</Sidebar.Content>
			<Sidebar.Footer class="mt-auto border-t p-2">
				<AddWorkout variant="ghost" class="w-full justify-start">
					<PlusIcon class="size-4" />
					<span>New Workout</span>
				</AddWorkout>
			</Sidebar.Footer>
		</Sidebar.Root>
		<Sidebar.Inset>
			<div
				class="flex grow flex-col p-4"
				style="view-transition-name: {isTrainingLogNav ? 'training-log' : ''};"
			>
				{@render children()}
			</div>
		</Sidebar.Inset>
	</Sidebar.Provider>
</div>

<!-- Mobile Layout -->
<div class="flex flex-col md:hidden" style="height: calc(100dvh - 4rem);">
	<!-- Main content area -->
	<div
		class="flex grow flex-col overflow-y-auto"
		style="view-transition-name: {isTrainingLogNav ? 'training-log' : ''};"
	>
		{@render children()}
	</div>

	<!-- Bottom Navigation - only show on workouts list and exercises pages -->
	{#if !isWorkoutDetailPage}
		<nav
			class="bg-card sticky bottom-0 z-50 w-full border-t"
			style="view-transition-name: training-log-nav;"
		>
			<div class="grid grid-cols-2">
				{#each navItems as item}
					{@const Icon = item.icon}
					{@const isActive = page.url.pathname === resolve(item.href)}
					<a
						href={resolve(item.href)}
						class={[
							'relative flex flex-col items-center gap-1 py-2 transition-colors',
							isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
						]}
					>
						{#if isActive}
							<div
								class="bg-primary absolute inset-x-8 top-0 h-0.5"
								in:send={{ key: 'nav-link-bg' }}
								out:receive={{ key: 'nav-link-bg' }}
							></div>
						{/if}
						<Icon class="relative z-10 size-5" />
						<span class="relative z-10 text-xs font-medium tracking-wide uppercase"
							>{item.label}</span
						>
					</a>
				{/each}
			</div>
		</nav>
	{/if}
</div>
