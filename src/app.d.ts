// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Tool } from '$lib/data/tools';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			tool?: Tool;
		}
		interface PageState {
			toolHref?: string;
		}
		// interface Platform {}
	}
}

export {};
