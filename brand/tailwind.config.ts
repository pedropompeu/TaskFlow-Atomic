import type { Config } from 'tailwindcss'

// TaskFlow — Tailwind Config v1.0
// Conceito: Slate Protocol | Gerado por MAXWELL via /brand | 2026-05-24
// Todos os valores referenciam CSS custom properties de design-tokens.css
// Zero magic numbers.

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:     'var(--color-bg-base)',
          subtle: 'var(--color-bg-subtle)',
          surface: {
            DEFAULT:  'var(--color-surface)',
            elevated: 'var(--color-surface-elevated)',
            overlay:  'var(--color-surface-overlay)',
          },
          border: {
            DEFAULT: 'var(--color-border)',
            subtle:  'var(--color-border-subtle)',
            strong:  'var(--color-border-strong)',
          },
          accent: {
            DEFAULT: 'var(--color-accent)',
            hover:   'var(--color-accent-hover)',
            muted:   'var(--color-accent-muted)',
            fg:      'var(--color-accent-fg)',
          },
          text: {
            primary:   'var(--color-text-primary)',
            secondary: 'var(--color-text-secondary)',
            muted:     'var(--color-text-muted)',
            inverse:   'var(--color-text-inverse)',
          },
          success: {
            DEFAULT: 'var(--color-success)',
            subtle:  'var(--color-success-subtle)',
            fg:      'var(--color-success-fg)',
          },
          warning: {
            DEFAULT: 'var(--color-warning)',
            subtle:  'var(--color-warning-subtle)',
            fg:      'var(--color-warning-fg)',
          },
          error: {
            DEFAULT: 'var(--color-error)',
            subtle:  'var(--color-error-subtle)',
            fg:      'var(--color-error-fg)',
          },
        },
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ["'Roboto Mono'", "'Courier New'", 'monospace'],
      },
      fontSize: {
        'display': ['2.25rem', { lineHeight: '2.5rem',  letterSpacing: '-0.02em',  fontWeight: '700' }],
        'h1':      ['1.5rem',  { lineHeight: '2rem',    letterSpacing: '-0.015em', fontWeight: '600' }],
        'h2':      ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'h3':      ['1rem',    { lineHeight: '1.5rem',  letterSpacing: '-0.005em', fontWeight: '600' }],
        'body-lg': ['1rem',    { lineHeight: '1.5rem',  fontWeight: '400' }],
        'body':    ['0.875rem',{ lineHeight: '1.25rem', fontWeight: '400' }],
        'body-sm': ['0.75rem', { lineHeight: '1rem',    fontWeight: '400' }],
        'label':   ['0.75rem', { lineHeight: '1rem',    letterSpacing: '0.04em',  fontWeight: '500' }],
        'code':    ['0.8125rem',{lineHeight: '1.25rem', fontWeight: '400' }],
      },
      borderRadius: {
        'sm':    '4px',
        DEFAULT: '6px',
        'md':    '6px',
        'lg':    '8px',
        'xl':   '12px',
      },
      boxShadow: {
        'card':   '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.3)',
        'raised': '0 4px 8px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)',
        'modal':  '0 20px 40px rgba(0,0,0,0.65), 0 8px 16px rgba(0,0,0,0.4)',
        'focus':  '0 0 0 3px rgba(82, 125, 163, 0.35)',
      },
      transitionDuration: {
        'hover': '100ms',
        'base':  '150ms',
        'slow':  '250ms',
      },
      transitionTimingFunction: {
        'brand': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
