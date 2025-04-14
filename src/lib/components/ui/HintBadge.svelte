<script lang="ts">
	import * as Dialog from '$lib/shadcn/dialog';
	import * as Tooltip from '$lib/shadcn/tooltip';
	import InfoIcon from '@lucide/svelte/icons/info';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import { Button } from '$lib/shadcn/button';
	import type { Snippet } from 'svelte';

	let {
		type = 'info',
		text,
		children
	}: { type?: 'info' | 'help'; text?: string; children?: Snippet } = $props();

	const label = type === 'info' ? 'More information' : 'Help';
	const iconSize = '1em';
</script>

{#if text || children}
	<span class="hidden items-center touch:inline-flex">
		<Dialog.Root>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<button {...props} type="button" class="text-muted-foreground" aria-label={label}>
						{#if type === 'info'}
							<InfoIcon size={iconSize} />
						{:else}
							<CircleHelpIcon size={iconSize} />
						{/if}
					</button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content
				class="max-w-72 rounded-sm border-none bg-accent p-4 text-secondary-foreground [&_[data-dialog-close]:not(.close-btn)]:hidden"
			>
				<div class="flex flex-col gap-8">
					{#if text}
						<p>{text}</p>
					{:else}
						{@render children?.()}
					{/if}
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} class="close-btn self-end" size="sm">OK</Button>
						{/snippet}
					</Dialog.Close>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</span>
	<span class="hidden items-center pointer:inline-flex">
		<Tooltip.Provider>
			<Tooltip.Root delayDuration={100}>
				<Tooltip.Trigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="text-muted-foreground hover:text-secondary-foreground"
							aria-label={label}
						>
							{#if type === 'info'}
								<InfoIcon size={iconSize} />
							{:else}
								<CircleHelpIcon size={iconSize} />
							{/if}
						</button>
					{/snippet}
				</Tooltip.Trigger>
				<Tooltip.Content
					sideOffset={8}
					class="max-w-80 border-muted p-3 text-left text-sm shadow-lg"
				>
					{#if text}
						<p>{text}</p>
					{:else}
						{@render children?.()}
					{/if}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</span>
{/if}
