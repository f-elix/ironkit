import { fontFamily } from 'tailwindcss/defaultTheme';
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';
import plugin from 'tailwindcss/plugin';

const gridStack = plugin(({ addUtilities }) => {
	addUtilities({
		['.grid-stack']: {
			'grid-template': '100% / 100%',
			['> *']: {
				'grid-area': '1 / 1'
			}
		}
	});
});

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			screens: {
				touch: { raw: '(pointer: coarse)' },
				pointer: { raw: '(hover: hover) and (pointer: fine)' }
			},
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
					foreground: 'hsl(var(--primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary) / <alpha-value>)',
					foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				'kg-plate': {
					red: '#b13b46',
					blue: '#204577',
					yellow: '#d4ab05',
					green: '#00990b',
					white: '#e6e8e7',
					black: '#060505',
					silver: '#c8c9cb'
				}
			},
			borderRadius: {
				xl: 'calc(var(--radius) + 4px)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--bits-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--bits-accordion-content-height)' },
					to: { height: '0' }
				},
				'caret-blink': {
					'0%,70%,100%': { opacity: '1' },
					'20%,50%': { opacity: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'caret-blink': 'caret-blink 1.25s ease-out infinite'
			},
			transitionTimingFunction: {
				'out-quad': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
				'in-out-quad': 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
				'in-cubic': 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
				'out-cubic': 'cubic-bezier(0.215, 0.61, 0.355, 1)',
				'in-out-cubic': 'cubic-bezier(0.645, 0.045, 0.355, 1)',
				'in-quart': 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
				'out-quart': 'cubic-bezier(0.165, 0.84, 0.44, 1)',
				'in-out-quart': 'cubic-bezier(0.77, 0, 0.175, 1)',
				'in-quint': 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
				'out-quint': 'cubic-bezier(0.23, 1, 0.32, 1)',
				'in-expo': 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
				'out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
				'in-out-expo': 'cubic-bezier(1, 0, 0, 1)',
				'in-circ': 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
				'out-circ': 'cubic-bezier(0.075, 0.82, 0.165, 1)',
				'in-out-circ': 'cubic-bezier(0.785, 0.135, 0.15, 0.86)',
				'in-back': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
				'out-back': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
				'in-out-back': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
				'back-in': 'cubic-bezier(0.6, -0.28, 0.735, 0.045)',
				'bounce-light': 'cubic-bezier(0, 1.1, 1, 1.1)'
			}
		}
	},
	plugins: [tailwindcssAnimate, gridStack]
};

export default config;
