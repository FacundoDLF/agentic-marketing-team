import type { Config } from 'tailwindcss'

/**
 * Tailwind CSS Configuration
 *
 * Maps CSS custom properties (design tokens from main.css)
 * to Tailwind utility classes.
 *
 * This enables using classes like `bg-sidebar`, `text-primary`, etc.
 * that resolve to the oklch tokens defined in :root.
 */
export default {
  content: [
    './app/**/*.vue',
    './shared/**/*.vue',
    './widgets/**/*.vue',
    './features/**/*.vue',
    './entities/**/*.vue',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'calc(var(--radius) * 0.6)',
        md: 'calc(var(--radius) * 0.8)',
        lg: 'var(--radius)',
        xl: 'calc(var(--radius) * 1.4)',
        '2xl': 'calc(var(--radius) * 1.8)',
        '3xl': 'calc(var(--radius) * 2.2)',
        '4xl': 'calc(var(--radius) * 2.6)',
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        card: {
          DEFAULT: 'var(--card)',
          foreground: 'var(--card-foreground)',
        },
        popover: {
          DEFAULT: 'var(--popover)',
          foreground: 'var(--popover-foreground)',
        },
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
        },
        secondary: {
          DEFAULT: 'var(--secondary)',
          foreground: 'var(--secondary-foreground)',
        },
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
        chart: {
          1: 'var(--chart-1)',
          2: 'var(--chart-2)',
          3: 'var(--chart-3)',
          4: 'var(--chart-4)',
          5: 'var(--chart-5)',
        },
        sidebar: {
          DEFAULT: 'var(--sidebar)',
          foreground: 'var(--sidebar-foreground)',
          primary: {
            DEFAULT: 'var(--sidebar-primary)',
            foreground: 'var(--sidebar-primary-foreground)',
          },
          accent: {
            DEFAULT: 'var(--sidebar-accent)',
            foreground: 'var(--sidebar-accent-foreground)',
          },
          border: 'var(--sidebar-border)',
          ring: 'var(--sidebar-ring)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
