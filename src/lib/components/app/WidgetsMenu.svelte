<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import Button, { buttonVariants } from '$lib/components/ui/button/button.svelte';
	import * as Drawer from '$lib/components/ui/drawer/index.js';
	import { PAGE_weight_converter } from '$lib/ROUTES';
	import Menu from '@lucide/svelte/icons/menu';
	import WeightIcon from '@lucide/svelte/icons/weight';

	let open = $state(false);

	beforeNavigate(() => {
		open = false;
	});
</script>

<Drawer.Root bind:open>
	<Drawer.Trigger class={buttonVariants({ size: 'icon', variant: 'outline' })}>
		<Menu class="size-4" />
		<span class="sr-only">Widgets menu</span>
	</Drawer.Trigger>
	<Drawer.Content>
		<Drawer.Header>
			<Drawer.Description>Select a tool to get started</Drawer.Description>
		</Drawer.Header>
		<ul class="flex flex-col items-center gap-2 pb-10">
			<li>
				<Button variant="secondary" href={PAGE_weight_converter}>
					<WeightIcon class="size-4" />
					Weight converter
				</Button>
			</li>
		</ul>
	</Drawer.Content>
</Drawer.Root>
