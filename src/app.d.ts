// See https://svelte.dev/docs/kit/types#app.d.ts

// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		interface PageData {
			metaData?: {
				title?: string;
			};
		}
		interface PageState {
			toolHref?: string;
		}
		// interface Platform {}
	}
}

export {};
