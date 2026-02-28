import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import oxlint from 'eslint-plugin-oxlint';
import { defineConfig } from 'eslint/config';

const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default defineConfig([
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	prettier,
	...ts.configs.recommended,
	...svelte.configs.recommended,
	...svelte.configs.prettier,
	...oxlint.configs['flat/recommended'],
	{
		files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
		languageOptions: {
			globals: { ...globals.browser, ...globals.node },
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'],
				parser: ts.parser
			}
		},
		rules: {
			'no-undef': 'off',
			'@typescript-eslint/no-unused-vars': [
				'warn',
				{
					argsIgnorePattern: '^_',
					caughtErrorsIgnorePattern: '^_'
				}
			],
			'@typescript-eslint/explicit-module-boundary-types': 'off',
			'@typescript-eslint/consistent-type-definitions': 'off',
			'@typescript-eslint/array-type': 'off',
			'@typescript-eslint/consistent-indexed-object-style': 'off',
			'@typescript-eslint/prefer-for-of': 'off',
			'no-console': ['error', { allow: ['warn', 'error', 'dir'] }],
			'no-implied-eval': 'error',
			'no-eval': 'error',
			curly: 'error',
			'no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'svelte/no-at-html-tags': 'off',
			'svelte/require-each-key': 'off'
		}
	},
	{
		ignores: [
			'src/lib/shadcn',
			'**/*.ts',
			'**/*.js',
			'**/*.tsx',
			'**/*.jsx',
			'**/*.mjs',
			'**/*.cjs'
		]
	}
]);
