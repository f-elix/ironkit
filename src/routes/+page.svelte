<script lang="ts">
	import Button from '$lib/components/ui/button/button.svelte';
	import { PAGE_w_weight_converter } from '$lib/ROUTES';
	import WeightIcon from '@lucide/svelte/icons/weight';
</script>

<section class="flex flex-col items-center gap-1 p-4 text-center">
	<h1 class="text-2xl font-bold">Ironkit</h1>
	<p class="text-muted-foreground">Tools for lifters.</p>
</section>

<section class="mt-8">
	<ul class="flex flex-col items-center gap-2">
		<li>
			<Button
				variant="secondary"
				size="lg"
				href={PAGE_w_weight_converter}
				style="view-transition-name: widget-title;"
			>
				<WeightIcon class="size-4" />
				Weight Converter
			</Button>
		</li>
	</ul>
</section>
