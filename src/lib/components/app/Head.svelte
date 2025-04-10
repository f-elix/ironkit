<script lang="ts">
	import { page } from '$app/state';
	import { APP_TITLE } from '$lib/constants';

	let toolTitle = $derived(page.data.tool?.title);
	let title = $derived([toolTitle, APP_TITLE].filter(Boolean).join(' - '));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content="Tools for lifters" />
</svelte:head>
