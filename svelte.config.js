import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			runtime: 'edge'
		}),
		typescript: {
			config: (config) => {
				config.exclude.push('../src/lib/shadcn/**/*');
				return config;
			}
		},
		alias: {
			$convex: 'src/convex',
			$triplit: 'triplit',
			$routes: 'src/routes'
		}
	},
	vitePlugin: {
		inspector: true
	}
};

export default config;
