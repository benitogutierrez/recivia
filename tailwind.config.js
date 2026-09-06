/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#141b2d',
          soft: '#334059',
          faint: '#7c8aa3',
        },
        surface: {
          DEFAULT: '#ffffff',
          sunk: '#f6f7fb',
          muted: '#eef1f7',
        },
        line: {
          DEFAULT: '#e7eaf2',
          soft: '#f0f2f7',
        },
        brand: {
          50: '#eef4ff',
          100: '#dfe8ff',
          200: '#c1d1ff',
          300: '#96b0ff',
          400: '#6685ff',
          500: '#3e5eff',
          600: '#2c40ec',
          700: '#242fc4',
          800: '#212b9c',
          900: '#1f2a7a',
          950: '#0f1440',
        },
        mint: {
          50: '#eafcf4',
          100: '#cef7e3',
          200: '#a0edcd',
          300: '#67dcb2',
          400: '#35c294',
          500: '#17a67c',
          600: '#0d8567',
          700: '#0b6a56',
          800: '#0a5546',
          900: '#09463b',
        },
        amber: {
          50: '#fff8ea',
          100: '#ffecc6',
          400: '#f5a524',
          500: '#dc8a0e',
          600: '#b56d09',
        },
        plum: {
          50: '#f6f2ff',
          100: '#ece2ff',
          400: '#9b6cf0',
          500: '#8248e0',
          600: '#6b32c4',
        },
        navy: {
          950: '#0b1120',
          900: '#0f1830',
          800: '#16213d',
          700: '#1e2c4d',
          600: '#2a3b5f',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(20,27,45,0.04), 0 8px 24px -8px rgba(20,27,45,0.08)',
        card: '0 1px 2px rgba(20,27,45,0.04), 0 12px 32px -12px rgba(20,27,45,0.12)',
        pop: '0 20px 60px -15px rgba(20,27,45,0.35)',
        glow: '0 0 0 1px rgba(62,94,255,0.08), 0 8px 30px -8px rgba(62,94,255,0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0, transform: 'translateY(6px)' }, to: { opacity: 1, transform: 'none' } },
        'scale-in': { from: { opacity: 0, transform: 'scale(0.96)' }, to: { opacity: 1, transform: 'scale(1)' } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(14px)' }, to: { opacity: 1, transform: 'none' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'pulse-slow': { '0%,100%': { opacity: 0.6, transform: 'scale(1)' }, '50%': { opacity: 1, transform: 'scale(1.08)' } },
      },
      animation: {
        'fade-in': 'fade-in .45s cubic-bezier(.16,1,.3,1) both',
        'scale-in': 'scale-in .25s cubic-bezier(.16,1,.3,1) both',
        'slide-up': 'slide-up .5s cubic-bezier(.16,1,.3,1) both',
        shimmer: 'shimmer 2.5s linear infinite',
        'pulse-slow': 'pulse-slow 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
