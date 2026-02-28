import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter(),
		typescript: {
			config: (config) => {
				config.exclude.push('../src/lib/shadcn/**/*');
				config.include.push('../scripts/**/*');
				return config;
			}
		},
		alias: {
			$routes: 'src/routes'
		}
	},
	vitePlugin: {
		inspector: true
	}
};

export default config;
