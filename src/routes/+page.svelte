<script lang="ts">
	import Logo from '$lib/components/svg/Logo.svelte';
	import Button from '$lib/components/ui/button/button.svelte';
	import { tools } from '$lib/data/tools';
	import { viewTransitionName } from '$lib/ui/viewTransitionName';
</script>

<section class="flex flex-col items-center gap-1 p-4 pt-10 text-center">
	<h1 class="w-32 text-2xl font-bold">
		<Logo />
		<span class="sr-only">Ironkit</span>
	</h1>
	<p class="text-muted-foreground">Tools for lifters.</p>
</section>

<section class="mt-8">
	<ul class="flex flex-col gap-6 px-10">
		{#each Object.values(tools) as { Icon, title, href }}
			<li>
				<Button variant="outline" size="lg" class="w-full" {href}>
					<span
						class="flex items-center gap-2"
						style="view-transition-name: {viewTransitionName(title)};"
					>
						<Icon class="size-4" />
						<span>{title}</span>
					</span>
				</Button>
			</li>
		{/each}
	</ul>
</section>
