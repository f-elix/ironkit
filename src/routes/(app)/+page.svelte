<script lang="ts">
	import Logo from '$lib/components/svg/Logo.svelte';
	import Button from '$lib/shadcn/button/button.svelte';
	import { tools } from '$lib/data/tools';
</script>

<section class="flex flex-col items-center gap-1 p-4 pt-10 text-center">
	<h1 class="w-32 text-2xl font-bold">
		<Logo />
		<span class="sr-only">Ironkit</span>
	</h1>
	<p class="text-muted-foreground">Tools for lifters.</p>
</section>

<section class="px-4 pt-8 pb-16">
	<ul
		class="mx-auto grid max-w-100 grid-cols-2 gap-2 md:max-w-200 md:grid-cols-3 md:gap-4 lg:max-w-240"
	>
		{#each Object.values(tools) as { Icon, title, href }}
			<li>
				<Button
					variant="secondary"
					size="lg"
					class="aspect-[4/3] h-auto w-full flex-col items-center border bg-gray-900 px-2 text-center whitespace-normal lg:text-xl"
					{href}
				>
					<Icon class="lg:size-8" />
					<span>{title}</span>
				</Button>
			</li>
		{/each}
	</ul>
</section>
