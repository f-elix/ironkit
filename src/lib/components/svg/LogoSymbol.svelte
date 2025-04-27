<script lang="ts">
	import type { SVGAttributes } from 'svelte/elements';

	let props: SVGAttributes<SVGSVGElement> = $props();
</script>

<svg
	{...props}
	width="65"
	height="65"
	viewBox="0 0 65 65"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<circle cx="32.2212" cy="32.3709" r="30" fill="#030712" stroke="#F9FAFB" stroke-width="4" />
	<path
		d="M40.9963 51.2205H23.4463V46.6797L28.1443 44.5677V20.1741L23.4463 18.0621V13.5213H40.9963V18.0621L36.2983 20.1741V44.5677L40.9963 46.6797V51.2205Z"
		fill="#F9FAFB"
	/>
</svg>
