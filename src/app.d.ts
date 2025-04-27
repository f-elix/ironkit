// See https://svelte.dev/docs/kit/types#app.d.ts

import type { Component } from 'svelte';

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			metaData?: {
				title?: string;
				Icon?: Component;
			};
		}
		interface PageState {
			toolHref?: string;
		}
		// interface Platform {}
	}
}

export {};
