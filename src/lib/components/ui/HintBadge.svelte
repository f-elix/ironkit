<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import InfoIcon from '@lucide/svelte/icons/info';
	import CircleHelpIcon from '@lucide/svelte/icons/circle-help';
	import Button from '$lib/components/ui/button/button.svelte';

	let { type = 'info', text }: { type?: 'info' | 'help'; text: string } = $props();

	const label = type === 'info' ? 'More information' : 'Help';
	const iconSize = 16;
</script>

{#if text}
	<span class="touch:inline-flex hidden items-center">
		<Dialog.Root>
			<Dialog.Trigger>
				{#snippet child({ props })}
					<button {...props} type="button" class="text-muted-foreground" aria-label={label}>
						{#if type === 'info'}
							<InfoIcon size={16} />
						{:else}
							<CircleHelpIcon size={16} />
						{/if}
					</button>
				{/snippet}
			</Dialog.Trigger>
			<Dialog.Content
				class="max-w-72 rounded-sm border-none bg-accent p-4 text-secondary-foreground [&_[data-dialog-close]:not(.close-btn)]:hidden"
			>
				<div class="flex flex-col gap-8">
					<p>{text}</p>
					<Dialog.Close>
						{#snippet child({ props })}
							<Button {...props} class="close-btn self-end" size="sm">OK</Button>
						{/snippet}
					</Dialog.Close>
				</div>
			</Dialog.Content>
		</Dialog.Root>
	</span>
	<span class="pointer:inline-flex hidden items-center">
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
				<Tooltip.Content sideOffset={8} class="max-w-80 border-muted p-3 text-sm shadow-lg">
					{text}
				</Tooltip.Content>
			</Tooltip.Root>
		</Tooltip.Provider>
	</span>
{/if}
