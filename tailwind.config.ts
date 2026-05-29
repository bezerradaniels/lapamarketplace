import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Lapa Marketplace brand tokens */
        z: {
          primary: '#0ea5e9',
          secondary: '#0284c7',
          red: '#dc2626',
          white: '#ffffff',
          green: '#10b981',
          'green-hover': '#059669',
          'green-bg': '#ecfdf5',
          'green-fg': '#047857',
          lime: '#10b981',
          'lime-fg': '#064e3b',
          lilac: '#fad0f6',
          'lilac-fg': '#6b006b',
          rose: '#fee2e2',
          'rose-fg': '#dc2626',
          sky: '#bae6fd',
          'sky-fg': '#0284c7',
          amber: '#fde68a',
          'amber-fg': '#b45309',
          bg: '#f8fafc',
          bg2: '#ffffff',
          ink: '#1e293b',
          text: '#1e293b',
          'text-muted': '#334155',
          'text-hint': '#64748b',
          border: 'rgba(30,41,59,0.12)',
          sidebar: '#0c4a6e',
          'sidebar-icon': '#67e8f9',
        },
        /* Per-store dynamic primary (catalog theme) */
        'store-primary': 'var(--color-primary)',
        'store-primary-fg': 'var(--color-primary-fg)',
        'store-primary-hover': 'var(--color-primary-hover)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['DM Sans', ...fontFamily.sans],
        display: ['DM Sans', ...fontFamily.sans],
      },
      letterSpacing: {
        tightest: '-0.04em',
        tighter: '-0.025em',
        tight: '-0.015em',
      },
      boxShadow: {
        z: 'none',
        'z-lg': 'none',
        'z-pop': 'none',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [animate],
}

export default config
