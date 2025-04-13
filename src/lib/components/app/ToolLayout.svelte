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

<div class="flex grow flex-col">
	<output for={outputIdList} class="px-4 pb-2">
		{@render output?.()}
	</output>
	<form use:setup class="mt-auto flex flex-col items-center gap-8" novalidate>
		{@render input?.()}
		<div
			class={[
				'self-stretch rounded-t-lg bg-muted/30 p-4 pt-6',
				'duration-700 ease-out-expo animate-in slide-in-from-bottom-full'
			]}
		>
			{@render settings?.()}
		</div>
	</form>
</div>
