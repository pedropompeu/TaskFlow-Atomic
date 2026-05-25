import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    screens: {
      xs: '480px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        atomic: {
          purple: '#A559FD',
          orange: '#F78E2F',
          yellow: '#FDCC32',
          blue: '#1D84B7',
          green: '#43AC8D',
          dark: '#1D1D1B',
          light: '#FBFBFB',
          ice: '#E8F0F4',
          gray: {
            300: '#D9D9D9',
            500: '#999999',
            600: '#7A7A7A',
          },
        },
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
        sans:    ['var(--font-roboto)', 'system-ui', 'sans-serif'],
        heading: ['var(--font-cabin)',  'system-ui', 'sans-serif'],
        mono:    ["'Roboto Mono'", "'Courier New'", 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        'brand-card':       'var(--shadow-card)',
        'brand-card-hover': 'var(--shadow-card-hover)',
        'brand-raised':     'var(--shadow-raised)',
        'brand-modal':      'var(--shadow-modal)',
        'brand-focus':      'var(--shadow-focus)',
      },
    },
  },
  plugins: [],
};

export default config;
