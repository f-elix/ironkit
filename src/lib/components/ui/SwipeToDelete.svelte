<script lang="ts">
	import { usePan, type GestureCustomEvent } from 'svelte-gestures';
	import Trash from '@lucide/svelte/icons/trash-2';
	import type { Snippet } from 'svelte';

	let {
		ondelete,
		disabled = false,
		children
	}: {
		ondelete: () => void;
		disabled?: boolean;
		children: Snippet;
	} = $props();

	let offsetX = $state(0);
	let isDragging = $state(false);
	let isDeleting = $state(false);
	let startX = $state(0);
	let contentEl = $state<HTMLElement | null>(null);

	const TRANSITION_DURATION = 350;
	const DELETE_THRESHOLD = 0.5;

	function handlePanMove(event: GestureCustomEvent) {
		if (disabled || isDeleting) {
			return;
		}

		const { x } = event.detail;

		offsetX = Math.min(0, x - startX);
	}

	function snapBack() {
		offsetX = 0;
	}

	function performDelete() {
		isDeleting = true;

		if (!contentEl) {
			ondelete();
			return;
		}

		contentEl?.addEventListener(
			'transitionend',
			() => {
				ondelete();
			},
			{ once: true }
		);
	}

	function handlePanUp(event: GestureCustomEvent) {
		if (disabled || isDeleting) {
			return;
		}

		isDragging = false;
		const containerWidth = (event.target as HTMLElement).offsetWidth;
		const ratio = Math.abs(offsetX) / containerWidth;

		if (ratio >= DELETE_THRESHOLD) {
			offsetX = -containerWidth;
			performDelete();
		} else {
			snapBack();
		}
	}

	function handlePanDown(event: GestureCustomEvent) {
		if (disabled || isDeleting) {
			return;
		}
		isDragging = true;
		const { x } = event.detail;
		startX = x;
	}

	const panAttachment = usePan(
		() => {},
		() => ({ delay: 0, touchAction: 'pan-y' }),
		{
			onpanmove: handlePanMove,
			onpanup: handlePanUp,
			onpandown: handlePanDown
		}
	);
</script>

<div
	class="relative overflow-hidden"
	style="--transition-duration: {TRANSITION_DURATION}ms"
	{...panAttachment}
>
	<!-- Swipeable content -->
	<div
		class={[!isDragging && 'ease-out-expo transition-transform duration-(--transition-duration)']}
		style="transform: translateX({offsetX}px);"
		bind:this={contentEl}
	>
		{@render children()}
	</div>
	<!-- Delete button filling the revealed gap -->
	<div
		class={[
			'bg-destructive text-destructive-foreground absolute top-0 right-0 flex h-full items-center justify-center',
			!isDragging && 'ease-out-expo transition-[width] duration-(--transition-duration)'
		]}
		aria-hidden="true"
		style="width: {Math.abs(offsetX)}px;"
	>
		<Trash class="size-5" />
	</div>
</div>
