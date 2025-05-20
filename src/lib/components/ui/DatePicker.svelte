<script lang="ts">
	import CalendarIcon from '@lucide/svelte/icons/calendar';
	import { DateFormatter, type DateValue, getLocalTimeZone } from '@internationalized/date';
	import { buttonVariants } from '$lib/shadcn/button';
	import { Calendar } from '$lib/shadcn/calendar';
	import * as Popover from '$lib/shadcn/popover';

	const df = new DateFormatter('en-US', {
		dateStyle: 'long'
	});

	let { value = $bindable() }: { value: DateValue } = $props();

	let open = $state(false);
</script>

<Popover.Root bind:open>
	<Popover.Trigger class={buttonVariants({ variant: 'outline', class: 'justify-start text-left' })}>
		<CalendarIcon class="size-4" />
		{value ? df.format(value.toDate(getLocalTimeZone())) : 'Pick a date'}
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
