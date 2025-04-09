<script lang="ts">
	import '../app.css';
	import { ModeWatcher } from 'mode-watcher';
	import Header from '$lib/components/app/Header.svelte';
	import Head from '$lib/components/app/Head.svelte';

	let { children } = $props();
</script>

<ModeWatcher />
<Head />
<Header />
{@render children()}
