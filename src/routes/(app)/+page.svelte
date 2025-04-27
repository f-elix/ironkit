<script lang="ts">
	import Logo from '$lib/components/svg/Logo.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
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
	<ul class="grid grid-cols-2 gap-4 px-4">
		{#each Object.values(tools) as { Icon, title, href }}
			<li>
				<Button
					variant="secondary"
					size="lg"
					class="h-24 w-full whitespace-normal border bg-gray-900"
					{href}
				>
					<span
						class="flex w-full flex-col items-center gap-2 text-center"
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
