<script lang="ts">
	import type { Snippet } from 'svelte';

	let { input, output, settings }: { input?: Snippet; output?: Snippet; settings?: Snippet } =
		$props();

	let outputIdList = $state('');

	const setup = (form: HTMLFormElement) => {
		form.addEventListener('submit', (e) => {
			e.preventDefault();
		});
		outputIdList = Array.from(form.elements)
			.map((el) => el.id)
			.join(' ');
	};
</script>

<!-- Use flex-col-reverse to preserve the layout while making sure the form elements receive focused first when in a dialog -->
<div class="flex grow flex-col-reverse">
	<form use:setup class="relative mt-auto flex flex-col items-center gap-8" novalidate>
		{@render input?.()}
		<div
			class={[
				'bg-popover self-stretch rounded-t-lg p-4 pt-6 backdrop-blur-xl',
				'ease-out-expo animate-in slide-in-from-bottom-full duration-700'
			]}
		>
			{@render settings?.()}
		</div>
	</form>
	<output for={outputIdList} class="px-4 pb-2">
		{@render output?.()}
	</output>
</div>
