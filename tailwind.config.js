/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Stitch "Warm Glass Analytics" palette ──────────────────────
        background:                '#fef9f1',
        surface:                   '#fef9f1',
        'surface-dim':             '#ded9d2',
        'surface-bright':          '#fef9f1',
        'surface-container-lowest':'#ffffff',
        'surface-container-low':   '#f8f3eb',
        'surface-container':       '#f2ede5',
        'surface-container-high':  '#ece8e0',
        'surface-container-highest':'#e7e2da',
        'on-surface':              '#1d1c17',
        'on-surface-variant':      '#57423e',
        'inverse-surface':         '#32302b',
        'inverse-on-surface':      '#f5f0e8',
        outline:                   '#8a716d',
        'outline-variant':         '#dec0ba',
        // Primary — deep red/salmon
        primary:                   '#a43c2a',
        'on-primary':              '#ffffff',
        'primary-container':       '#e76d57',
        'on-primary-container':    '#5c0600',
        'inverse-primary':         '#ffb4a6',
        'primary-fixed':           '#ffdad3',
        'primary-fixed-dim':       '#ffb4a6',
        // Secondary — carafe / warm brown
        secondary:                 '#79564a',
        'on-secondary':            '#ffffff',
        'secondary-container':     '#fed0c0',
        'on-secondary-container':  '#79574b',
        'secondary-fixed':         '#ffdbcf',
        'secondary-fixed-dim':     '#e9bdae',
        'on-secondary-fixed':      '#2d150c',
        'on-secondary-fixed-variant':'#5e3f34',
        // Tertiary — muted green
        tertiary:                  '#526350',
        'on-tertiary':             '#ffffff',
        'tertiary-container':      '#859781',
        'on-tertiary-container':   '#1f2f1f',
        'tertiary-fixed':          '#d5e8cf',
        'tertiary-fixed-dim':      '#b9ccb4',
        'on-tertiary-fixed':       '#101f10',
        'on-tertiary-fixed-variant':'#3b4b39',
        // Error
        error:                     '#ba1a1a',
        'on-error':                '#ffffff',
        'error-container':         '#ffdad6',
        'on-error-container':      '#93000a',
        // Surface tint
        'surface-tint':            '#a43c2a',
        'on-background':           '#1d1c17',
        'surface-variant':         '#e7e2da',
      },
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        gutter: '24px',
      },
      borderRadius: {
        xl: '1.5rem',
      },
      boxShadow: {
        salmon:    '0 4px 20px rgba(231,109,87,0.3)',
        'salmon-lg':'0 10px 30px rgba(231,109,87,0.4)',
        glass:     '0 4px 20px rgba(32,19,21,0.04)',
      },
    },
  },
  plugins: [],
}
