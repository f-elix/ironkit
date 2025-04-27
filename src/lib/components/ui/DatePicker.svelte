<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { cn } from '$lib/shadcn/utils';
	import { Button } from '$lib/shadcn/button';
	import { Calendar } from '$lib/shadcn/calendar';
	import * as Popover from '$lib/shadcn/popover';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let { value = $bindable() }: { value: DateValue } = $props();

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				variant="outline"
				class={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
				{...props}
			>
				<CalendarIcon class="mr-2 h-4 w-4" />
				{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0">
		<Calendar
			type="single"
			bind:value
			initialFocus
			onValueChange={() => {
				open = false;
			}}
		/>
	</Popover.Content>
</Popover.Root>
