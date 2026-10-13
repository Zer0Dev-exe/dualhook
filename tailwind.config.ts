import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', 'Consolas', 'monospace'],
      },
      colors: {
        bg: '#0d0f12',
        panel: { DEFAULT: '#14161b', 2: '#1a1d23', 3: '#21252c' },
        line: { DEFAULT: '#272b33', 2: '#333944' },
        fg: '#e4e6eb',
        muted: '#8f96a3',
        v1: { DEFAULT: '#5865f2', soft: '#9aa2ff' },
        v2: { DEFAULT: '#2dc770', soft: '#6fe3a0' },
        // color del modo activo (cambia con data-mode en <html>)
        mode: 'rgb(var(--mode) / <alpha-value>)',
        dc: {
          bg: '#313338',
          hover: '#2e3035',
          embed: '#2b2d31',
          dark: '#1e1f22',
          border: '#3f4147',
          text: '#dbdee1',
          muted: '#949ba4',
          link: '#00a8fc',
          blurple: '#5865f2',
          grey: '#4e5058',
          green: '#248046',
          red: '#da373c',
        },
      },
      keyframes: {
        'slide-in': { from: { transform: 'translateX(32px)', opacity: '0' } },
        'fade-in': { from: { opacity: '0' } },
        'zoom-in': { from: { transform: 'scale(.97)', opacity: '0' } },
      },
      animation: {
        'slide-in': 'slide-in .18s ease-out',
        'fade-in': 'fade-in .15s ease-out',
        'zoom-in': 'zoom-in .15s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
